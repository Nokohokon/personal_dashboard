"use client"

import { useState, useEffect, Suspense } from "react"
import { useSession } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FileText, Upload, Download, Search, Folder, File, Trash2, Edit, Eye, Plus } from "lucide-react"

interface Document {
  _id: string
  title: string
  content: string
  category: string
  tags: string[]
  fileType: "text" | "markdown" | "code" | "other"
  size?: number
  projectId?: string
  createdAt: string
  updatedAt: string
}

function DocumentsContent() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [documents, setDocuments] = useState<Document[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedProjectId, setSelectedProjectId] = useState("all")
  
  // Dialog states
  const [isDocumentDialogOpen, setIsDocumentDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [editingDocument, setEditingDocument] = useState<Document | null>(null)
  const [viewingDocument, setViewingDocument] = useState<Document | null>(null)
    // Form states
  const [documentForm, setDocumentForm] = useState({
    title: "",
    content: "",
    category: "",
    tags: "",
    fileType: "text" as "text" | "markdown" | "code" | "other",
    projectId: ""
  })

  const categories = ["Work", "Personal", "Projects", "Notes", "Code", "Documentation", "Templates", "Archive"]
  const fileTypes = ["text", "markdown", "code", "other"]

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
    }
  }, [status, router])

  useEffect(() => {
    if (session) {
      fetchDocuments()
      fetchProjects()
    }
  }, [session])

  // Handle URL parameters for project filtering
  useEffect(() => {
    const projectIdFromUrl = searchParams.get("projectId")
    if (projectIdFromUrl) {
      setSelectedProjectId(projectIdFromUrl)
    }
  }, [searchParams])

  // Refetch documents when project filter changes
  useEffect(() => {
    if (session) {
      fetchDocuments()
    }
  }, [selectedProjectId, session])

  const fetchDocuments = async () => {
    try {
      const projectIdFromUrl = searchParams.get("projectId")
      const projectId = projectIdFromUrl || (selectedProjectId !== "all" ? selectedProjectId : null)
      
      let url = "/api/documents"
      if (projectId) {
        url += `?projectId=${projectId}`
      }
      
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setDocuments(data)
      }
    } catch (error) {
      console.error("Error fetching documents:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchProjects = async () => {
    try {
      const response = await fetch("/api/projects")
      if (response.ok) {
        const data = await response.json()
        setProjects(data)
      }
    } catch (error) {
      console.error("Error fetching projects:", error)
    }
  }

  const handleDocumentSubmit = async () => {
    if (!documentForm.title || !documentForm.content) return

    try {
      const method = editingDocument ? "PUT" : "POST"
      const url = editingDocument ? `/api/documents/${editingDocument._id}` : "/api/documents"
      
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...documentForm,
          tags: documentForm.tags.split(",").map(tag => tag.trim()).filter(Boolean)
        })
      })

      if (response.ok) {
        await fetchDocuments()
        setIsDocumentDialogOpen(false)
        resetDocumentForm()
      }
    } catch (error) {
      console.error("Error saving document:", error)
    }
  }
  const resetDocumentForm = () => {
    setDocumentForm({
      title: "",
      content: "",
      category: "",
      tags: "",
      fileType: "text",
      projectId: ""
    })
    setEditingDocument(null)
  }

  const editDocument = (document: Document) => {
    setDocumentForm({
      title: document.title,
      content: document.content,
      category: document.category,
      tags: document.tags.join(", "),
      fileType: document.fileType as "text" | "markdown" | "code" | "other",
      projectId: document.projectId || ""
    })
    setEditingDocument(document)
    setIsDocumentDialogOpen(true)
  }

  const viewDocument = (document: Document) => {
    setViewingDocument(document)
    setIsViewDialogOpen(true)
  }

  const deleteDocument = async (id: string) => {
    if (!confirm("Are you sure you want to delete this document?")) return

    try {
      const response = await fetch(`/api/documents/${id}`, {
        method: "DELETE"
      })

      if (response.ok) {
        await fetchDocuments()
      }    } catch (error) {
      console.error("Error deleting document:", error)
    }
  }

  const exportDocument = (doc: Document) => {
    const dataStr = JSON.stringify(doc, null, 2)
    const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(dataStr)
    
    const exportFileDefaultName = `${doc.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`
    
    const linkElement = window.document.createElement("a")
    linkElement.setAttribute("href", dataUri)
    linkElement.setAttribute("download", exportFileDefaultName)
    linkElement.click()
  }

  const getLinkedProject = (projectId?: string) => {
    if (!projectId) return null
    return projects.find(p => p._id === projectId)
  }

  const filteredDocuments = documents.filter(document => {
    const matchesSearch = document.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         document.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         document.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesCategory = selectedCategory === "all" || document.category === selectedCategory
    
    return matchesSearch && matchesCategory
  })

  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case "markdown":
        return <FileText className="h-5 w-5 text-blue-400" />
      case "code":
        return <File className="h-5 w-5 text-green-400" />
      default:
        return <FileText className="h-5 w-5 text-slate-400" />
    }
  }

  if (status === "loading" || isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  if (status === "unauthenticated") {
    return null
  }

  return (
    <div className="space-y-4 xs:space-y-5 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col xs:flex-row xs:justify-between xs:items-center gap-3 xs:gap-4">
          <div>
            <h1 className="text-2xl xs:text-3xl sm:text-4xl font-bold text-white">Documents</h1>
            <p className="text-slate-400 mt-1 text-sm xs:text-base sm:text-lg">Manage your documents and files</p>
          </div>
          <Button
            onClick={() => setIsDocumentDialogOpen(true)}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-sm xs:text-base w-full xs:w-auto"
          >
            <Plus className="h-3 w-3 xs:h-4 xs:w-4 mr-2" />
            New Document
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 xs:gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-3 w-3 xs:h-4 xs:w-4" />
            <Input
              placeholder="Search documents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 xs:pl-10 bg-slate-800 border-slate-700 text-white text-sm xs:text-base"
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full sm:w-48 bg-slate-800 border-slate-700 text-white text-sm xs:text-base">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map(category => (
                <SelectItem key={category} value={category}>{category}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 xs:gap-4 sm:gap-5">
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-3 xs:p-4">
              <div className="flex items-center space-x-2 xs:space-x-3">
                <FileText className="h-6 w-6 xs:h-7 xs:w-7 sm:h-8 sm:w-8 text-blue-400 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-lg xs:text-xl sm:text-2xl font-bold text-white truncate">{documents.length}</p>
                  <p className="text-xs xs:text-sm text-slate-400">Total Documents</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-3 xs:p-4">
              <div className="flex items-center space-x-2 xs:space-x-3">
                <Folder className="h-6 w-6 xs:h-7 xs:w-7 sm:h-8 sm:w-8 text-purple-400 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-lg xs:text-xl sm:text-2xl font-bold text-white truncate">
                    {new Set(documents.map(d => d.category)).size}
                  </p>
                  <p className="text-xs xs:text-sm text-slate-400">Categories</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-3 xs:p-4">
              <div className="flex items-center space-x-2 xs:space-x-3">
                <FileText className="h-6 w-6 xs:h-7 xs:w-7 sm:h-8 sm:w-8 text-green-400 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-lg xs:text-xl sm:text-2xl font-bold text-white truncate">
                    {documents.filter(d => d.fileType === "markdown").length}
                  </p>
                  <p className="text-xs xs:text-sm text-slate-400">Markdown Files</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-3 xs:p-4">
              <div className="flex items-center space-x-2 xs:space-x-3">
                <File className="h-6 w-6 xs:h-7 xs:w-7 sm:h-8 sm:w-8 text-yellow-400 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-lg xs:text-xl sm:text-2xl font-bold text-white truncate">
                    {documents.filter(d => d.fileType === "code").length}
                  </p>
                  <p className="text-xs xs:text-sm text-slate-400">Code Files</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Documents Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-3 3xl:grid-cols-4 gap-3 xs:gap-4 sm:gap-4 lg:gap-5 xl:gap-4 2xl:gap-5">
          {filteredDocuments.map((document) => (
            <Card key={document._id} className="bg-slate-800 border-slate-700 hover:border-slate-600 transition-colors">
              <CardHeader className="pb-2 xs:pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center space-x-2 min-w-0 flex-1">
                    {getFileIcon(document.fileType)}
                    <CardTitle className="text-base xs:text-lg text-white truncate">{document.title}</CardTitle>
                  </div>
                  <div className="flex items-center space-x-0.5 xs:space-x-1 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => viewDocument(document)}
                      className="h-7 w-7 xs:h-8 xs:w-8 text-slate-400 hover:text-white"
                    >
                      <Eye className="h-3 w-3 xs:h-4 xs:w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => editDocument(document)}
                      className="h-7 w-7 xs:h-8 xs:w-8 text-slate-400 hover:text-white"
                    >
                      <Edit className="h-3 w-3 xs:h-4 xs:w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => exportDocument(document)}
                      className="h-7 w-7 xs:h-8 xs:w-8 text-slate-400 hover:text-white"
                    >
                      <Download className="h-3 w-3 xs:h-4 xs:w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteDocument(document._id)}
                      className="h-7 w-7 xs:h-8 xs:w-8 text-slate-400 hover:text-red-400"
                    >
                      <Trash2 className="h-3 w-3 xs:h-4 xs:w-4" />
                    </Button>
                  </div>
                </div>
                <CardDescription className="text-slate-400 text-xs xs:text-sm">
                  {document.category} • {new Date(document.createdAt).toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="pt-0">
                <p className="text-slate-300 text-xs xs:text-sm mb-2 xs:mb-3 line-clamp-3 leading-relaxed">
                  {document.content.substring(0, 120)}...
                </p>
                
                <div className="flex flex-wrap gap-1 mb-2 xs:mb-3">
                  {document.tags.slice(0, 3).map((tag, index) => (
                    <span
                      key={index}
                      className="px-1.5 xs:px-2 py-0.5 xs:py-1 bg-slate-700 text-slate-300 text-xs rounded-md"
                    >
                      {tag}
                    </span>
                  ))}
                  {document.tags.length > 3 && (
                    <span className="px-1.5 xs:px-2 py-0.5 xs:py-1 bg-slate-700 text-slate-300 text-xs rounded-md">
                      +{document.tags.length - 3}
                    </span>
                  )}
                </div>

                {/* Project Link */}
                {document.projectId && (
                  <div className="mt-2">
                    {(() => {
                      const linkedProject = getLinkedProject(document.projectId)
                      return linkedProject ? (
                        <span className="inline-block px-1.5 xs:px-2 py-0.5 xs:py-1 text-xs rounded-full bg-orange-100 bg-orange-900/20 text-orange-800 text-orange-300">
                          📁 {linkedProject.name}
                        </span>
                      ) : (
                        <span className="inline-block px-1.5 xs:px-2 py-0.5 xs:py-1 text-xs rounded-full bg-gray-100 bg-gray-900/20 text-gray-800 text-gray-300">
                          📁 Project
                        </span>
                      )
                    })()}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredDocuments.length === 0 && (
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-6 xs:p-8 text-center">
              <FileText className="h-10 w-10 xs:h-12 xs:w-12 text-slate-600 mx-auto mb-3 xs:mb-4" />
              <h3 className="text-base xs:text-lg font-medium text-white mb-2">No documents found</h3>
              <p className="text-slate-400 mb-3 xs:mb-4 text-sm xs:text-base">
                {searchTerm || selectedCategory !== "all" 
                  ? "Try adjusting your search criteria" 
                  : "Create your first document to get started"}
              </p>
              {!searchTerm && selectedCategory === "all" && (
                <Button
                  onClick={() => setIsDocumentDialogOpen(true)}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-sm xs:text-base"
                >
                  <Plus className="h-3 w-3 xs:h-4 xs:w-4 mr-2" />
                  Create Document
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Create/Edit Document Dialog */}
        <Dialog open={isDocumentDialogOpen} onOpenChange={setIsDocumentDialogOpen}>
          <DialogContent className="bg-slate-800 border-slate-700 max-w-sm xs:max-w-md sm:max-w-lg lg:max-w-2xl mx-4">
            <DialogHeader>
              <DialogTitle className="text-white">
                {editingDocument ? "Edit Document" : "Create New Document"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title" className="text-slate-300">Title</Label>
                <Input
                  id="title"
                  value={documentForm.title}
                  onChange={(e) => setDocumentForm({ ...documentForm, title: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-white"
                  placeholder="Document title"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category" className="text-slate-300">Category</Label>
                  <Select
                    value={documentForm.category}
                    onValueChange={(value) => setDocumentForm({ ...documentForm, category: value })}
                  >
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-700 border-slate-600">
                      {categories.map(category => (
                        <SelectItem key={category} value={category}>{category}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="fileType" className="text-slate-300">File Type</Label>
                  <Select
                    value={documentForm.fileType}
                    onValueChange={(value: any) => setDocumentForm({ ...documentForm, fileType: value })}
                  >
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-700 border-slate-600">
                      {fileTypes.map(type => (
                        <SelectItem key={type} value={type}>
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>              <div>
                <Label htmlFor="tags" className="text-slate-300">Tags (comma separated)</Label>
                <Input
                  id="tags"
                  value={documentForm.tags}
                  onChange={(e) => setDocumentForm({ ...documentForm, tags: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-white"
                  placeholder="tag1, tag2, tag3"
                />
              </div>              <div>
                <Label htmlFor="project" className="text-slate-300">Project (optional)</Label>
                <Select 
                  value={documentForm.projectId || "no-project"} 
                  onValueChange={(value) => setDocumentForm({ ...documentForm, projectId: value === "no-project" ? "" : value })}
                >
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                    <SelectValue placeholder="Select project (optional)" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600">
                    <SelectItem value="no-project">No project</SelectItem>
                    {projects.map(project => (
                      <SelectItem key={project._id} value={project._id}>
                        📁 {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="content" className="text-slate-300">Content</Label>
                <Textarea
                  id="content"
                  value={documentForm.content}
                  onChange={(e) => setDocumentForm({ ...documentForm, content: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-white min-h-[300px]"
                  placeholder="Document content..."
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsDocumentDialogOpen(false)
                    resetDocumentForm()
                  }}
                  className="border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleDocumentSubmit}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                >
                  {editingDocument ? "Update" : "Create"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* View Document Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="bg-slate-800 border-slate-700 max-w-sm xs:max-w-md sm:max-w-lg lg:max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-white flex items-center space-x-2 text-base xs:text-lg">
                {viewingDocument && getFileIcon(viewingDocument.fileType)}
                <span className="truncate">{viewingDocument?.title}</span>
              </DialogTitle>
            </DialogHeader>
            {viewingDocument && (
              <div className="space-y-3 xs:space-y-4">
                <div className="flex flex-wrap items-center gap-2 xs:gap-4 text-xs xs:text-sm text-slate-400">
                  <span>Category: {viewingDocument.category}</span>
                  <span className="hidden xs:inline">•</span>
                  <span>Type: {viewingDocument.fileType}</span>
                  <span className="hidden xs:inline">•</span>
                  <span>Created: {new Date(viewingDocument.createdAt).toLocaleDateString()}</span>
                </div>
                
                <div className="flex flex-wrap gap-1 xs:gap-2">
                  {viewingDocument.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-1.5 xs:px-2 py-0.5 xs:py-1 bg-slate-700 text-slate-300 text-xs rounded-md"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="bg-slate-900 p-3 xs:p-4 rounded-lg border border-slate-700">
                  <pre className="text-slate-300 whitespace-pre-wrap text-xs xs:text-sm leading-relaxed">
                    {viewingDocument.content}
                  </pre>
                </div>

                <div className="flex flex-col xs:flex-row justify-end space-y-2 xs:space-y-0 xs:space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => exportDocument(viewingDocument)}
                    className="border-slate-600 text-slate-300 hover:bg-slate-700 text-sm xs:text-base w-full xs:w-auto"
                  >
                    <Download className="h-3 w-3 xs:h-4 xs:w-4 mr-2" />
                    Export
                  </Button>
                  <Button
                    onClick={() => {
                      setIsViewDialogOpen(false)
                      editDocument(viewingDocument)
                    }}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-sm xs:text-base w-full xs:w-auto"
                  >
                    <Edit className="h-3 w-3 xs:h-4 xs:w-4 mr-2" />
                    Edit
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  export default function DocumentsPage() {
    return (
      <Suspense fallback={
        <div className="min-h-screen bg-gray-900 text-white">
          <div className="container mx-auto px-6 py-8">
            <div className="animate-pulse space-y-6">
              <div className="h-8 w-64 bg-gray-700 rounded"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-48 bg-gray-700 rounded-lg"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      }>
        <DocumentsContent />
      </Suspense>
    )
  }
