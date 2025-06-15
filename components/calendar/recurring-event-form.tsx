"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Card } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

interface RecurrencePattern {
  type: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly'
  interval: number
  endDate?: string
  count?: number
  daysOfWeek?: number[] // 0 = Sunday, 1 = Monday, etc.
  monthlyType?: 'date' | 'weekday' // Same date each month or same weekday (e.g., 2nd Monday)
}

interface RecurringEventFormProps {
  onSubmit: (eventData: any) => void
  projects: any[]
  contacts: any[]
}

export function RecurringEventForm({ onSubmit, projects, contacts }: RecurringEventFormProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [eventForm, setEventForm] = useState({
    title: "",
    description: "",
    date: "",
    time: "",
    type: "meeting",
    projectId: "",
    contactId: "",
    sharedWith: ""
  })

  const [recurrence, setRecurrence] = useState<RecurrencePattern>({
    type: 'none',
    interval: 1,
    daysOfWeek: [],
    monthlyType: 'date'
  })

  const [endType, setEndType] = useState<'never' | 'date' | 'count'>('never')

  const daysOfWeekNames = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag']

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!eventForm.title || !eventForm.date || !eventForm.type) {
      alert("Bitte füllen Sie alle Pflichtfelder aus")
      return
    }

    const finalRecurrence = recurrence.type === 'none' ? null : {
      ...recurrence,
      endDate: endType === 'date' ? recurrence.endDate : undefined,
      count: endType === 'count' ? recurrence.count : undefined
    }

    const sharedWithArray = eventForm.sharedWith 
      ? eventForm.sharedWith.split(',').map(email => email.trim()).filter(email => email)
      : []

    onSubmit({
      ...eventForm,
      recurrence: finalRecurrence,
      sharedWith: sharedWithArray
    })

    // Reset form
    setEventForm({
      title: "",
      description: "",
      date: "",
      time: "",
      type: "meeting",
      projectId: "",
      contactId: "",
      sharedWith: ""
    })
    setRecurrence({
      type: 'none',
      interval: 1,
      daysOfWeek: [],
      monthlyType: 'date'
    })
    setEndType('never')
    setIsOpen(false)
  }

  const handleDayOfWeekChange = (day: number, checked: boolean) => {
    setRecurrence(prev => ({
      ...prev,
      daysOfWeek: checked 
        ? [...prev.daysOfWeek || [], day]
        : (prev.daysOfWeek || []).filter(d => d !== day)
    }))
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>Neuer Termin</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Neuen Termin erstellen</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Basic Event Information */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="title">Titel *</Label>
              <Input
                id="title"
                value={eventForm.title}
                onChange={(e) => setEventForm(prev => ({ ...prev, title: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="type">Typ *</Label>
              <select
                id="type"
                value={eventForm.type}
                onChange={(e) => setEventForm(prev => ({ ...prev, type: e.target.value }))}
                className="w-full p-2 border rounded-md"
                required
              >
                <option value="meeting">Meeting</option>
                <option value="task">Aufgabe</option>
                <option value="reminder">Erinnerung</option>
                <option value="event">Event</option>
              </select>
            </div>
          </div>

          <div>
            <Label htmlFor="description">Beschreibung</Label>
            <Textarea
              id="description"
              value={eventForm.description}
              onChange={(e) => setEventForm(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="date">Datum *</Label>
              <Input
                id="date"
                type="date"
                value={eventForm.date}
                onChange={(e) => setEventForm(prev => ({ ...prev, date: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="time">Uhrzeit</Label>
              <Input
                id="time"
                type="time"
                value={eventForm.time}
                onChange={(e) => setEventForm(prev => ({ ...prev, time: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="project">Projekt</Label>
              <select
                id="project"
                value={eventForm.projectId}
                onChange={(e) => setEventForm(prev => ({ ...prev, projectId: e.target.value }))}
                className="w-full p-2 border rounded-md"
              >
                <option value="">Kein Projekt</option>
                {projects.map(project => (
                  <option key={project._id} value={project._id}>{project.name}</option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="contact">Kontakt</Label>
              <select
                id="contact"
                value={eventForm.contactId}
                onChange={(e) => setEventForm(prev => ({ ...prev, contactId: e.target.value }))}
                className="w-full p-2 border rounded-md"
              >
                <option value="">Kein Kontakt</option>
                {contacts.map(contact => (
                  <option key={contact._id} value={contact._id}>{contact.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <Label htmlFor="sharedWith">Mit anderen teilen (E-Mails durch Komma getrennt)</Label>
            <Input
              id="sharedWith"
              value={eventForm.sharedWith}
              onChange={(e) => setEventForm(prev => ({ ...prev, sharedWith: e.target.value }))}
              placeholder="kollege1@firma.de, kollege2@firma.de"
            />
          </div>

          {/* Recurrence Settings */}
          <Card className="p-4">
            <h4 className="font-semibold mb-3">Wiederholung</h4>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="recurrenceType">Wiederholungstyp</Label>
                <select
                  id="recurrenceType"
                  value={recurrence.type}
                  onChange={(e) => setRecurrence(prev => ({ 
                    ...prev, 
                    type: e.target.value as RecurrencePattern['type'] 
                  }))}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="none">Keine Wiederholung</option>
                  <option value="daily">Täglich</option>
                  <option value="weekly">Wöchentlich</option>
                  <option value="monthly">Monatlich</option>
                  <option value="yearly">Jährlich</option>
                </select>
              </div>

              {recurrence.type !== 'none' && (
                <>
                  <div>
                    <Label htmlFor="interval">Alle</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="interval"
                        type="number"
                        min="1"
                        value={recurrence.interval}
                        onChange={(e) => setRecurrence(prev => ({ 
                          ...prev, 
                          interval: parseInt(e.target.value) || 1 
                        }))}
                        className="w-20"
                      />
                      <span>
                        {recurrence.type === 'daily' && 'Tag(e)'}
                        {recurrence.type === 'weekly' && 'Woche(n)'}
                        {recurrence.type === 'monthly' && 'Monat(e)'}
                        {recurrence.type === 'yearly' && 'Jahr(e)'}
                      </span>
                    </div>
                  </div>

                  {recurrence.type === 'weekly' && (
                    <div>
                      <Label>An welchen Wochentagen?</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {daysOfWeekNames.map((day, index) => (
                          <label key={index} className="flex items-center gap-1">
                            <input
                              type="checkbox"
                              checked={recurrence.daysOfWeek?.includes(index) || false}
                              onChange={(e) => handleDayOfWeekChange(index, e.target.checked)}
                            />
                            <span className="text-sm">{day}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {recurrence.type === 'monthly' && (
                    <div>
                      <Label>Monatlicher Typ</Label>
                      <div className="flex gap-4 mt-2">
                        <label className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="monthlyType"
                            value="date"
                            checked={recurrence.monthlyType === 'date'}
                            onChange={(e) => setRecurrence(prev => ({ 
                              ...prev, 
                              monthlyType: 'date' 
                            }))}
                          />
                          <span className="text-sm">Gleiches Datum</span>
                        </label>
                        <label className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="monthlyType"
                            value="weekday"
                            checked={recurrence.monthlyType === 'weekday'}
                            onChange={(e) => setRecurrence(prev => ({ 
                              ...prev, 
                              monthlyType: 'weekday' 
                            }))}
                          />
                          <span className="text-sm">Gleicher Wochentag (z.B. 2. Montag)</span>
                        </label>
                      </div>
                    </div>
                  )}

                  <div>
                    <Label>Ende der Wiederholung</Label>
                    <div className="space-y-2 mt-2">
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="endType"
                          value="never"
                          checked={endType === 'never'}
                          onChange={(e) => setEndType('never')}
                        />
                        <span className="text-sm">Niemals</span>
                      </label>
                      
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="endType"
                          value="date"
                          checked={endType === 'date'}
                          onChange={(e) => setEndType('date')}
                        />
                        <span className="text-sm">Am:</span>
                        <Input
                          type="date"
                          value={recurrence.endDate || ''}
                          onChange={(e) => setRecurrence(prev => ({ 
                            ...prev, 
                            endDate: e.target.value 
                          }))}
                          disabled={endType !== 'date'}
                          className="w-40"
                        />
                      </label>
                      
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="endType"
                          value="count"
                          checked={endType === 'count'}
                          onChange={(e) => setEndType('count')}
                        />
                        <span className="text-sm">Nach:</span>
                        <Input
                          type="number"
                          min="1"
                          value={recurrence.count || ''}
                          onChange={(e) => setRecurrence(prev => ({ 
                            ...prev, 
                            count: parseInt(e.target.value) || 1 
                          }))}
                          disabled={endType !== 'count'}
                          className="w-20"
                        />
                        <span className="text-sm">Terminen</span>
                      </label>
                    </div>
                  </div>
                </>
              )}
            </div>
          </Card>

          <div className="flex gap-2 pt-4">
            <Button type="submit">Termin erstellen</Button>
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Abbrechen
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
