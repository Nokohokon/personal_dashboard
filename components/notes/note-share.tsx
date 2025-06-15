"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

interface SharedUser {
  email: string
  userId: string
  name: string
  sharedAt: Date
}

interface NoteShareProps {
  noteId: string
  sharedWith: SharedUser[]
  onShareUpdate: () => void
}

export function NoteShare({ noteId, sharedWith, onShareUpdate }: NoteShareProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [shareEmail, setShareEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleShare = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!shareEmail.trim()) {
      alert("Bitte geben Sie eine E-Mail-Adresse ein")
      return
    }

    setIsLoading(true)

    try {
      // Update the note with shared user
      const response = await fetch(`/api/notes/${noteId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sharedWith: [...(sharedWith || []).map(sw => sw.email), shareEmail.trim()]
        })
      })

      if (response.ok) {
        alert("Notiz erfolgreich geteilt")
        setShareEmail("")
        setIsOpen(false)
        onShareUpdate()
      } else {
        const error = await response.json()
        alert(error.error || "Fehler beim Teilen der Notiz")
      }
    } catch (error) {
      alert("Netzwerkfehler beim Teilen der Notiz")
    } finally {
      setIsLoading(false)
    }
  }

  const handleUnshare = async (email: string) => {
    if (!confirm(`Möchten Sie die Berechtigung für ${email} wirklich entziehen?`)) {
      return
    }

    setIsLoading(true)

    try {
      const updatedSharedWith = (sharedWith || [])
        .filter(sw => sw.email !== email)
        .map(sw => sw.email)

      const response = await fetch(`/api/notes/${noteId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sharedWith: updatedSharedWith
        })
      })

      if (response.ok) {
        alert("Berechtigung entfernt")
        onShareUpdate()
      } else {
        const error = await response.json()
        alert(error.error || "Fehler beim Entfernen der Berechtigung")
      }
    } catch (error) {
      alert("Netzwerkfehler beim Entfernen der Berechtigung")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-medium">Geteilt mit</h4>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              Person hinzufügen
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Notiz teilen</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleShare} className="space-y-4">
              <div>
                <Label htmlFor="shareEmail">E-Mail-Adresse</Label>
                <Input
                  id="shareEmail"
                  type="email"
                  value={shareEmail}
                  onChange={(e) => setShareEmail(e.target.value)}
                  placeholder="kollege@firma.de"
                  required
                />
                <p className="text-sm text-gray-600 mt-1">
                  Die Person kann die Notiz sehen und bearbeiten, falls sie registriert ist.
                </p>
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Teilen..." : "Teilen"}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsOpen(false)}
                >
                  Abbrechen
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {sharedWith && sharedWith.length > 0 ? (
        <div className="space-y-2">
          {sharedWith.map((user, index) => (
            <div key={index} className="flex items-center justify-between p-2 border rounded-lg">
              <div className="flex items-center gap-2">
                <div>
                  <p className="font-medium text-sm">{user.name || user.email}</p>
                  {user.name && (
                    <p className="text-xs text-gray-600">{user.email}</p>
                  )}
                </div>
                <Badge variant="secondary" className="text-xs">
                  {user.userId ? "Registriert" : "Eingeladen"}
                </Badge>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleUnshare(user.email)}
                disabled={isLoading}
              >
                Entfernen
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-600 text-sm text-center py-3">
          Diese Notiz ist noch nicht geteilt
        </p>
      )}
    </div>
  )
}
