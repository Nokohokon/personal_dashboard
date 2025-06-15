"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface ProjectRole {
  _id?: string
  name: string
  description?: string
  permissions: {
    // Projekt-Verwaltung
    canEditProject: boolean
    canDeleteProject: boolean
    canManageTeam: boolean
    canManageRoles: boolean
    
    // Inhalte
    canViewContent: boolean
    canCreateContent: boolean
    canEditContent: boolean
    canDeleteContent: boolean
    
    // Spezielle Bereiche
    canViewAnalytics: boolean
    canViewTimeTracking: boolean
    canManageTimeEntries: boolean
    
    // Dokumente
    canViewDocuments: boolean
    canCreateDocuments: boolean
    canEditDocuments: boolean
    canDeleteDocuments: boolean
    
    // Notizen
    canViewNotes: boolean
    canCreateNotes: boolean
    canEditNotes: boolean
    canDeleteNotes: boolean
    
    // Kontakte
    canViewContacts: boolean
    canCreateContacts: boolean
    canEditContacts: boolean
    canDeleteContacts: boolean
    
    // Kalender/Events
    canViewEvents: boolean
    canCreateEvents: boolean
    canEditEvents: boolean
    canDeleteEvents: boolean
  }
  isDefault?: boolean
  createdAt: Date
  updatedAt: Date
}

interface RoleManagementProps {
  projectId: string
  canManageRoles: boolean
  onRolesUpdate: () => void
}

const defaultPermissions = {
  canEditProject: false,
  canDeleteProject: false,
  canManageTeam: false,
  canManageRoles: false,
  canViewContent: true,
  canCreateContent: false,
  canEditContent: false,
  canDeleteContent: false,
  canViewAnalytics: false,
  canViewTimeTracking: false,
  canManageTimeEntries: false,
  canViewDocuments: true,
  canCreateDocuments: false,
  canEditDocuments: false,
  canDeleteDocuments: false,
  canViewNotes: true,
  canCreateNotes: false,
  canEditNotes: false,
  canDeleteNotes: false,
  canViewContacts: true,
  canCreateContacts: false,
  canEditContacts: false,
  canDeleteContacts: false,
  canViewEvents: true,
  canCreateEvents: false,
  canEditEvents: false,
  canDeleteEvents: false
}

export function RoleManagement({ projectId, canManageRoles, onRolesUpdate }: RoleManagementProps) {
  const [roles, setRoles] = useState<ProjectRole[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingRole, setEditingRole] = useState<ProjectRole | null>(null)
  const [newRole, setNewRole] = useState<Partial<ProjectRole>>({
    name: "",
    description: "",
    permissions: defaultPermissions
  })

  useEffect(() => {
    fetchRoles()
  }, [projectId])

  const fetchRoles = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/roles`)
      if (response.ok) {
        const data = await response.json()
        setRoles(data.roles)
      }
    } catch (error) {
      console.error("Fehler beim Laden der Rollen:", error)
    }
  }
  const handleCreateRoleWithData = async (roleData: Partial<ProjectRole>) => {
    if (!roleData.name?.trim()) {
      alert("Bitte geben Sie einen Rollennamen ein")
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch(`/api/projects/${projectId}/roles`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: roleData.name,
          description: roleData.description,
          permissions: roleData.permissions
        })
      })

      if (response.ok) {
        alert("Rolle erfolgreich erstellt")
        setNewRole({
          name: "",
          description: "",
          permissions: defaultPermissions
        })
        setIsDialogOpen(false)
        fetchRoles()
        onRolesUpdate()
      } else {
        const error = await response.json()
        alert(error.error || "Fehler beim Erstellen der Rolle")
      }
    } catch (error) {
      alert("Netzwerkfehler beim Erstellen der Rolle")
    } finally {
      setIsLoading(false)
    }
  }

  const updatePermission = (permissions: any, key: string, value: boolean) => {
    return { ...permissions, [key]: value }
  }

  const renderPermissionSection = (title: string, permissions: any, permissionKeys: string[], onUpdate: (permissions: any) => void) => (
    <div className="space-y-3">
      <h4 className="font-medium text-sm">{title}</h4>
      <div className="grid grid-cols-2 gap-3">
        {permissionKeys.map((key) => (
          <div key={key} className="flex items-center space-x-2">
            <Switch
              id={key}
              checked={permissions[key]}
              onCheckedChange={(checked) => 
                onUpdate(updatePermission(permissions, key, checked))
              }
            />
            <Label htmlFor={key} className="text-sm">
              {key.replace(/^can/, '').replace(/([A-Z])/g, ' $1').trim()}
            </Label>
          </div>
        ))}
      </div>
    </div>
  )const RoleEditor = ({ role, onSave, onCancel, isEdit = false }: { 
    role: Partial<ProjectRole>, 
    onSave: () => void, 
    onCancel: () => void,
    isEdit?: boolean
  }) => {
    const [currentRole, setCurrentRole] = useState<Partial<ProjectRole>>(role)

    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="roleName">Rollenname</Label>
          <Input
            id="roleName"
            value={currentRole.name || ""}
            onChange={(e) => setCurrentRole({ ...currentRole, name: e.target.value })}
            placeholder="z.B. Content Manager"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="roleDescription">Beschreibung</Label>
          <Textarea
            id="roleDescription"
            value={currentRole.description || ""}
            onChange={(e) => setCurrentRole({ ...currentRole, description: e.target.value })}
            placeholder="Beschreibung der Rolle..."
          />
        </div>

        <Tabs defaultValue="project" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="project">Projekt</TabsTrigger>
            <TabsTrigger value="content">Inhalte</TabsTrigger>
            <TabsTrigger value="modules">Module</TabsTrigger>
            <TabsTrigger value="special">Spezial</TabsTrigger>
          </TabsList>

          <TabsContent value="project" className="space-y-4">
            {renderPermissionSection(
              "Projekt-Verwaltung",
              currentRole.permissions || defaultPermissions,
              ["canEditProject", "canDeleteProject", "canManageTeam", "canManageRoles"],
              (permissions) => setCurrentRole({ ...currentRole, permissions })
            )}
          </TabsContent>

          <TabsContent value="content" className="space-y-4">
            {renderPermissionSection(
              "Allgemeine Inhalte",
              currentRole.permissions || defaultPermissions,
              ["canViewContent", "canCreateContent", "canEditContent", "canDeleteContent"],
              (permissions) => setCurrentRole({ ...currentRole, permissions })
            )}
          </TabsContent>

          <TabsContent value="modules" className="space-y-6">
            {renderPermissionSection(
              "Dokumente",
              currentRole.permissions || defaultPermissions,
              ["canViewDocuments", "canCreateDocuments", "canEditDocuments", "canDeleteDocuments"],
              (permissions) => setCurrentRole({ ...currentRole, permissions })
            )}
            
            {renderPermissionSection(
              "Notizen",
              currentRole.permissions || defaultPermissions,
              ["canViewNotes", "canCreateNotes", "canEditNotes", "canDeleteNotes"],
              (permissions) => setCurrentRole({ ...currentRole, permissions })
            )}
            
            {renderPermissionSection(
              "Kontakte",
              currentRole.permissions || defaultPermissions,
              ["canViewContacts", "canCreateContacts", "canEditContacts", "canDeleteContacts"],
              (permissions) => setCurrentRole({ ...currentRole, permissions })
            )}
            
            {renderPermissionSection(
              "Kalender/Events",
              currentRole.permissions || defaultPermissions,
              ["canViewEvents", "canCreateEvents", "canEditEvents", "canDeleteEvents"],
              (permissions) => setCurrentRole({ ...currentRole, permissions })
            )}
          </TabsContent>

          <TabsContent value="special" className="space-y-4">
            {renderPermissionSection(
              "Spezielle Bereiche",
              currentRole.permissions || defaultPermissions,
              ["canViewAnalytics", "canViewTimeTracking", "canManageTimeEntries"],
              (permissions) => setCurrentRole({ ...currentRole, permissions })
            )}
          </TabsContent>
        </Tabs>

        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={onCancel}>
            Abbrechen
          </Button>
          <Button 
            onClick={() => {
              if (isEdit) {
                handleUpdateRole(currentRole as ProjectRole)
              } else {
                handleCreateRoleWithData(currentRole)
              }
            }} 
            disabled={!currentRole.name?.trim() || isLoading}
          >
            {isLoading ? "Speichern..." : "Speichern"}
          </Button>
        </div>
      </div>
    )
  }

  if (!canManageRoles) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Rollen</h3>
        <div className="space-y-2">
          {roles.map((role) => (
            <div key={role._id} className="flex items-center justify-between p-3 border rounded">
              <div>
                <span className="font-medium">{role.name}</span>
                {role.description && (
                  <p className="text-sm text-gray-600">{role.description}</p>
                )}
                {role.isDefault && (
                  <Badge variant="secondary" className="mt-1">Standard</Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Rollen verwalten</h3>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>Neue Rolle erstellen</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Neue Rolle erstellen</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateRole}>
              <RoleEditor
                role={newRole}
                onSave={handleCreateRole}
                onCancel={() => setIsDialogOpen(false)}
              />
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
        {roles.map((role) => (
          <div key={role._id} className="border rounded-lg p-4">
            {editingRole?._id === role._id ? (
              <RoleEditor
                role={editingRole}
                onSave={handleUpdateRole}
                onCancel={() => setEditingRole(null)}
              />
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">{role.name}</span>
                    {role.isDefault && (
                      <Badge variant="secondary">Standard</Badge>
                    )}
                  </div>
                  {role.description && (
                    <p className="text-sm text-gray-600 mt-1">{role.description}</p>
                  )}
                  <div className="flex flex-wrap gap-1 mt-2">
                    {Object.entries(role.permissions)
                      .filter(([_, hasPermission]) => hasPermission)
                      .slice(0, 5)
                      .map(([permission, _]) => (
                        <Badge key={permission} variant="outline" className="text-xs">
                          {permission.replace(/^can/, '').replace(/([A-Z])/g, ' $1').trim()}
                        </Badge>
                      ))}
                    {Object.entries(role.permissions).filter(([_, hasPermission]) => hasPermission).length > 5 && (
                      <Badge variant="outline" className="text-xs">
                        +{Object.entries(role.permissions).filter(([_, hasPermission]) => hasPermission).length - 5} weitere
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingRole(role)}
                  >
                    Bearbeiten
                  </Button>
                  {!role.isDefault && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteRole(role._id!, role.name)}
                      disabled={isLoading}
                    >
                      Löschen
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </Card>
  )
}
