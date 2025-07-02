"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Square, Clock, Plus, Edit, Trash2, RotateCcw } from "lucide-react"
import { format } from "date-fns"

interface TimeEntry {
  _id: string
  project: string
  task: string
  description: string
  startTime: string
  endTime?: string
  duration?: number
  isActive: boolean
}

export default function TimeTrackingPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([])
  const [projects, setProjects] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentTimer, setCurrentTimer] = useState<TimeEntry | null>(null)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null)
  
  // Form states
  const [project, setProject] = useState("")
  const [task, setTask] = useState("")
  const [description, setDescription] = useState("")
  
  // Edit form states
  const [editProject, setEditProject] = useState("")
  const [editTask, setEditTask] = useState("")
  const [editDescription, setEditDescription] = useState("")
  const [editStartTime, setEditStartTime] = useState("")
  const [editEndTime, setEditEndTime] = useState("")

  const tasks = ["Development", "Planning", "Review", "Documentation", "Research", "Meeting"]

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
    }
  }, [status, router])
  useEffect(() => {
    if (session) {
      fetchTimeEntries()
      fetchProjects()
    }
  }, [session])

  const fetchProjects = async () => {
    try {
      const res = await fetch("/api/projects")
      if (res.ok) {
        const data = await res.json()
        const projectNames = data.map((project: any) => project.name)
        setProjects(projectNames)
      }
    } catch (error) {
      console.error("Error fetching projects:", error)
      // Fallback to default projects if API fails
      setProjects(["Work", "Personal", "Learning", "Side Project", "Meeting"])
    }
  }

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (currentTimer && currentTimer.isActive) {
      interval = setInterval(() => {
        const start = new Date(currentTimer.startTime).getTime()
        const now = new Date().getTime()
        setElapsedTime(now - start)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [currentTimer])

  const fetchTimeEntries = async () => {
    try {
      const response = await fetch("/api/time-entries")
      if (response.ok) {
        const entries = await response.json()
        setTimeEntries(entries)
        
        // Find active timer
        const activeEntry = entries.find((entry: TimeEntry) => entry.isActive)
        if (activeEntry) {
          setCurrentTimer(activeEntry)
        }
      }
    } catch (error) {
      console.error("Error fetching time entries:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const startTimer = async () => {
    if (!project || !task) return

    try {
      const response = await fetch("/api/time-entries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          project,
          task,
          description,
          startTime: new Date().toISOString(),
        }),
      })

      if (response.ok) {
        const newEntry = await response.json()
        setCurrentTimer(newEntry)
        setTimeEntries(prev => [newEntry, ...prev])
        setIsDialogOpen(false)
        setProject("")
        setTask("")
        setDescription("")
      }
    } catch (error) {
      console.error("Error starting timer:", error)
    }
  }

  const stopTimer = async () => {
    if (!currentTimer) return

    try {
      const response = await fetch("/api/time-entries", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: currentTimer._id,
          endTime: new Date().toISOString(),
        }),
      })

      if (response.ok) {
        const updatedEntry = await response.json()
        setCurrentTimer(null)
        setElapsedTime(0)
        setTimeEntries(prev => 
          prev.map(entry => 
            entry._id === updatedEntry._id ? updatedEntry : entry
          )
        )
      }
    } catch (error) {
      console.error("Error stopping timer:", error)
    }
  }

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    
    return `${hours.toString().padStart(2, "0")}:${(minutes % 60)
      .toString()
      .padStart(2, "0")}:${(seconds % 60).toString().padStart(2, "0")}`
  }
  const getTotalDuration = () => {
    return timeEntries.reduce((total, entry) => {
      if (entry.duration) {
        return total + entry.duration
      }
      return total
    }, 0)
  }

  const openEditDialog = (entry: TimeEntry) => {
    setEditingEntry(entry)
    setEditProject(entry.project)
    setEditTask(entry.task)
    setEditDescription(entry.description)
    setEditStartTime(new Date(entry.startTime).toISOString().slice(0, 16))
    setEditEndTime(entry.endTime ? new Date(entry.endTime).toISOString().slice(0, 16) : "")
    setIsEditDialogOpen(true)
  }

  const handleEditEntry = async () => {
    if (!editingEntry || !editProject || !editTask || !editStartTime) return

    try {
      const response = await fetch("/api/time-entries", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: editingEntry._id,
          project: editProject,
          task: editTask,
          description: editDescription,
          startTime: editStartTime,
          endTime: editEndTime || null,
        }),
      })

      if (response.ok) {
        const updatedEntry = await response.json()
        setTimeEntries(prev => 
          prev.map(entry => 
            entry._id === updatedEntry._id ? updatedEntry : entry
          )
        )
        setIsEditDialogOpen(false)
        resetEditForm()
      }
    } catch (error) {
      console.error("Error updating time entry:", error)
    }
  }

  const continueEntry = async (entry: TimeEntry) => {
    if (currentTimer) {
      alert("Please stop the current timer first")
      return
    }

    try {
      const response = await fetch("/api/time-entries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          project: entry.project,
          task: entry.task,
          description: entry.description,
          startTime: new Date().toISOString(),
        }),
      })

      if (response.ok) {
        const newEntry = await response.json()
        setCurrentTimer(newEntry)
        setTimeEntries(prev => [newEntry, ...prev])
      }
    } catch (error) {
      console.error("Error continuing time entry:", error)
    }
  }

  const deleteEntry = async (id: string) => {
    if (!confirm("Are you sure you want to delete this time entry?")) return

    try {
      const response = await fetch(`/api/time-entries?id=${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setTimeEntries(prev => prev.filter(entry => entry._id !== id))
      }
    } catch (error) {
      console.error("Error deleting time entry:", error)
    }
  }

  const resetEditForm = () => {
    setEditingEntry(null)
    setEditProject("")
    setEditTask("")
    setEditDescription("")
    setEditStartTime("")
    setEditEndTime("")
  }

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
              Time Tracking
            </h1>
            <p className="text-slate-400 text-sm xs:text-base sm:text-lg">
              Track your time across projects and tasks
            </p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button disabled={!!currentTimer} className="w-full xs:w-auto text-sm xs:text-base">
                <Plus className="mr-2 h-4 w-4" />
                Start Timer
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-sm xs:max-w-md sm:max-w-lg mx-4">
              <DialogHeader>
                <DialogTitle className="text-base xs:text-lg">Start New Timer</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 xs:space-y-4">
                <div>
                  <label className="text-sm xs:text-base font-medium">Project</label>
                  <Select value={project} onValueChange={setProject}>
                    <SelectTrigger className="text-sm xs:text-base">
                      <SelectValue placeholder="Select project" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map((p) => (
                        <SelectItem key={p} value={p}>
                          {p}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm xs:text-base font-medium">Task</label>
                  <Select value={task} onValueChange={setTask}>
                    <SelectTrigger className="text-sm xs:text-base">
                      <SelectValue placeholder="Select task" />
                    </SelectTrigger>
                    <SelectContent>
                      {tasks.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm xs:text-base font-medium">Description (Optional)</label>
                  <Input
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="What are you working on?"
                    className="text-sm xs:text-base"
                  />
                </div>
                
                <Button 
                  onClick={startTimer} 
                  className="w-full text-sm xs:text-base"
                  disabled={!project || !task}
                >
                  Start Timer
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Edit Time Entry Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-sm xs:max-w-md sm:max-w-lg mx-4">
            <DialogHeader>
              <DialogTitle className="text-base xs:text-lg">Edit Time Entry</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 xs:space-y-4">
              <div>
                <label className="text-sm xs:text-base font-medium">Project</label>
                <Select value={editProject} onValueChange={setEditProject}>
                  <SelectTrigger className="text-sm xs:text-base">
                    <SelectValue placeholder="Select project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm xs:text-base font-medium">Task</label>
                <Select value={editTask} onValueChange={setEditTask}>
                  <SelectTrigger className="text-sm xs:text-base">
                    <SelectValue placeholder="Select task" />
                  </SelectTrigger>
                  <SelectContent>
                    {tasks.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm xs:text-base font-medium">Description</label>
                <Input
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="What are you working on?"
                  className="text-sm xs:text-base"
                />
              </div>

              <div className="grid grid-cols-1 xs:grid-cols-2 gap-3 xs:gap-4">
                <div>
                  <label className="text-sm xs:text-base font-medium">Start Time</label>
                  <Input
                    type="datetime-local"
                    value={editStartTime}
                    onChange={(e) => setEditStartTime(e.target.value)}
                    className="text-sm xs:text-base"
                  />
                </div>
                
                <div>
                  <label className="text-sm xs:text-base font-medium">End Time</label>
                  <Input
                    type="datetime-local"
                    value={editEndTime}
                    onChange={(e) => setEditEndTime(e.target.value)}
                    placeholder="Leave empty if ongoing"
                    className="text-sm xs:text-base"
                  />
                </div>
              </div>
              
              <div className="flex flex-col xs:flex-row justify-end space-y-2 xs:space-y-0 xs:space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsEditDialogOpen(false)
                    resetEditForm()
                  }}
                  className="text-sm xs:text-base"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleEditEntry}
                  disabled={!editProject || !editTask || !editStartTime}
                  className="text-sm xs:text-base"
                >
                  Save Changes
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Current Timer */}
        {currentTimer && (
          <Card className="border-green-200 border-green-800 bg-green-50 bg-green-900/20">
            <CardHeader className="pb-3 xs:pb-4">
              <CardTitle className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-3 xs:gap-4">
                <div className="flex items-center">
                  <Clock className="mr-2 h-4 w-4 xs:h-5 xs:w-5 text-green-600 text-green-400 flex-shrink-0" />
                  <span className="text-base xs:text-lg">Active Timer</span>
                </div>
                <Button onClick={stopTimer} variant="destructive" size="sm" className="w-full xs:w-auto">
                  <Square className="mr-2 h-4 w-4" />
                  Stop
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col xs:flex-row xs:justify-between xs:items-center gap-3 xs:gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-base xs:text-lg truncate">{currentTimer.project} - {currentTimer.task}</h3>
                  <p className="text-slate-400 text-sm xs:text-base truncate">{currentTimer.description}</p>
                  <p className="text-xs xs:text-sm text-slate-500">
                    Started at {format(new Date(currentTimer.startTime), "HH:mm")}
                  </p>
                </div>
                <div className="text-center xs:text-right">
                  <div className="text-2xl xs:text-3xl font-mono font-bold text-green-600 text-green-400">
                    {formatDuration(elapsedTime)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 xs:gap-4 sm:gap-5 lg:gap-6">
          <Card>
            <CardHeader className="pb-2 xs:pb-3">
              <CardTitle className="text-xs xs:text-sm sm:text-base font-medium">Today's Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg xs:text-xl sm:text-2xl font-bold">
                {formatDuration(
                  timeEntries
                    .filter(entry => {
                      const entryDate = new Date(entry.startTime).toDateString()
                      const today = new Date().toDateString()
                      return entryDate === today && entry.duration
                    })
                    .reduce((total, entry) => total + (entry.duration || 0), 0)
                )}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2 xs:pb-3">
              <CardTitle className="text-xs xs:text-sm sm:text-base font-medium">This Week</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg xs:text-xl sm:text-2xl font-bold">
                {formatDuration(getTotalDuration())}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2 xs:pb-3">
              <CardTitle className="text-xs xs:text-sm sm:text-base font-medium">Total Entries</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg xs:text-xl sm:text-2xl font-bold">{timeEntries.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Time Entries List */}
        <Card>
          <CardHeader className="pb-3 xs:pb-4">
            <CardTitle className="text-base xs:text-lg sm:text-xl">Recent Time Entries</CardTitle>
          </CardHeader>
          <CardContent className="px-3 xs:px-4 sm:px-6">
            <div className="space-y-3 xs:space-y-4">
              {timeEntries.length === 0 ? (
                <p className="text-center text-slate-500 text-slate-400 py-6 xs:py-8 text-sm xs:text-base">
                  No time entries yet. Start your first timer!
                </p>
              ) : (
                timeEntries.map((entry) => (
                  <div
                    key={entry._id}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 xs:gap-4 p-3 xs:p-4 bg-slate-800 rounded-lg"
                  >
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm xs:text-base truncate">{entry.project} - {entry.task}</h4>
                      <p className="text-xs xs:text-sm text-slate-400 truncate">
                        {entry.description}
                      </p>
                      <p className="text-xs text-slate-500">
                        {format(new Date(entry.startTime), "MMM dd, yyyy HH:mm")}
                        {entry.endTime && (
                          <> - {format(new Date(entry.endTime), "HH:mm")}</>
                        )}
                      </p>
                    </div>
                    
                    <div className="flex flex-col xs:flex-row xs:items-center gap-2 xs:gap-4">
                      <div className="text-center xs:text-right">
                        <div className="font-mono font-semibold text-sm xs:text-base">
                          {entry.isActive ? (
                            <span className="text-green-600 text-green-400">Running</span>
                          ) : entry.duration ? (
                            formatDuration(entry.duration)
                          ) : (
                            "00:00:00"
                          )}
                        </div>
                      </div>
                      <div className="flex space-x-1 xs:space-x-2 justify-center xs:justify-end">
                        {!entry.isActive && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => continueEntry(entry)}
                              disabled={!!currentTimer}
                              title="Continue this task"
                              className="h-8 w-8 xs:h-9 xs:w-9 p-0"
                            >
                              <RotateCcw className="h-3 w-3 xs:h-4 xs:w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openEditDialog(entry)}
                              title="Edit entry"
                              className="h-8 w-8 xs:h-9 xs:w-9 p-0"
                            >
                              <Edit className="h-3 w-3 xs:h-4 xs:w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => deleteEntry(entry._id)}
                              title="Delete entry"
                              className="h-8 w-8 xs:h-9 xs:w-9 p-0 text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-3 w-3 xs:h-4 xs:w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
  )
}
