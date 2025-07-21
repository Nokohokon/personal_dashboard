"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar as CalendarIcon, Clock, Plus, ChevronLeft, ChevronRight, Edit, Trash2 } from "lucide-react"
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek } from "date-fns"

interface CalendarEvent {
  _id: string
  title: string
  description?: string
  date: string
  time?: string
  type: "meeting" | "task" | "reminder" | "other"
  color: string
  projectId?: string
  contactId?: string
}

export default function CalendarPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [contacts, setContacts] = useState<any[]>([])
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEventDetailOpen, setIsEventDetailOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null)
    const [eventForm, setEventForm] = useState({
    title: "",
    description: "",
    date: "",
    time: "",
    type: "meeting" as "meeting" | "task" | "reminder" | "other",
    color: "#3b82f6",
    projectId: "",
    contactId: ""
  })

  const eventColors = [
    { name: "Blue", value: "#3b82f6" },
    { name: "Green", value: "#10b981" },
    { name: "Red", value: "#ef4444" },
    { name: "Yellow", value: "#f59e0b" },
    { name: "Purple", value: "#8b5cf6" },
    { name: "Pink", value: "#ec4899" },
    { name: "Indigo", value: "#6366f1" },
    { name: "Orange", value: "#f97316" },
  ]

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
    }
  }, [status, router])
  useEffect(() => {
    if (session) {
      fetchEvents()
      fetchProjects()
      fetchContacts()
    }
  }, [session])
  const fetchEvents = async () => {
    try {
      console.log("Fetching events...")
      const res = await fetch("/api/events")
      console.log("Events API response status:", res.status)
      
      if (res.ok) {
        const data = await res.json()
        console.log("Events data received:", data)
        // Ensure color field is present, add default if missing
        const eventsWithColor = data.map((event: any) => ({
          ...event,
          color: event.color || "#3b82f6"
        }))
        setEvents(eventsWithColor)
      } else {
        console.log("Events API failed, starting with empty array")
        setEvents([])
      }
    } catch (error) {
      console.error("Error fetching events:", error)
      // Start with empty array instead of mock data
      setEvents([])
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

  const fetchContacts = async () => {
    try {
      const res = await fetch("/api/contacts")
      if (res.ok) {
        const data = await res.json()
        setContacts(data)
      }
    } catch (error) {
      console.error("Error fetching contacts:", error)
    }
  }
    const handleCreateEvent = async () => {
    if (!eventForm.title || !eventForm.date) return

    console.log("Creating/updating event with data:", eventForm)

    try {
      if (editingEvent) {
        // Update existing event
        console.log("Updating event:", editingEvent._id)
        const res = await fetch("/api/events", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingEvent._id,
            ...eventForm
          })
        })

        console.log("Update response status:", res.status)

        if (res.ok) {
          const updatedEvent = await res.json()
          console.log("Event updated successfully:", updatedEvent)
          setEvents(prev => prev.map(event => 
            event._id === editingEvent._id ? updatedEvent : event
          ))
        } else {
          console.log("Update failed, updating locally")
          // Fallback: Update locally if API fails
          const updatedEvent = { ...editingEvent, ...eventForm }
          setEvents(prev => prev.map(event => 
            event._id === editingEvent._id ? updatedEvent : event
          ))
        }
        resetForm()
      } else {
        // Create new event
        console.log("Creating new event")
        const res = await fetch("/api/events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(eventForm)
        })

        console.log("Create response status:", res.status)

        if (res.ok) {
          const newEvent = await res.json()
          console.log("Event created successfully:", newEvent)
          setEvents(prev => [...prev, newEvent])
        } else {
          console.log("Create failed, adding locally")
          // Fallback: Add locally if API fails
          const newEvent: CalendarEvent = {
            _id: Date.now().toString(), // Temporary ID
            ...eventForm
          }
          setEvents(prev => [...prev, newEvent])
        }
        resetForm()
      }
    } catch (error) {
      console.error("Error saving event:", error)
      
      // Fallback: Always add/update locally in case of error
      if (editingEvent) {
        const updatedEvent = { ...editingEvent, ...eventForm }
        setEvents(prev => prev.map(event => 
          event._id === editingEvent._id ? updatedEvent : event
        ))
      } else {
        const newEvent: CalendarEvent = {
          _id: Date.now().toString(), // Temporary ID
          ...eventForm
        }
        setEvents(prev => [...prev, newEvent])
      }
      resetForm()
    }
  }

  const handleEditEvent = (event: CalendarEvent) => {
    setEditingEvent(event)
    setEventForm({
      title: event.title,
      description: event.description || "",
      date: event.date,
      time: event.time || "",
      type: event.type,
      color: event.color,
      projectId: event.projectId || "",
      contactId: event.contactId || ""
    })
    setIsDialogOpen(true)
  }

  const handleViewEvent = (event: CalendarEvent) => {
    setSelectedEvent(event)
    setIsEventDetailOpen(true)
  }

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm("Are you sure you want to delete this event?")) return

    try {
      const res = await fetch(`/api/events?id=${eventId}`, {
        method: "DELETE"
      })

      if (res.ok || !res.ok) {
        // Always remove locally, regardless of API response
        setEvents(prev => prev.filter(event => event._id !== eventId))
      }
    } catch (error) {
      console.error("Error deleting event:", error)
      // Remove locally even if API fails
      setEvents(prev => prev.filter(event => event._id !== eventId))
    }
  }

  const resetForm = () => {
    setEventForm({
      title: "",
      description: "",
      date: "",
      time: "",
      type: "meeting",
      color: "#3b82f6",
      projectId: "",
      contactId: ""
    })
    setEditingEvent(null)
    setIsDialogOpen(false)
  }

  const openEventDialog = () => {
    setIsDialogOpen(true)
  }

  // Calendar calculation
  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const calendarStart = startOfWeek(monthStart)
  const calendarEnd = endOfWeek(monthEnd)
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd })
  const getEventsForDate = (date: Date) => {
    return events.filter(event => 
      isSameDay(new Date(event.date), date)
    )
  }

  const getLinkedProject = (projectId?: string) => {
    if (!projectId) return null
    return projects.find(p => p._id === projectId)
  }

  const getLinkedContact = (contactId?: string) => {
    if (!contactId) return null
    return contacts.find(c => c._id === contactId)
  }

  const nextMonth = () => setCurrentDate(prev => addMonths(prev, 1))
  const prevMonth = () => setCurrentDate(prev => subMonths(prev, 1))

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
    <div className="space-y-4 xs:space-y-5 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col xs:flex-row xs:justify-between xs:items-center gap-3 xs:gap-4">
          <div>
            <h1 className="text-2xl xs:text-3xl sm:text-4xl font-bold text-white">
              Calendar
            </h1>
            <p className="text-slate-400 text-sm xs:text-base sm:text-lg">
              Manage your schedule and important events
            </p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => openEventDialog()} className="w-full xs:w-auto text-sm xs:text-base">
                <Plus className="mr-2 h-4 w-4" />
                Add Event
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-sm xs:max-w-md sm:max-w-lg mx-4 scale-75">
              <DialogHeader>
                <DialogTitle className="text-base xs:text-lg">
                  {editingEvent ? "Edit Event" : "Create New Event"}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-3 xs:space-y-4 ">
                <div>
                  <label className="text-sm xs:text-base font-medium">Title *</label>
                  <Input
                    value={eventForm.title}
                    onChange={(e) => setEventForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Event title"
                    className="text-sm xs:text-base"
                  />
                </div>
                
                <div className="grid grid-cols-1 xs:grid-cols-2 gap-3 xs:gap-4">
                  <div>
                    <label className="text-sm xs:text-base font-medium">Date *</label>
                    <Input
                      type="date"
                      value={eventForm.date}
                      onChange={(e) => setEventForm(prev => ({ ...prev, date: e.target.value }))}
                      className="text-sm xs:text-base"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm xs:text-base font-medium">Time</label>
                    <Input
                      type="time"
                      value={eventForm.time}
                      onChange={(e) => setEventForm(prev => ({ ...prev, time: e.target.value }))}
                      className="text-sm xs:text-base"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 xs:grid-cols-2 gap-3 xs:gap-4">
                  <div>
                    <label className="text-sm xs:text-base font-medium">Type</label>
                    <select
                      value={eventForm.type}
                      onChange={(e) => setEventForm(prev => ({ ...prev, type: e.target.value as any }))}
                      className="w-full h-10 xs:h-11 px-3 py-2 text-sm xs:text-base border border-slate-800 rounded-md bg-slate-950"
                    >
                      <option value="meeting">Meeting</option>
                      <option value="task">Task</option>
                      <option value="reminder">Reminder</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-sm xs:text-base font-medium">Color</label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {eventColors.map((color) => (
                        <button
                          key={color.value}
                          type="button"
                          onClick={() => setEventForm(prev => ({ ...prev, color: color.value }))}
                          className={`w-8 h-8 rounded-full border-2 transition-all ${
                            eventForm.color === color.value 
                              ? 'border-white scale-110' 
                              : 'border-slate-600 hover:scale-105'
                          }`}
                          style={{ backgroundColor: color.value }}
                          title={color.name}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 xs:grid-cols-2 gap-3 xs:gap-4">
                  <div>
                    <label className="text-sm xs:text-base font-medium">Project</label>
                    <Select value={eventForm.projectId} onValueChange={(value) => setEventForm(prev => ({ ...prev, projectId: value }))}>
                      <SelectTrigger className="text-sm xs:text-base">
                        <SelectValue placeholder="Select project (optional)" />
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
                    <label className="text-sm xs:text-base font-medium">Contact</label>
                    <Select value={eventForm.contactId} onValueChange={(value) => setEventForm(prev => ({ ...prev, contactId: value }))}>
                      <SelectTrigger className="text-sm xs:text-base">
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
                </div>
                
                <div>
                  <label className="text-sm xs:text-base font-medium">Description</label>
                  <Textarea
                    value={eventForm.description}
                    onChange={(e) => setEventForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Event description (optional)"
                    rows={3}
                    className="text-sm xs:text-base"
                  />
                </div>
                  <div className="flex flex-col xs:flex-row gap-2 xs:gap-3">
                  <Button 
                    onClick={handleCreateEvent} 
                    className="flex-1 text-sm xs:text-base"
                    disabled={!eventForm.title || !eventForm.date}
                  >
                    {editingEvent ? "Update Event" : "Create Event"}
                  </Button>
                  {editingEvent && (
                    <Button 
                      onClick={() => resetForm()} 
                      variant="outline"
                      className="text-sm xs:text-base"
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Event Detail Dialog */}
          <Dialog open={isEventDetailOpen} onOpenChange={setIsEventDetailOpen}>
            <DialogContent className="max-w-sm xs:max-w-md sm:max-w-lg mx-4">
              <DialogHeader>
                <DialogTitle className="text-base xs:text-lg flex items-center gap-2">
                  <div 
                    className="w-4 h-4 rounded-full" 
                    style={{ backgroundColor: selectedEvent?.color }}
                  />
                  {selectedEvent?.title}
                </DialogTitle>
              </DialogHeader>
              {selectedEvent && (
                <div className="space-y-3 xs:space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-slate-400">Date</label>
                      <p className="text-sm xs:text-base">
                        {format(new Date(selectedEvent.date), 'MMMM dd, yyyy')}
                      </p>
                    </div>
                    {selectedEvent.time && (
                      <div>
                        <label className="text-sm font-medium text-slate-400">Time</label>
                        <p className="text-sm xs:text-base">{selectedEvent.time}</p>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-medium text-slate-400">Type</label>
                    <span className={`inline-block px-2 py-1 text-xs rounded-full mt-1 ${
                      selectedEvent.type === 'meeting' ? 'bg-blue-100 bg-blue-900/20 text-blue-800 text-blue-300' :
                      selectedEvent.type === 'task' ? 'bg-green-100 bg-green-900/20 text-green-800 text-green-300' :
                      selectedEvent.type === 'reminder' ? 'bg-yellow-100 bg-yellow-900/20 text-yellow-800 text-yellow-300' :
                      'bg-purple-100 bg-purple-900/20 text-purple-800 text-purple-300'
                    }`}>
                      {selectedEvent.type}
                    </span>
                  </div>

                  {selectedEvent.description && (
                    <div>
                      <label className="text-sm font-medium text-slate-400">Description</label>
                      <p className="text-sm xs:text-base mt-1">{selectedEvent.description}</p>
                    </div>
                  )}

                  {(getLinkedProject(selectedEvent.projectId) || getLinkedContact(selectedEvent.contactId)) && (
                    <div>
                      <label className="text-sm font-medium text-slate-400">Linked to</label>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {getLinkedProject(selectedEvent.projectId) && (
                          <span className="inline-block px-2 py-1 text-xs rounded-full bg-orange-100 bg-orange-900/20 text-orange-800 text-orange-300">
                            📁 {getLinkedProject(selectedEvent.projectId)?.name}
                          </span>
                        )}
                        {getLinkedContact(selectedEvent.contactId) && (
                          <span className="inline-block px-2 py-1 text-xs rounded-full bg-cyan-100 bg-cyan-900/20 text-cyan-800 text-cyan-300">
                            👤 {getLinkedContact(selectedEvent.contactId)?.name}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Button 
                      onClick={() => {
                        setIsEventDetailOpen(false)
                        handleEditEvent(selectedEvent)
                      }}
                      className="flex-1 text-sm xs:text-base"
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Edit Event
                    </Button>
                    <Button 
                      onClick={() => {
                        setIsEventDetailOpen(false)
                        handleDeleteEvent(selectedEvent._id)
                      }}
                      variant="outline"
                      className="text-sm xs:text-base text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 xs:gap-5 sm:gap-6">
          {/* Calendar */}
          <div className="xl:col-span-3">
            <Card>
              <CardHeader className="pb-3 xs:pb-4">
                <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-3 xs:gap-4">
                  <CardTitle className="text-lg xs:text-xl sm:text-2xl lg:text-xl">
                    {format(currentDate, 'MMMM yyyy')}
                  </CardTitle>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" onClick={prevMonth} className="h-8 xs:h-9 w-8 xs:w-9">
                      <ChevronLeft className="h-3 w-3 xs:h-4 xs:w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={nextMonth} className="h-8 xs:h-9 w-8 xs:w-9">
                      <ChevronRight className="h-3 w-3 xs:h-4 xs:w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="px-3 xs:px-4 sm:px-6">
                {/* Calendar Header */}
                <div className="grid grid-cols-7 gap-0.5 xs:gap-1 mb-2 xs:mb-3 sm:mb-4">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="p-1 xs:p-2 text-center text-xs xs:text-sm font-medium text-slate-400">
                      <span className="hidden xs:inline">{day}</span>
                      <span className="xs:hidden">{day.charAt(0)}</span>
                    </div>
                  ))}
                </div>
                
                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-0.5 xs:gap-1">
                  {calendarDays.map(day => {
                    const dayEvents = getEventsForDate(day)
                    const isCurrentMonth = isSameMonth(day, currentDate)
                    const isToday = isSameDay(day, new Date())
                    
                    return (
                      <div
                        key={day.toString()}
                        className={`min-h-[60px] xs:min-h-[70px] sm:min-h-[80px] lg:min-h-[90px] p-1 xs:p-1.5 border rounded-md xs:rounded-lg transition-colors ${
                          !isCurrentMonth ? 'text-slate-400 text-slate-600' : ''
                        } ${
                          isToday ? 'bg-blue-50 bg-blue-900/20 border-blue-200 border-blue-800' : 'border-slate-700'
                        }`}
                      >
                        <div className={`text-xs xs:text-sm font-medium mb-1 ${isToday ? 'text-blue-600 text-blue-400' : ''}`}>
                          {format(day, 'd')}
                        </div>
                        <div className="space-y-0.5 xs:space-y-1">
                          {dayEvents.slice(0, 2).map(event => (
                            <div
                              key={event._id}
                              onClick={(e) => {
                                e.stopPropagation()
                                handleViewEvent(event)
                              }}
                              className="text-xs p-0.5 xs:p-1 rounded truncate cursor-pointer hover:opacity-80 transition-opacity"
                              style={{ 
                                backgroundColor: `${event.color}20`,
                                borderLeft: `3px solid ${event.color}`,
                                color: event.color
                              }}
                            >
                              <span className="hidden xs:inline">{event.time && `${event.time} `}</span>{event.title}
                            </div>
                          ))}
                          {dayEvents.length > 2 && (
                            <div className="text-xs text-slate-500 text-slate-400">
                              +{dayEvents.length - 2} more
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Upcoming Events Sidebar */}
          <div className="space-y-3 xs:space-y-4">
            <Card>
              <CardHeader className="pb-3 xs:pb-4">
                <CardTitle className="text-base xs:text-lg sm:text-xl lg:text-lg">Upcoming Events</CardTitle>
              </CardHeader>
              <CardContent className="px-3 xs:px-4 sm:px-6">
                <div className="space-y-2 xs:space-y-3">
                  {events
                    .filter(event => new Date(event.date) >= new Date())
                    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                    .slice(0, 5)
                    .map(event => {
                      const linkedProject = getLinkedProject(event.projectId)
                      const linkedContact = getLinkedContact(event.contactId)
                      
                      return (
                      <div key={event._id} className="p-2 xs:p-3 bg-slate-800 rounded-lg">
                        <div className="flex justify-between items-start gap-2">
                          <div 
                            className="flex-1 min-w-0 cursor-pointer"
                            onClick={() => handleViewEvent(event)}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <div 
                                className="w-3 h-3 rounded-full flex-shrink-0" 
                                style={{ backgroundColor: event.color }}
                              />
                              <h4 className="font-medium text-xs xs:text-sm truncate">{event.title}</h4>
                            </div>
                            <div className="flex items-center text-xs text-slate-400 gap-1">
                              <CalendarIcon className="h-3 w-3 flex-shrink-0" />
                              <span>{format(new Date(event.date), 'MMM dd')}</span>
                              {event.time && (
                                <>
                                  <Clock className="h-3 w-3 ml-1 flex-shrink-0" />
                                  <span>{event.time}</span>
                                </>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-0.5 xs:gap-1 flex-shrink-0">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleEditEvent(event)
                              }}
                              className="h-6 w-6 xs:h-7 xs:w-7 p-0 text-slate-400 hover:text-white"
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteEvent(event._id)
                              }}
                              className="h-6 w-6 xs:h-7 xs:w-7 p-0 text-slate-400 hover:text-red-400"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        {event.description && (
                          <p className="text-xs text-slate-500 mt-1 xs:mt-2 line-clamp-2">
                            {event.description}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-1 mt-2">
                          <span className={`inline-block px-1.5 xs:px-2 py-0.5 xs:py-1 text-xs rounded-full flex-shrink-0 ${
                            event.type === 'meeting' ? 'bg-blue-100 bg-blue-900/20 text-blue-800 text-blue-300' :
                            event.type === 'task' ? 'bg-green-100 bg-green-900/20 text-green-800 text-green-300' :
                            event.type === 'reminder' ? 'bg-yellow-100 bg-yellow-900/20 text-yellow-800 text-yellow-300' :
                            'bg-purple-100 bg-purple-900/20 text-purple-800 text-purple-300'
                          }`}>
                            {event.type}
                          </span>
                          {linkedProject && (
                            <span className="inline-block px-1.5 xs:px-2 py-0.5 xs:py-1 text-xs rounded-full bg-orange-100 bg-orange-900/20 text-orange-800 text-orange-300 flex-shrink-0">
                              📁 {linkedProject.name}
                            </span>
                          )}
                          {linkedContact && (
                            <span className="inline-block px-1.5 xs:px-2 py-0.5 xs:py-1 text-xs rounded-full bg-cyan-100 bg-cyan-900/20 text-cyan-800 text-cyan-300 flex-shrink-0">
                              👤 {linkedContact.name}
                            </span>
                          )}
                        </div>
                      </div>
                      )
                    })}
                  {events.filter(event => new Date(event.date) >= new Date()).length === 0 && (
                    <p className="text-center text-slate-500 text-slate-400 py-3 xs:py-4 text-xs xs:text-sm">
                      No upcoming events
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3 xs:pb-4">
                <CardTitle className="text-base xs:text-lg sm:text-xl lg:text-lg">Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="px-3 xs:px-4 sm:px-6">
                <div className="space-y-2 xs:space-y-3">
                  <div className="flex justify-between">
                    <span className="text-xs xs:text-sm text-slate-400">Total Events</span>
                    <span className="font-medium text-xs xs:text-sm">{events.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs xs:text-sm text-slate-400">This Month</span>
                    <span className="font-medium text-xs xs:text-sm">
                      {events.filter(event => 
                        isSameMonth(new Date(event.date), currentDate)
                      ).length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs xs:text-sm text-slate-400">Meetings</span>
                    <span className="font-medium text-xs xs:text-sm">
                      {events.filter(event => event.type === 'meeting').length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs xs:text-sm text-slate-400">Tasks</span>
                    <span className="font-medium text-xs xs:text-sm">
                      {events.filter(event => event.type === 'task').length}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }
