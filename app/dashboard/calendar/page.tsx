"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import DashboardLayout from "@/components/dashboard/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar as CalendarIcon, Clock, Plus, ChevronLeft, ChevronRight } from "lucide-react"
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek } from "date-fns"

interface CalendarEvent {
  _id: string
  title: string
  description?: string
  date: string
  time?: string
  type: "meeting" | "task" | "reminder" | "other"
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
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  
  const [eventForm, setEventForm] = useState({
    title: "",
    description: "",
    date: "",
    time: "",
    type: "meeting" as const,
    projectId: "",
    contactId: ""
  })

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
      const res = await fetch("/api/events")
      if (res.ok) {
        const data = await res.json()
        setEvents(data)
      }
    } catch (error) {
      console.error("Error fetching events:", error)
      // Fallback to mock data if API fails
      const mockEvents: CalendarEvent[] = [
        {
          _id: "1",
          title: "Team Meeting",
          description: "Weekly team sync",
          date: new Date().toISOString().split('T')[0],
          time: "10:00",
          type: "meeting"
        },
        {
          _id: "2",
          title: "Project Deadline",
          description: "Submit final project",
          date: format(addMonths(new Date(), 1), 'yyyy-MM-dd'),
          time: "17:00",
          type: "task"
        }
      ]
      setEvents(mockEvents)
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

    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(eventForm)
      })

      if (res.ok) {
        const newEvent = await res.json()
        setEvents(prev => [...prev, newEvent])
        setEventForm({
          title: "",
          description: "",
          date: "",          time: "",
          type: "meeting",
          projectId: "",
          contactId: ""
        })
        setIsDialogOpen(false)
      }
    } catch (error) {
      console.error("Error creating event:", error)
    }
  }

  const openEventDialog = (date?: Date) => {
    if (date) {
      setEventForm(prev => ({
        ...prev,
        date: format(date, 'yyyy-MM-dd')
      }))
    }
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
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              Calendar
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              Manage your schedule and important events
            </p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => openEventDialog()}>
                <Plus className="mr-2 h-4 w-4" />
                Add Event
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Event</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Title *</label>
                  <Input
                    value={eventForm.title}
                    onChange={(e) => setEventForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Event title"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">Date *</label>
                  <Input
                    type="date"
                    value={eventForm.date}
                    onChange={(e) => setEventForm(prev => ({ ...prev, date: e.target.value }))}
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">Time</label>
                  <Input
                    type="time"
                    value={eventForm.time}
                    onChange={(e) => setEventForm(prev => ({ ...prev, time: e.target.value }))}
                  />
                </div>
                  <div>
                  <label className="text-sm font-medium">Type</label>
                  <select
                    value={eventForm.type}
                    onChange={(e) => setEventForm(prev => ({ ...prev, type: e.target.value as any }))}
                    className="w-full h-10 px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-md bg-white dark:bg-slate-950"
                  >
                    <option value="meeting">Meeting</option>
                    <option value="task">Task</option>
                    <option value="reminder">Reminder</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium">Project</label>
                  <Select value={eventForm.projectId} onValueChange={(value) => setEventForm(prev => ({ ...prev, projectId: value }))}>
                    <SelectTrigger>
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
                  <label className="text-sm font-medium">Contact</label>
                  <Select value={eventForm.contactId} onValueChange={(value) => setEventForm(prev => ({ ...prev, contactId: value }))}>
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
                  <label className="text-sm font-medium">Description</label>
                  <Textarea
                    value={eventForm.description}
                    onChange={(e) => setEventForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Event description (optional)"
                    rows={3}
                  />
                </div>
                
                <Button 
                  onClick={handleCreateEvent} 
                  className="w-full"
                  disabled={!eventForm.title || !eventForm.date}
                >
                  Create Event
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Calendar */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl">
                    {format(currentDate, 'MMMM yyyy')}
                  </CardTitle>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" onClick={prevMonth}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={nextMonth}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-7 gap-1 mb-4">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="p-2 text-center text-sm font-medium text-slate-600 dark:text-slate-400">
                      {day}
                    </div>
                  ))}
                </div>
                
                <div className="grid grid-cols-7 gap-1">
                  {calendarDays.map(day => {
                    const dayEvents = getEventsForDate(day)
                    const isCurrentMonth = isSameMonth(day, currentDate)
                    const isToday = isSameDay(day, new Date())
                    
                    return (
                      <div
                        key={day.toString()}
                        className={`min-h-[80px] p-1 border rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${
                          !isCurrentMonth ? 'text-slate-400 dark:text-slate-600' : ''
                        } ${
                          isToday ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' : 'border-slate-200 dark:border-slate-700'
                        }`}
                        onClick={() => openEventDialog(day)}
                      >
                        <div className={`text-sm font-medium mb-1 ${isToday ? 'text-blue-600 dark:text-blue-400' : ''}`}>
                          {format(day, 'd')}
                        </div>
                        <div className="space-y-1">
                          {dayEvents.slice(0, 2).map(event => (
                            <div
                              key={event._id}
                              className={`text-xs p-1 rounded truncate ${
                                event.type === 'meeting' ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300' :
                                event.type === 'task' ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300' :
                                event.type === 'reminder' ? 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300' :
                                'bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-300'
                              }`}
                            >
                              {event.time && `${event.time} `}{event.title}
                            </div>
                          ))}
                          {dayEvents.length > 2 && (
                            <div className="text-xs text-slate-500 dark:text-slate-400">
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
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Upcoming Events</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {events
                    .filter(event => new Date(event.date) >= new Date())
                    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                    .slice(0, 5)                    .map(event => {
                      const linkedProject = getLinkedProject(event.projectId)
                      const linkedContact = getLinkedContact(event.contactId)
                      
                      return (
                      <div key={event._id} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                        <h4 className="font-medium text-sm">{event.title}</h4>
                        <div className="flex items-center text-xs text-slate-600 dark:text-slate-400 mt-1">
                          <CalendarIcon className="h-3 w-3 mr-1" />
                          {format(new Date(event.date), 'MMM dd')}
                          {event.time && (
                            <>
                              <Clock className="h-3 w-3 ml-2 mr-1" />
                              {event.time}
                            </>
                          )}
                        </div>
                        {event.description && (
                          <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                            {event.description}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-1 mt-2">
                          <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                            event.type === 'meeting' ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300' :
                            event.type === 'task' ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300' :
                            event.type === 'reminder' ? 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300' :
                            'bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-300'
                          }`}>
                            {event.type}
                          </span>
                          {linkedProject && (
                            <span className="inline-block px-2 py-1 text-xs rounded-full bg-orange-100 dark:bg-orange-900/20 text-orange-800 dark:text-orange-300">
                              📁 {linkedProject.name}
                            </span>
                          )}
                          {linkedContact && (
                            <span className="inline-block px-2 py-1 text-xs rounded-full bg-cyan-100 dark:bg-cyan-900/20 text-cyan-800 dark:text-cyan-300">
                              👤 {linkedContact.name}
                            </span>
                          )}
                        </div>
                      </div>
                      )
                    })}
                  {events.filter(event => new Date(event.date) >= new Date()).length === 0 && (
                    <p className="text-center text-slate-500 dark:text-slate-400 py-4">
                      No upcoming events
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-600 dark:text-slate-400">Total Events</span>
                    <span className="font-medium">{events.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-600 dark:text-slate-400">This Month</span>
                    <span className="font-medium">
                      {events.filter(event => 
                        isSameMonth(new Date(event.date), currentDate)
                      ).length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-600 dark:text-slate-400">Meetings</span>
                    <span className="font-medium">
                      {events.filter(event => event.type === 'meeting').length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-600 dark:text-slate-400">Tasks</span>
                    <span className="font-medium">
                      {events.filter(event => event.type === 'task').length}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>    </DashboardLayout>
  )
}