"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { 
  FileText, 
  Download, 
  Share2, 
  Eye, 
  Edit, 
  Trash2, 
  Plus, 
  Search, 
  Filter, 
  Upload, 
  Folder, 
  File, 
  Star,
  Clock,
  Users,
  GitBranch,
  History,
  Link,
  Copy,
  MoreHorizontal,
  Archive,
  Tag,
  Grid,
  List,
  SortAsc,
  SortDesc,
  RefreshCw
} from "lucide-react"
import { format, formatDistanceToNow } from "date-fns"

interface ProjectFilesEnhancedProps {
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
  shared?: boolean
  starred?: boolean
  version?: number
  lastAccessed?: string
  collaborators?: string[]
}

interface FileVersion {
  _id: string
  documentId: string
  version: number
  title: string
  content: string
  createdAt: string
  createdBy: string
  changesSummary: string
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

const categoryColors = {
  'meeting-notes': 'bg-blue-500/20 text-blue-400',
  'documentation': 'bg-green-500/20 text-green-400',
  'requirements': 'bg-purple-500/20 text-purple-400',
  'research': 'bg-orange-500/20 text-orange-400',
  'other': 'bg-gray-500/20 text-gray-400'
}

export function ProjectFilesEnhanced({ projectId, project }: ProjectFilesEnhancedProps) {
  const [documents, setDocuments] = useState<Document[]>([])
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedFileType, setSelectedFileType] = useState("all")
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'size' | 'type'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [viewingDocument, setViewingDocument] = useState<Document | null>(null)
  const [editingDocument, setEditingDocument] = useState<Document | null>(null)
  const [showVersionHistory, setShowVersionHistory] = useState(false)
  const [versions, setVersions] = useState<FileVersion[]>([])
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([])
  const [showUpload, setShowUpload] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [newDocument, setNewDocument] = useState({
    title: "",
    content: "",
    category: "other",
    tags: "",
    fileType: "text"
  })

  useEffect(() => {
    fetchDocuments()
  }, [projectId])

  useEffect(() => {
    filterAndSortDocuments()
  }, [documents, searchTerm, selectedCategory, selectedFileType, sortBy, sortOrder])

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

