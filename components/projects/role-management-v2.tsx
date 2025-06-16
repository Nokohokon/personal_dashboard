'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { UserPlus, Crown, Shield, User, Settings, Trash2, LogOut, Edit } from 'lucide-react';

interface ProjectRole {
  _id?: string;
  name: string;
  description?: string;
  permissions: {
    canEditProject: boolean;
    canDeleteProject: boolean;
    canManageTeam: boolean;
    canManageRoles: boolean;
    canViewContent: boolean;
    canCreateContent: boolean;
    canEditContent: boolean;
    canDeleteContent: boolean;
    canViewAnalytics: boolean;
    canViewTimeTracking: boolean;
    canManageTimeEntries: boolean;
    canViewDocuments: boolean;
    canCreateDocuments: boolean;
    canEditDocuments: boolean;
    canDeleteDocuments: boolean;
    canViewNotes: boolean;
    canCreateNotes: boolean;
    canEditNotes: boolean;
    canDeleteNotes: boolean;
    canViewContacts: boolean;
    canCreateContacts: boolean;
    canEditContacts: boolean;
    canDeleteContacts: boolean;
    canViewEvents: boolean;
    canCreateEvents: boolean;
    canEditEvents: boolean;
    canDeleteEvents: boolean;
  };
  isDefault?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface TeamMember {
  _id: string;
  email: string;
  name?: string;
  userId?: string;
  isRegistered: boolean;
  role: string;
  roleId?: string;
  addedAt: Date;
}

interface RoleManagementProps {
  projectId: string;
  canManageRoles: boolean;
  onRolesUpdate: () => void;
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
};

const defaultRoles: ProjectRole[] = [
  {
    _id: "default-owner",
    name: "Owner",
    description: "Vollzugriff auf alle Projektfunktionen - kann alles verwalten und konfigurieren",
    permissions: {
      canEditProject: true,
      canDeleteProject: true,
      canManageTeam: true,
      canManageRoles: true,
      canViewContent: true,
      canCreateContent: true,
      canEditContent: true,
      canDeleteContent: true,
      canViewAnalytics: true,
      canViewTimeTracking: true,
      canManageTimeEntries: true,
      canViewDocuments: true,
      canCreateDocuments: true,
      canEditDocuments: true,
      canDeleteDocuments: true,
      canViewNotes: true,
      canCreateNotes: true,
      canEditNotes: true,
      canDeleteNotes: true,
      canViewContacts: true,
      canCreateContacts: true,
      canEditContacts: true,
      canDeleteContacts: true,
      canViewEvents: true,
      canCreateEvents: true,
      canEditEvents: true,
      canDeleteEvents: true
    },
    isDefault: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: "default-editor",
    name: "Editor",
    description: "Kann Projektinhalte erstellen und bearbeiten, aber keine Projekteinstellungen oder Teammitglieder verwalten",
    permissions: {
      canEditProject: false,
      canDeleteProject: false,
      canManageTeam: false,
      canManageRoles: false,
      canViewContent: true,
      canCreateContent: true,
      canEditContent: true,
      canDeleteContent: false,
      canViewAnalytics: false,
      canViewTimeTracking: false,
      canManageTimeEntries: false,
      canViewDocuments: true,
      canCreateDocuments: true,
      canEditDocuments: true,
      canDeleteDocuments: false,
      canViewNotes: true,
      canCreateNotes: true,
      canEditNotes: true,
      canDeleteNotes: false,
      canViewContacts: true,
      canCreateContacts: true,
      canEditContacts: true,
      canDeleteContacts: false,
      canViewEvents: true,
      canCreateEvents: true,
      canEditEvents: true,
      canDeleteEvents: false
    },
    isDefault: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: "default-viewer",
    name: "Viewer",
    description: "Kann alle Projektinhalte nur ansehen und lesen, aber nichts bearbeiten oder erstellen",
    permissions: {
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
    },
    isDefault: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

export default function RoleManagement({ projectId, canManageRoles, onRolesUpdate }: RoleManagementProps) {
  const { data: session } = useSession();
  const [roles, setRoles] = useState<ProjectRole[]>([]);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<ProjectRole | null>(null);
  const [newRole, setNewRole] = useState({
    name: "",
    description: "",
    permissions: { ...defaultPermissions }
  });
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [selectedRole, setSelectedRole] = useState('Editor');
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);

  useEffect(() => {
    if (projectId) {
      fetchRoles();
      fetchMembers();
    }
  }, [projectId]);

  const fetchRoles = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/roles`);
      if (response.ok) {
        const data = await response.json();
        setRoles(data.roles || []);
      }
    } catch (error) {
      console.error("Error fetching project roles:", error);
    }
  };

  const fetchMembers = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/members`);
      if (response.ok) {
        const data = await response.json();
        setMembers(data.allMembers || []);
      }
    } catch (error) {
      console.error("Error fetching team members:", error);
    }
  };

  const handleCreateRole = async () => {
    if (!newRole.name.trim()) {
      alert("Please enter a role name");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/roles`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newRole)
      });

      if (response.ok) {
        alert("Role created successfully");
        setNewRole({
          name: "",
          description: "",
          permissions: { ...defaultPermissions }
        });
        setIsDialogOpen(false);
        fetchRoles();
        onRolesUpdate();
      } else {
        const error = await response.json();
        alert(error.error || "Error creating role");
      }
    } catch (error) {
      alert("Network error creating role");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateRole = async (role: ProjectRole) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/roles`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roleId: role._id,
          name: role.name,
          description: role.description,
          permissions: role.permissions
        })
      });

      if (response.ok) {
        alert("Role updated successfully");
        setEditingRole(null);
        fetchRoles();
        onRolesUpdate();
      } else {
        const error = await response.json();
        alert(error.error || "Error updating role");
      }
    } catch (error) {
      alert("Network error updating role");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteRole = async (roleId: string, roleName: string) => {
    if (!confirm(`Do you really want to delete the role "${roleName}"?`)) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/roles/${roleId}`, {
        method: "DELETE"
      });

      if (response.ok) {
        alert("Role deleted successfully");
        fetchRoles();
        onRolesUpdate();
      } else {
        const error = await response.json();
        alert(error.error || "Error deleting role");
      }
    } catch (error) {
      alert("Network error deleting role");
    } finally {
      setIsLoading(false);
    }
  };

  const addMember = async () => {
    if (!newMemberEmail.trim()) {
      alert('Please enter an email address');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: newMemberEmail,
          role: selectedRole
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add member');
      }      setNewMemberEmail('');
      setSelectedRole('Editor');
      setIsAddMemberOpen(false);
      fetchMembers();
      onRolesUpdate();
      alert('Member added successfully');
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to add member');
    } finally {
      setIsLoading(false);
    }
  };
  const updateMemberRole = async (memberId: string, newRoleId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/members/${memberId}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRoleId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update role');
      }

      const result = await response.json();
      console.log('Role updated successfully:', result);
      
      // Refresh data
      await Promise.all([fetchMembers(), fetchRoles()]);
      onRolesUpdate();
      
      // Show success message
      alert('Member role updated successfully');
    } catch (error) {
      console.error('Error updating member role:', error);
      alert(error instanceof Error ? error.message : 'Failed to update role');
    } finally {
      setIsLoading(false);
    }
  };

  const removeMember = async (memberId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/members/${memberId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to remove member');
      }

      fetchMembers();
      onRolesUpdate();
      alert('Member removed successfully');
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to remove member');
    } finally {
      setIsLoading(false);
    }
  };

  const leaveProject = async () => {
    if (!confirm('Are you sure you want to leave this project?')) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/leave`, {
        method: 'POST',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to leave project');
      }

      window.location.href = '/dashboard/projects';
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to leave project');
    } finally {
      setIsLoading(false);
    }
  };

  const updatePermission = (permissions: any, key: string, value: boolean) => {
    return { ...permissions, [key]: value };
  };

  const renderPermissionSection = (
    title: string, 
    permissions: any, 
    permissionKeys: string[], 
    onUpdate: (permissions: any) => void
  ) => (
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
  );

  // Ensure we always have default roles available
  const getAllAvailableRoles = () => {
    const apiRoles = roles || [];
    const mergedRoles = [...defaultRoles];
    
    // Add custom roles from API
    apiRoles.forEach(apiRole => {
      if (!defaultRoles.some(defaultRole => defaultRole.name === apiRole.name)) {
        mergedRoles.push(apiRole);
      }
    });
    
    return mergedRoles;
  };

  if (!canManageRoles) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Roles</CardTitle>
        </CardHeader>        <CardContent>
          <div className="space-y-2">
            {getAllAvailableRoles().map((role, index) => (
              <div key={role._id || role.name || index} className="flex items-center justify-between p-3 border rounded">
                <div>
                  <span className="font-medium">{role.name}</span>
                  {role.description && (
                    <p className="text-sm text-gray-600">{role.description}</p>
                  )}
                  {role.isDefault && (
                    <Badge variant="secondary" className="mt-1">Default</Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="members" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="members">Team Members</TabsTrigger>
          <TabsTrigger value="roles">Roles & Permissions</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="members" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Team Members ({members.length})</h3>
            {canManageRoles && (
              <Dialog open={isAddMemberOpen} onOpenChange={setIsAddMemberOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Add Member
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Team Member</DialogTitle>
                    <DialogDescription>
                      Add a new member to this project by entering their email address.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="Enter email address"
                        value={newMemberEmail}
                        onChange={(e) => setNewMemberEmail(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="role">Role</Label>
                      <Select value={selectedRole} onValueChange={setSelectedRole}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>                        <SelectContent>
                          {getAllAvailableRoles().filter(role => role.name !== 'Owner').map((role, index) => (
                            <SelectItem key={role._id || role.name || index} value={role._id || role.name}>
                              <div className="flex flex-col">
                                <span className="font-medium">{role.name}</span>
                                {role.description && (
                                  <span className="text-xs text-gray-500">{role.description}</span>
                                )}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setIsAddMemberOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button onClick={addMember} disabled={isLoading}>
                        Add Member
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>

          <div className="grid gap-4">            {members.map((member, index) => (
              <Card key={member._id || member.email || index}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        {member.role === 'owner' ? (
                          <Crown className="h-4 w-4 text-yellow-500" />
                        ) : member.role === 'admin' ? (
                          <Shield className="h-4 w-4 text-purple-500" />
                        ) : (
                          <User className="h-4 w-4 text-gray-500" />
                        )}
                        <div>
                          <p className="font-medium">
                            {member.name || member.email}
                            {member.email === session?.user?.email && (
                              <span className="text-sm text-gray-500 ml-2">(You)</span>
                            )}
                          </p>
                          <p className="text-sm text-gray-500">{member.email}</p>
                        </div>
                      </div>
                    </div>
                      <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="capitalize">
                        {member.role}
                      </Badge>
                      
                      {canManageRoles && member.role !== 'owner' && member.email !== session?.user?.email && (
                        <div className="flex gap-1">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={isLoading}
                              >
                                <Edit className="h-4 w-4" />
                                Change Role
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Change Role</DialogTitle>
                                <DialogDescription>
                                  Change the role for {member.name || member.email}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <Label>Current Role</Label>
                                  <p className="text-sm text-gray-600 capitalize">{member.role}</p>
                                </div>
                                <div>
                                  <Label htmlFor="newRole">New Role</Label>                                  <Select
                                    onValueChange={(newRole) => {
                                      if (confirm(`Are you sure you want to change ${member.name || member.email}'s role to ${getAllAvailableRoles().find(r => r._id === newRole || r.name === newRole)?.name}?`)) {
                                        updateMemberRole(member._id, newRole);
                                      }
                                    }}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select new role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {getAllAvailableRoles().filter(role => role.name !== 'Owner' && (role._id !== member.roleId && role.name.toLowerCase() !== member.role.toLowerCase())).map((role, index) => (
                                        <SelectItem key={role._id || role.name || index} value={role._id || role.name}>
                                          <div className="flex flex-col">
                                            <span className="font-medium">{role.name}</span>
                                            {role.description && (
                                              <span className="text-xs text-gray-500">{role.description}</span>
                                            )}
                                          </div>
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              if (confirm(`Are you sure you want to remove ${member.name || member.email} from this project?`)) {
                                removeMember(member._id);
                              }
                            }}
                            disabled={isLoading}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="roles" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Roles & Permissions</h3>
            {canManageRoles && (
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Settings className="mr-2 h-4 w-4" />
                    Create Custom Role
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Create Custom Role</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="roleName">Role Name</Label>
                      <Input
                        id="roleName"
                        placeholder="e.g., Content Manager"
                        value={newRole.name}
                        onChange={(e) => setNewRole(prev => ({ ...prev, name: e.target.value }))}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="roleDescription">Description</Label>
                      <Textarea
                        id="roleDescription"
                        placeholder="Brief description of this role"
                        value={newRole.description}
                        onChange={(e) => setNewRole(prev => ({ ...prev, description: e.target.value }))}
                      />
                    </div>

                    <Tabs defaultValue="project" className="w-full">
                      <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="project">Project</TabsTrigger>
                        <TabsTrigger value="content">Content</TabsTrigger>
                        <TabsTrigger value="modules">Modules</TabsTrigger>
                        <TabsTrigger value="special">Special</TabsTrigger>
                      </TabsList>

                      <TabsContent value="project" className="space-y-4">
                        {renderPermissionSection(
                          "Project Management",
                          newRole.permissions,
                          ["canEditProject", "canDeleteProject", "canManageTeam", "canManageRoles"],
                          (permissions) => setNewRole(prev => ({ ...prev, permissions }))
                        )}
                      </TabsContent>

                      <TabsContent value="content" className="space-y-4">
                        {renderPermissionSection(
                          "General Content",
                          newRole.permissions,
                          ["canViewContent", "canCreateContent", "canEditContent", "canDeleteContent"],
                          (permissions) => setNewRole(prev => ({ ...prev, permissions }))
                        )}
                      </TabsContent>

                      <TabsContent value="modules" className="space-y-6">
                        {renderPermissionSection(
                          "Documents",
                          newRole.permissions,
                          ["canViewDocuments", "canCreateDocuments", "canEditDocuments", "canDeleteDocuments"],
                          (permissions) => setNewRole(prev => ({ ...prev, permissions }))
                        )}
                        
                        {renderPermissionSection(
                          "Notes",
                          newRole.permissions,
                          ["canViewNotes", "canCreateNotes", "canEditNotes", "canDeleteNotes"],
                          (permissions) => setNewRole(prev => ({ ...prev, permissions }))
                        )}
                        
                        {renderPermissionSection(
                          "Contacts",
                          newRole.permissions,
                          ["canViewContacts", "canCreateContacts", "canEditContacts", "canDeleteContacts"],
                          (permissions) => setNewRole(prev => ({ ...prev, permissions }))
                        )}
                        
                        {renderPermissionSection(
                          "Calendar/Events",
                          newRole.permissions,
                          ["canViewEvents", "canCreateEvents", "canEditEvents", "canDeleteEvents"],
                          (permissions) => setNewRole(prev => ({ ...prev, permissions }))
                        )}
                      </TabsContent>

                      <TabsContent value="special" className="space-y-4">
                        {renderPermissionSection(
                          "Special Areas",
                          newRole.permissions,
                          ["canViewAnalytics", "canViewTimeTracking", "canManageTimeEntries"],
                          (permissions) => setNewRole(prev => ({ ...prev, permissions }))
                        )}
                      </TabsContent>
                    </Tabs>

                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setIsDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button onClick={handleCreateRole} disabled={isLoading}>
                        Create Role
                      </Button>
                    </div>
                  </div>
                </DialogContent>              </Dialog>
            )}
          </div>

          <div className="grid gap-4">
            {getAllAvailableRoles().map((role, index) => (
              <div key={role._id || role.name || index} className="border rounded-lg p-4">
                {editingRole?._id === role._id ? (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="editRoleName">Role Name</Label>
                      <Input
                        id="editRoleName"
                        value={editingRole?.name || ""}
                        onChange={(e) => editingRole && setEditingRole({ 
                          ...editingRole, 
                          name: e.target.value,
                          permissions: editingRole.permissions,
                          createdAt: editingRole.createdAt,
                          updatedAt: editingRole.updatedAt
                        })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="editRoleDescription">Description</Label>
                      <Textarea
                        id="editRoleDescription"
                        value={editingRole?.description || ""}
                        onChange={(e) => editingRole && setEditingRole({ 
                          ...editingRole, 
                          description: e.target.value,
                          name: editingRole.name,
                          permissions: editingRole.permissions,
                          createdAt: editingRole.createdAt,
                          updatedAt: editingRole.updatedAt
                        })}
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setEditingRole(null)}>
                        Cancel
                      </Button>
                      <Button 
                        onClick={() => editingRole && handleUpdateRole(editingRole)} 
                        disabled={isLoading || !editingRole}
                      >
                        Save
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{role.name}</span>
                        {role.isDefault && (
                          <Badge variant="secondary">Default</Badge>
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
                            +{Object.entries(role.permissions).filter(([_, hasPermission]) => hasPermission).length - 5} more
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      {!role.isDefault && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingRole(role)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteRole(role._id!, role.name)}
                            disabled={isLoading}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-red-600">Danger Zone</CardTitle>
              <CardDescription>
                These actions cannot be undone. Please be careful.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {session?.user?.email && members.find(m => m.email === session.user?.email)?.role !== 'owner' && (
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Leave Project</h4>
                    <p className="text-sm text-gray-500">
                      Remove yourself from this project. You will lose access to all project content.
                    </p>
                  </div>
                  <Button
                    variant="destructive"
                    onClick={leaveProject}
                    disabled={isLoading}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Leave Project
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
