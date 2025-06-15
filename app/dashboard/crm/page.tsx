"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import DashboardLayout from "@/components/dashboard/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Search, Edit, Trash2, User, Building, Phone, Mail, Calendar, FileText } from "lucide-react"
import { format } from "date-fns"

interface Contact {
  _id: string
  name: string
  email: string
  phone?: string
  company?: string
  position?: string
  notes?: string
  tags: string[]
  lastContact?: string
  createdAt: string
}

interface Note {
  _id: string
  title: string
  content: string
  category: string
  tags: string[]
  contactId?: string
  projectId?: string
  createdAt: string
  updatedAt: string
}

export default function CRMPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [contacts, setContacts] = useState<Contact[]>([])
  const [notes, setNotes] = useState<Note[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("contacts")
  const [searchTerm, setSearchTerm] = useState("")
  
  // Dialog states
  const [isContactDialogOpen, setIsContactDialogOpen] = useState(false)
  const [isNoteDialogOpen, setIsNoteDialogOpen] = useState(false)
  const [editingContact, setEditingContact] = useState<Contact | null>(null)
  const [editingNote, setEditingNote] = useState<Note | null>(null)
    // Form states
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    position: "",
    notes: "",
    tags: "",
    projectId: ""
  })
    const [noteForm, setNoteForm] = useState({
    title: "",
    content: "",
    category: "",
    tags: "",
    contactId: "",
    projectId: ""
  })

  const categories = ["Meeting", "Idea", "Task", "Follow-up", "Research", "General"]

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
    }
  }, [status, router])

  useEffect(() => {
    if (session) {
      fetchContacts()
      fetchNotes()
      fetchProjects()
    }
  }, [session])

  const fetchContacts = async () => {
    try {
      const response = await fetch("/api/contacts")
      if (response.ok) {
        const data = await response.json()
        setContacts(data)
      }
    } catch (error) {
      console.error("Error fetching contacts:", error)
    }
  }
  const fetchNotes = async () => {
    try {
      const response = await fetch("/api/notes")
      if (response.ok) {
        const data = await response.json()
        setNotes(data)
      }
    } catch (error) {
      console.error("Error fetching notes:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchProjects = async () => {
    try {
      const res = await fetch("/api/projects")
      if (res.ok) {
        const data = await res.json()
        setProjects(data)
      }
    } catch (error) {
      console.error("Error fetching projects:", error)
    }
  }

  const handleContactSubmit = async () => {
    try {
      const url = editingContact ? `/api/contacts/${editingContact._id}` : "/api/contacts"
      const method = editingContact ? "PUT" : "POST"
      
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...contactForm,
          tags: contactForm.tags.split(",").map(tag => tag.trim()).filter(Boolean)
        }),
      })

      if (response.ok) {
        const contact = await response.json()
        if (editingContact) {
          setContacts(prev => prev.map(c => c._id === contact._id ? contact : c))
        } else {
          setContacts(prev => [contact, ...prev])
        }
        setIsContactDialogOpen(false)
        resetContactForm()
      }
    } catch (error) {
      console.error("Error saving contact:", error)
    }
  }

  const handleNoteSubmit = async () => {
    try {
      const url = editingNote ? `/api/notes/${editingNote._id}` : "/api/notes"
      const method = editingNote ? "PUT" : "POST"
      
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...noteForm,
          tags: noteForm.tags.split(",").map(tag => tag.trim()).filter(Boolean)
        }),
      })

      if (response.ok) {
        const note = await response.json()
        if (editingNote) {
          setNotes(prev => prev.map(n => n._id === note._id ? note : n))
        } else {
          setNotes(prev => [note, ...prev])
        }
        setIsNoteDialogOpen(false)
        resetNoteForm()
      }
    } catch (error) {
      console.error("Error saving note:", error)
    }
  }
  const resetContactForm = () => {
    setContactForm({
      name: "",
      email: "",
      phone: "",
      company: "",
      position: "",
      notes: "",
      tags: "",
      projectId: ""
    })
    setEditingContact(null)
  }
  const resetNoteForm = () => {
    setNoteForm({
      title: "",
      content: "",
      category: "",
      tags: "",
      contactId: "",
      projectId: ""
    })
    setEditingNote(null)
  }
  const editContact = (contact: Contact) => {
    setContactForm({
      name: contact.name,
      email: contact.email,
      phone: contact.phone || "",
      company: contact.company || "",
      position: contact.position || "",
      notes: contact.notes || "",
      tags: contact.tags.join(", "),
      projectId: (contact as any).projectId || ""
    })
    setEditingContact(contact)
    setIsContactDialogOpen(true)
  }

  const editNote = (note: Note) => {
    setNoteForm({
      title: note.title,
      content: note.content,
      category: note.category,
      tags: note.tags.join(", "),
      contactId: note.contactId || ""
    })
    setEditingNote(note)
    setIsNoteDialogOpen(true)
  }

  const deleteContact = async (id: string) => {
    if (!confirm("Are you sure you want to delete this contact?")) return
    
    try {
      const response = await fetch(`/api/contacts/${id}`, {
        method: "DELETE",
      })
      
      if (response.ok) {
        setContacts(prev => prev.filter(c => c._id !== id))
      }
    } catch (error) {
      console.error("Error deleting contact:", error)
    }
  }

  const deleteNote = async (id: string) => {
    if (!confirm("Are you sure you want to delete this note?")) return
    
    try {
      const response = await fetch(`/api/notes/${id}`, {
        method: "DELETE",
      })
      
      if (response.ok) {
        setNotes(prev => prev.filter(n => n._id !== id))
      }
    } catch (error) {
      console.error("Error deleting note:", error)
    }
  }

  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (contact.company && contact.company.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const filteredNotes = notes.filter(note =>
    note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    note.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    note.category.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  if (status === "unauthenticated") {
    return null
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white">
              CRM & Notes
            </h1>
            <p className="text-slate-400">
              Manage your contacts and keep track of important notes
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search contacts or notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex justify-between items-center">
            <TabsList>
              <TabsTrigger value="contacts">Contacts</TabsTrigger>
              <TabsTrigger value="notes">Notes</TabsTrigger>
            </TabsList>
            
            <div className="flex space-x-2">
              <Dialog open={isContactDialogOpen} onOpenChange={setIsContactDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={resetContactForm}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Contact
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>
                      {editingContact ? "Edit Contact" : "Add New Contact"}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Name *</label>
                      <Input
                        value={contactForm.name}
                        onChange={(e) => setContactForm(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Full name"
                      />
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium">Email *</label>
                      <Input
                        type="email"
                        value={contactForm.email}
                        onChange={(e) => setContactForm(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="email@example.com"
                      />
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium">Phone</label>
                      <Input
                        value={contactForm.phone}
                        onChange={(e) => setContactForm(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="Phone number"
                      />
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium">Company</label>
                      <Input
                        value={contactForm.company}
                        onChange={(e) => setContactForm(prev => ({ ...prev, company: e.target.value }))}
                        placeholder="Company name"
                      />
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium">Position</label>
                      <Input
                        value={contactForm.position}
                        onChange={(e) => setContactForm(prev => ({ ...prev, position: e.target.value }))}
                        placeholder="Job title"
                      />
                    </div>
                      <div>
                      <label className="text-sm font-medium">Tags</label>
                      <Input
                        value={contactForm.tags}
                        onChange={(e) => setContactForm(prev => ({ ...prev, tags: e.target.value }))}
                        placeholder="client, lead, partner (comma separated)"
                      />
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium">Related Project</label>
                      <Select value={contactForm.projectId} onValueChange={(value) => setContactForm(prev => ({ ...prev, projectId: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Link to project (optional)" />
                        </SelectTrigger>
                        <SelectContent>
                          {projects.map((project) => (
                            <SelectItem key={project._id} value={project._id}>
                              {project.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium">Notes</label>
                      <Textarea
                        value={contactForm.notes}
                        onChange={(e) => setContactForm(prev => ({ ...prev, notes: e.target.value }))}
                        placeholder="Additional notes about this contact"
                        rows={3}
                      />
                    </div>
                    
                    <Button 
                      onClick={handleContactSubmit} 
                      className="w-full"
                      disabled={!contactForm.name || !contactForm.email}
                    >
                      {editingContact ? "Update Contact" : "Add Contact"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={isNoteDialogOpen} onOpenChange={setIsNoteDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" onClick={resetNoteForm}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Note
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>
                      {editingNote ? "Edit Note" : "Add New Note"}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Title *</label>
                      <Input
                        value={noteForm.title}
                        onChange={(e) => setNoteForm(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Note title"
                      />
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium">Category</label>
                      <Select value={noteForm.category} onValueChange={(value) => setNoteForm(prev => ({ ...prev, category: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                      <div>
                      <label className="text-sm font-medium">Related Contact</label>
                      <Select value={noteForm.contactId} onValueChange={(value) => setNoteForm(prev => ({ ...prev, contactId: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Link to contact (optional)" />
                        </SelectTrigger>
                        <SelectContent>
                          {contacts.map((contact) => (
                            <SelectItem key={contact._id} value={contact._id}>
                              {contact.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium">Related Project</label>
                      <Select value={noteForm.projectId} onValueChange={(value) => setNoteForm(prev => ({ ...prev, projectId: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Link to project (optional)" />
                        </SelectTrigger>
                        <SelectContent>
                          {projects.map((project) => (
                            <SelectItem key={project._id} value={project._id}>
                              {project.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium">Tags</label>
                      <Input
                        value={noteForm.tags}
                        onChange={(e) => setNoteForm(prev => ({ ...prev, tags: e.target.value }))}
                        placeholder="important, follow-up, idea (comma separated)"
                      />
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium">Content *</label>
                      <Textarea
                        value={noteForm.content}
                        onChange={(e) => setNoteForm(prev => ({ ...prev, content: e.target.value }))}
                        placeholder="Write your note here..."
                        rows={5}
                      />
                    </div>
                    
                    <Button 
                      onClick={handleNoteSubmit} 
                      className="w-full"
                      disabled={!noteForm.title || !noteForm.content}
                    >
                      {editingNote ? "Update Note" : "Add Note"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <TabsContent value="contacts" className="space-y-4">
            {filteredContacts.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <User className="h-12 w-12 text-slate-400 mb-4" />
                  <p className="text-center text-slate-500 text-slate-400">
                    {contacts.length === 0 ? "No contacts yet. Add your first contact!" : "No contacts match your search."}
                  </p>
                </CardContent>
              </Card>
            ) : (              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredContacts.map((contact) => {
                  const linkedProject = projects.find(p => p._id === (contact as any).projectId)
                  
                  return (
                  <Card key={contact._id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{contact.name}</CardTitle>
                          {contact.position && contact.company && (
                            <p className="text-sm text-slate-400">
                              {contact.position} at {contact.company}
                            </p>
                          )}
                          {linkedProject && (
                            <p className="text-sm text-blue-600 text-blue-400 mt-1">
                              📁 {linkedProject.name}
                            </p>
                          )}
                        </div>
                        <div className="flex space-x-1">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => editContact(contact)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => deleteContact(contact._id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex items-center text-sm">
                          <Mail className="h-4 w-4 mr-2 text-slate-400" />
                          {contact.email}
                        </div>
                        {contact.phone && (
                          <div className="flex items-center text-sm">
                            <Phone className="h-4 w-4 mr-2 text-slate-400" />
                            {contact.phone}
                          </div>
                        )}
                        {contact.company && (
                          <div className="flex items-center text-sm">
                            <Building className="h-4 w-4 mr-2 text-slate-400" />
                            {contact.company}
                          </div>
                        )}
                        {contact.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {contact.tags.map((tag, index) => (
                              <span 
                                key={index}
                                className="px-2 py-1 bg-blue-100 bg-blue-900/20 text-blue-800 text-blue-300 text-xs rounded-full"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}                        <p className="text-xs text-slate-500 mt-2">
                          Added {format(new Date(contact.createdAt), "MMM dd, yyyy")}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                  )
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="notes" className="space-y-4">
            {filteredNotes.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <FileText className="h-12 w-12 text-slate-400 mb-4" />
                  <p className="text-center text-slate-500 text-slate-400">
                    {notes.length === 0 ? "No notes yet. Create your first note!" : "No notes match your search."}
                  </p>
                </CardContent>
              </Card>
            ) : (              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredNotes.map((note) => {
                  const linkedContact = contacts.find(c => c._id === note.contactId)
                  const linkedProject = projects.find(p => p._id === note.projectId)
                  
                  return (
                    <Card key={note._id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <CardTitle className="text-lg">{note.title}</CardTitle>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="px-2 py-1 bg-purple-100 bg-purple-900/20 text-purple-800 text-purple-300 text-xs rounded-full">
                                {note.category}
                              </span>
                              {linkedContact && (
                                <span className="px-2 py-1 bg-green-100 bg-green-900/20 text-green-800 text-green-300 text-xs rounded-full">
                                  👤 {linkedContact.name}
                                </span>
                              )}
                              {linkedProject && (
                                <span className="px-2 py-1 bg-blue-100 bg-blue-900/20 text-blue-800 text-blue-300 text-xs rounded-full">
                                  📁 {linkedProject.name}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex space-x-1">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => editNote(note)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => deleteNote(note._id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-slate-400 mb-3 line-clamp-3">
                          {note.content}
                        </p>
                        {note.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-3">
                            {note.tags.map((tag, index) => (
                              <span 
                                key={index}
                                className="px-2 py-1 bg-slate-100 bg-slate-700 text-slate-700 text-slate-300 text-xs rounded-full"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                        <p className="text-xs text-slate-500">
                          Created {format(new Date(note.createdAt), "MMM dd, yyyy HH:mm")}
                          {note.updatedAt !== note.createdAt && (
                            <> • Updated {format(new Date(note.updatedAt), "MMM dd, yyyy HH:mm")}</>
                          )}
                        </p>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