  const filterAndSortDocuments = useCallback(() => {
    let filtered = documents.filter(doc => {
      const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          doc.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          doc.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      
      const matchesCategory = selectedCategory === "all" || doc.category === selectedCategory
      const matchesFileType = selectedFileType === "all" || doc.fileType === selectedFileType
      
      return matchesSearch && matchesCategory && matchesFileType
    })

    // Sort documents
    filtered.sort((a, b) => {
      let comparison = 0
      
      switch (sortBy) {
        case 'name':
          comparison = a.title.localeCompare(b.title)
          break
        case 'date':
          comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
          break
        case 'size':
          comparison = (a.size || 0) - (b.size || 0)
          break
        case 'type':
          comparison = a.fileType.localeCompare(b.fileType)
          break
      }
      
      return sortOrder === 'asc' ? comparison : -comparison
    })

    setFilteredDocuments(filtered)
  }, [documents, searchTerm, selectedCategory, selectedFileType, sortBy, sortOrder])

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const createDocument = async () => {
    try {
      setUploadProgress(25)
      const response = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newDocument,
          projectId,
          tags: newDocument.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
          size: newDocument.content.length
        })
      })

      setUploadProgress(75)
      
      if (response.ok) {
        await fetchDocuments()
        setNewDocument({ title: "", content: "", category: "other", tags: "", fileType: "text" })
        setShowUpload(false)
        setUploadProgress(100)
      }
    } catch (error) {
      console.error("Error creating document:", error)
    } finally {
      setTimeout(() => setUploadProgress(0), 1000)
    }
  }

  const updateDocument = async (docId: string, updates: Partial<Document>) => {
    try {
      const response = await fetch(`/api/documents/${docId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })

      if (response.ok) {
        await fetchDocuments()
        setEditingDocument(null)
      }
    } catch (error) {
      console.error("Error updating document:", error)
    }
  }

  const deleteDocument = async (docId: string) => {
    try {
      const response = await fetch(`/api/documents/${docId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await fetchDocuments()
        if (viewingDocument?._id === docId) {
          setViewingDocument(null)
        }
      }
    } catch (error) {
      console.error("Error deleting document:", error)
    }
  }

  const toggleStar = async (docId: string, starred: boolean) => {
    await updateDocument(docId, { starred: !starred })
  }

  const duplicateDocument = async (doc: Document) => {
    const duplicate = {
      title: `${doc.title} (Copy)`,
      content: doc.content,
      category: doc.category,
      tags: doc.tags,
      fileType: doc.fileType,
      projectId,
      size: doc.content.length
    }

    try {
      const response = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(duplicate)
      })

      if (response.ok) {
        await fetchDocuments()
      }
    } catch (error) {
      console.error("Error duplicating document:", error)
    }
  }

  const downloadDocument = (doc: Document) => {
    const blob = new Blob([doc.content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${doc.title}.${doc.fileType === 'markdown' ? 'md' : 'txt'}`
    a.click()
    URL.revokeObjectURL(url)
  }

  const shareDocument = async (docId: string) => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/documents/${docId}`)
      // Show toast or notification
    } catch (error) {
      console.error("Error sharing document:", error)
    }
  }

  const fetchVersionHistory = async (docId: string) => {
    try {
      const response = await fetch(`/api/documents/${docId}/versions`)
      if (response.ok) {
        const data = await response.json()
        setVersions(data)
        setShowVersionHistory(true)
      }
    } catch (error) {
      console.error("Error fetching version history:", error)
    }
  }

  const bulkAction = async (action: 'delete' | 'archive' | 'star', docIds: string[]) => {
    try {
      const promises = docIds.map(id => {
        switch (action) {
          case 'delete':
            return deleteDocument(id)
          case 'star':
            const doc = documents.find(d => d._id === id)
            return updateDocument(id, { starred: !doc?.starred })
          default:
            return Promise.resolve()
        }
      })
      
      await Promise.all(promises)
      setSelectedDocuments([])
    } catch (error) {
      console.error("Error performing bulk action:", error)
    }
  }

  const categories = Array.from(new Set(documents.map(doc => doc.category)))
  const fileTypes = Array.from(new Set(documents.map(doc => doc.fileType)))
  const totalSize = documents.reduce((sum, doc) => sum + (doc.size || 0), 0)

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-700/50 rounded-lg animate-pulse"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-48 bg-gray-700/50 rounded-lg animate-pulse"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Header */}
      <Card className="bg-gray-800/60 backdrop-blur-xl border border-gray-700/50 shadow-xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-green-500/20 rounded-xl ring-1 ring-green-500/30">
                <FileText className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <CardTitle className="text-white">Enhanced Project Files</CardTitle>
                <p className="text-gray-400 text-sm">Erweiterte Dateiverwaltung für {project.name}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Button
                onClick={() => setShowUpload(true)}
                className="bg-green-600 hover:bg-green-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Document
              </Button>
              
              <Button
                onClick={fetchDocuments}
                variant="outline"
                size="sm"
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Enhanced Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gray-800/60 backdrop-blur-xl border border-gray-700/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Files</p>
                <p className="text-2xl font-bold text-white">{documents.length}</p>
              </div>
              <FileText className="w-8 h-8 text-blue-400" />
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
              <Archive className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/60 backdrop-blur-xl border border-gray-700/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Categories</p>
                <p className="text-2xl font-bold text-white">{categories.length}</p>
              </div>
              <Folder className="w-8 h-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/60 backdrop-blur-xl border border-gray-700/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Starred</p>
                <p className="text-2xl font-bold text-white">{documents.filter(d => d.starred).length}</p>
              </div>
              <Star className="w-8 h-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Filters and Controls */}
      <Card className="bg-gray-800/60 backdrop-blur-xl border border-gray-700/50">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="flex flex-1 space-x-4 w-full lg:w-auto">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search files..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-gray-700/50 border-gray-600"
                />
              </div>
              
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-40 bg-gray-700/50 border-gray-600">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-700 border-gray-600">
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedFileType} onValueChange={setSelectedFileType}>
                <SelectTrigger className="w-32 bg-gray-700/50 border-gray-600">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-700 border-gray-600">
                  <SelectItem value="all">All Types</SelectItem>
                  {fileTypes.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1">
                <Button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  variant="outline"
                  size="sm"
                  className="border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  {sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
                </Button>
                
                <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                  <SelectTrigger className="w-24 bg-gray-700/50 border-gray-600">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-700 border-gray-600">
                    <SelectItem value="date">Date</SelectItem>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="size">Size</SelectItem>
                    <SelectItem value="type">Type</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-1 border-l border-gray-600 pl-2">
                <Button
                  onClick={() => setViewMode('grid')}
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  size="sm"
                  className="border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  <Grid className="w-4 h-4" />
                </Button>
                <Button
                  onClick={() => setViewMode('list')}
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="sm"
                  className="border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedDocuments.length > 0 && (
            <div className="flex items-center justify-between mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <span className="text-blue-400 text-sm">
                {selectedDocuments.length} file(s) selected
              </span>
              <div className="flex items-center space-x-2">
                <Button
                  onClick={() => bulkAction('star', selectedDocuments)}
                  variant="outline"
                  size="sm"
                  className="border-yellow-600 text-yellow-400 hover:bg-yellow-600/20"
                >
                  <Star className="w-4 h-4 mr-1" />
                  Star
                </Button>
                <Button
                  onClick={() => bulkAction('delete', selectedDocuments)}
                  variant="outline"
                  size="sm"
                  className="border-red-600 text-red-400 hover:bg-red-600/20"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Delete
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Files Display */}
      <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
        {filteredDocuments.map((document) => {
          const IconComponent = fileTypeIcons[document.fileType as keyof typeof fileTypeIcons] || File
          const iconColor = fileTypeColors[document.fileType as keyof typeof fileTypeColors] || "text-gray-400"
          const categoryStyle = categoryColors[document.category as keyof typeof categoryColors] || 'bg-gray-500/20 text-gray-400'

          if (viewMode === 'list') {
            return (
              <Card key={document._id} className="bg-gray-800/60 backdrop-blur-xl border border-gray-700/50 hover:border-gray-600/50 transition-all duration-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 flex-1">
                      <input
                        type="checkbox"
                        checked={selectedDocuments.includes(document._id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedDocuments([...selectedDocuments, document._id])
                          } else {
                            setSelectedDocuments(selectedDocuments.filter(id => id !== document._id))
                          }
                        }}
                        className="rounded border-gray-600 text-blue-600 focus:ring-blue-500"
                      />
                      
                      <div className="flex items-center space-x-3">
                        <IconComponent className={`w-5 h-5 ${iconColor}`} />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-white truncate">{document.title}</h3>
                          <div className="flex items-center space-x-4 text-sm text-gray-400 mt-1">
                            <span>{formatFileSize(document.size)}</span>
                            <span>{format(new Date(document.updatedAt), "MMM dd, yyyy")}</span>
                            <Badge variant="secondary" className={categoryStyle}>
                              {document.category}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      {document.starred && <Star className="w-4 h-4 text-yellow-400 fill-current" />}
                      
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setViewingDocument(document)}
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
                      
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-gray-400 hover:text-purple-400"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-gray-800 border-gray-700">
                          <DialogHeader>
                            <DialogTitle className="text-white">File Actions</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-2">
                            <Button
                              onClick={() => toggleStar(document._id, document.starred || false)}
                              variant="outline"
                              className="w-full justify-start border-gray-600 text-gray-300 hover:bg-gray-700"
                            >
                              <Star className="w-4 h-4 mr-2" />
                              {document.starred ? 'Unstar' : 'Star'}
                            </Button>
                            <Button
                              onClick={() => duplicateDocument(document)}
                              variant="outline"
                              className="w-full justify-start border-gray-600 text-gray-300 hover:bg-gray-700"
                            >
                              <Copy className="w-4 h-4 mr-2" />
                              Duplicate
                            </Button>
                            <Button
                              onClick={() => shareDocument(document._id)}
                              variant="outline"
                              className="w-full justify-start border-gray-600 text-gray-300 hover:bg-gray-700"
                            >
                              <Link className="w-4 h-4 mr-2" />
                              Copy Link
                            </Button>
                            <Button
                              onClick={() => fetchVersionHistory(document._id)}
                              variant="outline"
                              className="w-full justify-start border-gray-600 text-gray-300 hover:bg-gray-700"
                            >
                              <History className="w-4 h-4 mr-2" />
                              Version History
                            </Button>
                            <Button
                              onClick={() => deleteDocument(document._id)}
                              variant="outline"
                              className="w-full justify-start border-red-600 text-red-400 hover:bg-red-600/20"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          }

          return (
            <Card key={document._id} className="bg-gray-800/60 backdrop-blur-xl border border-gray-700/50 hover:border-gray-600/50 transition-all duration-200 group">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={selectedDocuments.includes(document._id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedDocuments([...selectedDocuments, document._id])
                        } else {
                          setSelectedDocuments(selectedDocuments.filter(id => id !== document._id))
                        }
                      }}
                      className="rounded border-gray-600 text-blue-600 focus:ring-blue-500"
                    />
                    <IconComponent className={`w-5 h-5 ${iconColor}`} />
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    {document.starred && <Star className="w-4 h-4 text-yellow-400 fill-current" />}
                    <Badge variant="secondary" className="text-xs bg-gray-600">
                      {document.fileType.toUpperCase()}
                    </Badge>
                  </div>
                </div>
                
                <CardTitle className="text-white text-lg group-hover:text-blue-400 transition-colors line-clamp-2">
                  {document.title}
                </CardTitle>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between text-sm text-gray-400">
                  <span>{formatFileSize(document.size)}</span>
                  <span>{formatDistanceToNow(new Date(document.updatedAt), { addSuffix: true })}</span>
                </div>

                <div className="flex items-center justify-between">
                  <Badge variant="secondary" className={categoryStyle}>
                    {document.category}
                  </Badge>
                  <span className="text-xs text-gray-500">
                    {format(new Date(document.createdAt), "MMM dd, yyyy")}
                  </span>
                </div>

                {document.tags && document.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {document.tags.slice(0, 3).map((tag, index) => (
                      <Badge key={index} variant="secondary" className="text-xs bg-gray-700">
                        <Tag className="w-3 h-3 mr-1" />
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

                <div className="flex items-center space-x-2 pt-2 border-t border-gray-700">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setViewingDocument(document)}
                    className="text-gray-400 hover:text-blue-400 flex-1"
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    View
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => downloadDocument(document)}
                    className="text-gray-400 hover:text-green-400 flex-1"
                  >
                    <Download className="w-4 h-4 mr-1" />
                    Download
                  </Button>
                  
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-gray-400 hover:text-purple-400"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-gray-800 border-gray-700">
                      <DialogHeader>
                        <DialogTitle className="text-white">File Actions</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-2">
                        <Button
                          onClick={() => setEditingDocument(document)}
                          variant="outline"
                          className="w-full justify-start border-gray-600 text-gray-300 hover:bg-gray-700"
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </Button>
                        <Button
                          onClick={() => toggleStar(document._id, document.starred || false)}
                          variant="outline"
                          className="w-full justify-start border-gray-600 text-gray-300 hover:bg-gray-700"
                        >
                          <Star className="w-4 h-4 mr-2" />
                          {document.starred ? 'Unstar' : 'Star'}
                        </Button>
                        <Button
                          onClick={() => duplicateDocument(document)}
                          variant="outline"
                          className="w-full justify-start border-gray-600 text-gray-300 hover:bg-gray-700"
                        >
                          <Copy className="w-4 h-4 mr-2" />
                          Duplicate
                        </Button>
                        <Button
                          onClick={() => shareDocument(document._id)}
                          variant="outline"
                          className="w-full justify-start border-gray-600 text-gray-300 hover:bg-gray-700"
                        >
                          <Link className="w-4 h-4 mr-2" />
                          Copy Link
                        </Button>
                        <Button
                          onClick={() => fetchVersionHistory(document._id)}
                          variant="outline"
                          className="w-full justify-start border-gray-600 text-gray-300 hover:bg-gray-700"
                        >
                          <History className="w-4 h-4 mr-2" />
                          Version History
                        </Button>
                        <Button
                          onClick={() => deleteDocument(document._id)}
                          variant="outline"
                          className="w-full justify-start border-red-600 text-red-400 hover:bg-red-600/20"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {filteredDocuments.length === 0 && !isLoading && (
        <Card className="bg-gray-800/60 backdrop-blur-xl border border-gray-700/50">
          <CardContent className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-300 mb-2">No documents found</h3>
            <p className="text-gray-500 mb-6">
              {searchTerm || selectedCategory !== "all" || selectedFileType !== "all"
                ? "Try adjusting your filters or search term"
                : "Get started by creating your first document"}
            </p>
            <Button
              onClick={() => setShowUpload(true)}
              className="bg-green-600 hover:bg-green-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Document
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Upload Progress */}
      {uploadProgress > 0 && (
        <Card className="bg-gray-800/60 backdrop-blur-xl border border-gray-700/50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-4">
              <Upload className="w-5 h-5 text-blue-400" />
              <div className="flex-1">
                <div className="flex justify-between text-sm text-gray-300 mb-1">
                  <span>Uploading document...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create Document Dialog */}
      <Dialog open={showUpload} onOpenChange={setShowUpload}>
        <DialogContent className="bg-gray-800 border-gray-700 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">Create New Document</DialogTitle>
            <CardDescription>Add a new document to your project</CardDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">Title</label>
                <Input
                  value={newDocument.title}
                  onChange={(e) => setNewDocument({ ...newDocument, title: e.target.value })}
                  placeholder="Document title"
                  className="bg-gray-700/50 border-gray-600"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">File Type</label>
                <Select 
                  value={newDocument.fileType} 
                  onValueChange={(value) => setNewDocument({ ...newDocument, fileType: value })}
                >
                  <SelectTrigger className="bg-gray-700/50 border-gray-600">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-700 border-gray-600">
                    <SelectItem value="text">Text</SelectItem>
                    <SelectItem value="markdown">Markdown</SelectItem>
                    <SelectItem value="code">Code</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">Category</label>
                <Select 
                  value={newDocument.category} 
                  onValueChange={(value) => setNewDocument({ ...newDocument, category: value })}
                >
                  <SelectTrigger className="bg-gray-700/50 border-gray-600">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-700 border-gray-600">
                    <SelectItem value="meeting-notes">Meeting Notes</SelectItem>
                    <SelectItem value="documentation">Documentation</SelectItem>
                    <SelectItem value="requirements">Requirements</SelectItem>
                    <SelectItem value="research">Research</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">Tags</label>
                <Input
                  value={newDocument.tags}
                  onChange={(e) => setNewDocument({ ...newDocument, tags: e.target.value })}
                  placeholder="Comma-separated tags"
                  className="bg-gray-700/50 border-gray-600"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">Content</label>
              <Textarea
                value={newDocument.content}
                onChange={(e) => setNewDocument({ ...newDocument, content: e.target.value })}
                placeholder="Document content"
                rows={8}
                className="bg-gray-700/50 border-gray-600"
              />
            </div>

            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => setShowUpload(false)}
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                Cancel
              </Button>
              <Button
                onClick={createDocument}
                className="bg-green-600 hover:bg-green-700"
                disabled={!newDocument.title || !newDocument.content}
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Document
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Document Dialog */}
      <Dialog open={!!viewingDocument} onOpenChange={() => setViewingDocument(null)}>
        <DialogContent className="bg-gray-800 border-gray-700 max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center space-x-2">
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
                <span>Modified: {format(new Date(viewingDocument.updatedAt), "MMM dd, yyyy")}</span>
              </div>
              
              {viewingDocument.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {viewingDocument.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="bg-gray-700">
                      <Tag className="w-3 h-3 mr-1" />
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
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => downloadDocument(viewingDocument)}
                    className="border-gray-600 text-gray-300 hover:bg-gray-700"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => shareDocument(viewingDocument._id)}
                    className="border-gray-600 text-gray-300 hover:bg-gray-700"
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    Share
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => fetchVersionHistory(viewingDocument._id)}
                    className="border-gray-600 text-gray-300 hover:bg-gray-700"
                  >
                    <History className="w-4 h-4 mr-2" />
                    History
                  </Button>
                </div>
                <Button
                  onClick={() => {
                    setEditingDocument(viewingDocument)
                    setViewingDocument(null)
                  }}
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

      {/* Edit Document Dialog */}
      <Dialog open={!!editingDocument} onOpenChange={() => setEditingDocument(null)}>
        <DialogContent className="bg-gray-800 border-gray-700 max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white">Edit Document</DialogTitle>
          </DialogHeader>
          
          {editingDocument && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  value={editingDocument.title}
                  onChange={(e) => setEditingDocument({ ...editingDocument, title: e.target.value })}
                  placeholder="Document title"
                  className="bg-gray-700/50 border-gray-600"
                />
                
                <Select 
                  value={editingDocument.category} 
                  onValueChange={(value) => setEditingDocument({ ...editingDocument, category: value })}
                >
                  <SelectTrigger className="bg-gray-700/50 border-gray-600">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-700 border-gray-600">
                    <SelectItem value="meeting-notes">Meeting Notes</SelectItem>
                    <SelectItem value="documentation">Documentation</SelectItem>
                    <SelectItem value="requirements">Requirements</SelectItem>
                    <SelectItem value="research">Research</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Input
                value={editingDocument.tags.join(', ')}
                onChange={(e) => setEditingDocument({ 
                  ...editingDocument, 
                  tags: e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag)
                })}
                placeholder="Comma-separated tags"
                className="bg-gray-700/50 border-gray-600"
              />

              <Textarea
                value={editingDocument.content}
                onChange={(e) => setEditingDocument({ ...editingDocument, content: e.target.value })}
                rows={12}
                className="bg-gray-700/50 border-gray-600"
              />

              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => setEditingDocument(null)}
                  className="border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => updateDocument(editingDocument._id, {
                    title: editingDocument.title,
                    content: editingDocument.content,
                    category: editingDocument.category,
                    tags: editingDocument.tags,
                    size: editingDocument.content.length
                  })}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Version History Dialog */}
      <Dialog open={showVersionHistory} onOpenChange={setShowVersionHistory}>
        <DialogContent className="bg-gray-800 border-gray-700 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center space-x-2">
              <History className="w-5 h-5" />
              <span>Version History</span>
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {versions.map((version, index) => (
              <div key={version._id} className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center">
                    <span className="text-blue-400 font-bold text-sm">v{version.version}</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-white">{version.title}</h4>
                    <p className="text-sm text-gray-400">{version.changesSummary}</p>
                    <p className="text-xs text-gray-500">
                      {format(new Date(version.createdAt), "MMM dd, yyyy 'at' HH:mm")} by {version.createdBy}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {index === 0 && (
                    <Badge variant="secondary" className="bg-green-500/20 text-green-400">
                      Current
                    </Badge>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-gray-600 text-gray-300 hover:bg-gray-700"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
