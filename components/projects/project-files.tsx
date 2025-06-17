"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { FileText, Download, Share2, Eye, Edit, Trash2, Plus, Search, Filter, Upload, Folder, File } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { format } from "date-fns"

interface ProjectFilesProps {
  projectId: string
  project: any
}

interface Document {
  _id: string
  title: string
  content: string
  category: string
  tags: string[]
  fileType: string
  size: number
  projectId?: string
  createdAt: string
  updatedAt: string
  userId: string
}

const fileTypeIcons = {
  text: File,
  markdown: FileText,
  code: FileText,
  other: File
}

const fileTypeColors = {
  text: "text-blue-400",
  markdown: "text-green-400", 
  code: "text-purple-400",
  other: "text-gray-400"
}

export function ProjectFiles({ projectId, project }: ProjectFilesProps) {
  const [documents, setDocuments] = useState<Document[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedFileType, setSelectedFileType] = useState("all")
  const [viewingDocument, setViewingDocument] = useState<Document | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)

  const categories = ["Work", "Personal", "Projects", "Notes", "Code", "Documentation", "Templates", "Archive"]
  const fileTypes = ["text", "markdown", "code", "other"]

  useEffect(() => {
    fetchDocuments()
  }, [projectId])

  const fetchDocuments = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/documents?projectId=${projectId}`)
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

  const deleteDocument = async (documentId: string) => {
    try {
      const response = await fetch(`/api/documents/${documentId}`, {
        method: "DELETE",
      })
      
      if (response.ok) {
        setDocuments(prev => prev.filter(d => d._id !== documentId))
      }
    } catch (error) {
      console.error("Error deleting document:", error)
    }
  }

  const viewDocument = (document: Document) => {
    setViewingDocument(document)
    setIsViewDialogOpen(true)
  }

  const downloadDocument = (document: Document) => {
    const blob = new Blob([document.content], { type: 'text/plain' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.style.display = 'none'
    a.href = url
    a.download = `${document.title}.${document.fileType === 'markdown' ? 'md' : 'txt'}`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesCategory = selectedCategory === "all" || doc.category === selectedCategory
    const matchesFileType = selectedFileType === "all" || doc.fileType === selectedFileType
    
    return matchesSearch && matchesCategory && matchesFileType
  })

  const groupedDocuments = filteredDocuments.reduce((acc, doc) => {
    const category = doc.category || "Uncategorized"
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(doc)
    return acc
  }, {} as Record<string, Document[]>)

  const totalSize = documents.reduce((sum, doc) => sum + (doc.size || 0), 0)
  const documentsThisMonth = documents.filter(doc => {
    const docDate = new Date(doc.createdAt)
    const now = new Date()
    return docDate.getMonth() === now.getMonth() && docDate.getFullYear() === now.getFullYear()
  }).length

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-700/50 rounded-lg animate-pulse"></div>
          ))}
        </div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-700/50 rounded-lg animate-pulse"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="bg-gray-800/60 backdrop-blur-xl border border-gray-700/50 shadow-xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-green-500/20 rounded-xl ring-1 ring-green-500/30">
                <FileText className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <CardTitle className="text-white">Project Files</CardTitle>
                <p className="text-gray-400 text-sm">Manage documents and assets for {project.name}</p>
              </div>
            </div>
            
            <Button
              onClick={() => window.open(`/dashboard/documents?projectId=${projectId}&action=add`, '_blank')}
              className="bg-green-600 hover:bg-green-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Document
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gray-800/60 backdrop-blur-xl border border-gray-700/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Documents</p>
                <p className="text-2xl font-bold text-white">{documents.length}</p>
              </div>
              <Folder className="w-8 h-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/60 backdrop-blur-xl border border-gray-700/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Size</p>
                <p className="text-2xl font-bold text-white">{formatFileSize(totalSize)}</p>
              </div>
              <Upload className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/60 backdrop-blur-xl border border-gray-700/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">This Month</p>
                <p className="text-2xl font-bold text-white">{documentsThisMonth}</p>
              </div>
              <FileText className="w-8 h-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-gray-800/60 backdrop-blur-xl border border-gray-700/50">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search documents..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-gray-700/50 border-gray-600 text-white focus:border-blue-500"
                />
              </div>
            </div>
            
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-40 bg-gray-700/50 border-gray-600">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent className="bg-gray-700 border-gray-600">
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedFileType} onValueChange={setSelectedFileType}>
              <SelectTrigger className="w-40 bg-gray-700/50 border-gray-600">
                <SelectValue placeholder="File Type" />
              </SelectTrigger>
              <SelectContent className="bg-gray-700 border-gray-600">
                <SelectItem value="all">All Types</SelectItem>
                {fileTypes.map(type => (
                  <SelectItem key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Documents List */}
      {Object.keys(groupedDocuments).length === 0 ? (
        <Card className="bg-gray-800/60 backdrop-blur-xl border border-gray-700/50">
          <CardContent className="p-12 text-center">
            <FileText className="w-16 h-16 text-gray-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No Documents Found</h3>
            <p className="text-gray-400 mb-6">
              {searchTerm || selectedCategory !== "all" || selectedFileType !== "all" 
                ? "Try adjusting your filters or search terms."
                : "Start by creating your first document for this project."
              }
            </p>
            <Button
              onClick={() => window.open(`/dashboard/documents?projectId=${projectId}&action=add`, '_blank')}
              className="bg-green-600 hover:bg-green-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Document
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedDocuments).map(([category, docs]) => (
            <Card key={category} className="bg-gray-800/60 backdrop-blur-xl border border-gray-700/50">
              <CardHeader>
                <CardTitle className="text-white flex items-center space-x-2">
                  <Folder className="w-5 h-5 text-blue-400" />
                  <span>{category}</span>
                  <Badge variant="secondary" className="bg-gray-700">
                    {docs.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {docs.map((document) => {
                    const IconComponent = fileTypeIcons[document.fileType as keyof typeof fileTypeIcons] || File
                    const iconColor = fileTypeColors[document.fileType as keyof typeof fileTypeColors] || "text-gray-400"
                    
                    return (
                      <div
                        key={document._id}
                        className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg hover:bg-gray-700/50 transition-colors"
                      >
                        <div className="flex items-center space-x-4 flex-1 min-w-0">
                          <IconComponent className={`w-6 h-6 ${iconColor} flex-shrink-0`} />
                          
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-white truncate">
                              {document.title}
                            </h4>
                            <div className="flex items-center space-x-4 text-sm text-gray-400">
                              <span>{document.fileType.toUpperCase()}</span>
                              <span>{formatFileSize(document.size)}</span>
                              <span>{format(new Date(document.createdAt), "MMM dd, yyyy")}</span>
                            </div>
                          </div>

                          {document.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 max-w-xs">
                              {document.tags.slice(0, 3).map((tag, index) => (
                                <Badge 
                                  key={index} 
                                  variant="secondary" 
                                  className="text-xs bg-gray-600"
                                >
                                  {tag}
                                </Badge>
                              ))}
                              {document.tags.length > 3 && (
                                <Badge variant="secondary" className="text-xs bg-gray-600">
                                  +{document.tags.length - 3}
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center space-x-2 flex-shrink-0">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => viewDocument(document)}
                            className="text-gray-400 hover:text-blue-400"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => downloadDocument(document)}
                            className="text-gray-400 hover:text-green-400"
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => window.open(`/dashboard/documents?editId=${document._id}`, '_blank')}
                            className="text-gray-400 hover:text-yellow-400"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteDocument(document._id)}
                            className="text-gray-400 hover:text-red-400"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* View Document Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] bg-gray-800 border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-3">
              <FileText className="w-5 h-5 text-blue-400" />
              <span>{viewingDocument?.title}</span>
              <Badge variant="secondary" className="bg-gray-700">
                {viewingDocument?.fileType.toUpperCase()}
              </Badge>
            </DialogTitle>
          </DialogHeader>
          
          {viewingDocument && (
            <div className="space-y-4">
              <div className="flex items-center space-x-4 text-sm text-gray-400">
                <span>Category: {viewingDocument.category}</span>
                <span>Size: {formatFileSize(viewingDocument.size)}</span>
                <span>Created: {format(new Date(viewingDocument.createdAt), "MMM dd, yyyy")}</span>
              </div>
              
              {viewingDocument.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {viewingDocument.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="bg-gray-700">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
              
              <div className="bg-gray-900/50 rounded-lg p-4 max-h-96 overflow-y-auto">
                <pre className="text-gray-300 whitespace-pre-wrap text-sm">
                  {viewingDocument.content}
                </pre>
              </div>
              
              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => downloadDocument(viewingDocument)}
                  className="border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
                <Button
                  onClick={() => window.open(`/dashboard/documents?editId=${viewingDocument._id}`, '_blank')}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Document
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
