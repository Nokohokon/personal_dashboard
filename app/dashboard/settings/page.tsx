"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import DashboardLayout from "@/components/dashboard/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { User, Settings, Bell, Lock, Download, Trash2 } from "lucide-react"

export default function SettingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [notifications, setNotifications] = useState({
    timeTracking: true,
    newContacts: false,
    dailySummary: true
  })

  const [profileForm, setProfileForm] = useState({
    name: "",
    email: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  })

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
    }
  }, [status, router])
  useEffect(() => {
    if (session?.user) {
      setProfileForm(prev => ({
        ...prev,
        name: session.user?.name || "",
        email: session.user?.email || ""
      }))
    }
  }, [session])

  const handleProfileUpdate = async () => {
    setIsLoading(true)
    
    try {
      // Here you would typically make an API call to update the profile
      // For now, we'll just show a success message
      console.log("Profile update:", profileForm)
      alert("Profile updated successfully!")
    } catch (error) {
      console.error("Error updating profile:", error)
      alert("Error updating profile")
    } finally {
      setIsLoading(false)
    }
  }

  const handlePasswordChange = async () => {
    if (profileForm.newPassword !== profileForm.confirmPassword) {
      alert("New passwords don't match")
      return
    }

    if (profileForm.newPassword.length < 6) {
      alert("New password must be at least 6 characters")
      return
    }

    setIsLoading(true)
    
    try {
      // Here you would typically make an API call to change the password
      console.log("Password change requested")
      alert("Password changed successfully!")
      setProfileForm(prev => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      }))
    } catch (error) {
      console.error("Error changing password:", error)
      alert("Error changing password")
    } finally {
      setIsLoading(false)
    }
  }

  const exportData = async () => {
    setIsLoading(true)
    
    try {
      // Fetch all user data
      const [timeRes, contactsRes, notesRes] = await Promise.all([
        fetch("/api/time-entries"),
        fetch("/api/contacts"),
        fetch("/api/notes")
      ])

      const exportData = {
        timeEntries: timeRes.ok ? await timeRes.json() : [],
        contacts: contactsRes.ok ? await contactsRes.json() : [],
        notes: notesRes.ok ? await notesRes.json() : [],
        exportDate: new Date().toISOString(),
        user: {
          name: session?.user?.name,
          email: session?.user?.email
        }
      }

      // Create and download JSON file
      const dataStr = JSON.stringify(exportData, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(dataBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `dashboard-export-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Error exporting data:", error)
      alert("Error exporting data")
    } finally {
      setIsLoading(false)
    }
  }

  const deleteAllData = async () => {
    if (!confirm("Are you sure you want to delete ALL your data? This action cannot be undone!")) {
      return
    }

    if (!confirm("This will permanently delete all your time entries, contacts, and notes. Are you absolutely sure?")) {
      return
    }

    setIsLoading(true)
    
    try {
      // Here you would make API calls to delete all user data
      console.log("Delete all data requested")
      alert("All data deleted successfully!")
    } catch (error) {
      console.error("Error deleting data:", error)
      alert("Error deleting data")
    } finally {
      setIsLoading(false)
    }
  }

  if (status === "loading") {
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
        <div>
          <h1 className="text-3xl font-bold text-white">
            Settings
          </h1>
          <p className="text-slate-400">
            Manage your account settings and preferences
          </p>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="data">Data</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="mr-2 h-5 w-5" />
                  Profile Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={profileForm.name}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profileForm.email}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, email: e.target.value }))}
                    />
                  </div>
                </div>
                <Button onClick={handleProfileUpdate} disabled={isLoading}>
                  {isLoading ? "Updating..." : "Update Profile"}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Lock className="mr-2 h-5 w-5" />
                  Change Password
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={profileForm.currentPassword}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={profileForm.newPassword}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, newPassword: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={profileForm.confirmPassword}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    />
                  </div>
                </div>
                <Button 
                  onClick={handlePasswordChange} 
                  disabled={isLoading || !profileForm.currentPassword || !profileForm.newPassword}
                >
                  {isLoading ? "Changing..." : "Change Password"}
                </Button>
              </CardContent>
            </Card>          </TabsContent>

          <TabsContent value="appearance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="mr-2 h-5 w-5" />
                  Display Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center py-8">
                  <Settings className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-white mb-2">
                    Dark Mode Enabled
                  </h3>
                  <p className="text-slate-400">
                    The dashboard is currently in dark mode for optimal viewing experience.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Bell className="mr-2 h-5 w-5" />
                  Notification Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Time Tracking Reminders</p>
                      <p className="text-sm text-slate-400">
                        Get reminders to start or stop time tracking
                      </p>
                    </div>
                    <Button
                      variant={notifications.timeTracking ? "default" : "outline"}
                      size="sm"
                      onClick={() => setNotifications(prev => ({ ...prev, timeTracking: !prev.timeTracking }))}
                    >
                      {notifications.timeTracking ? "On" : "Off"}
                    </Button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">New Contact Notifications</p>
                      <p className="text-sm text-slate-400">
                        Get notified when new contacts are added
                      </p>
                    </div>
                    <Button
                      variant={notifications.newContacts ? "default" : "outline"}
                      size="sm"
                      onClick={() => setNotifications(prev => ({ ...prev, newContacts: !prev.newContacts }))}
                    >
                      {notifications.newContacts ? "On" : "Off"}
                    </Button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Daily Summary</p>
                      <p className="text-sm text-slate-400">
                        Receive daily productivity summaries
                      </p>
                    </div>
                    <Button
                      variant={notifications.dailySummary ? "default" : "outline"}
                      size="sm"
                      onClick={() => setNotifications(prev => ({ ...prev, dailySummary: !prev.dailySummary }))}
                    >
                      {notifications.dailySummary ? "On" : "Off"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="data" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Download className="mr-2 h-5 w-5" />
                  Export Data
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-400 mb-4">
                  Download all your data including time entries, contacts, and notes as a JSON file.
                </p>
                <Button onClick={exportData} disabled={isLoading}>
                  {isLoading ? "Exporting..." : "Export All Data"}
                </Button>
              </CardContent>
            </Card>

            <Card className="border-red-200 border-red-800">
              <CardHeader>
                <CardTitle className="flex items-center text-red-600 text-red-400">
                  <Trash2 className="mr-2 h-5 w-5" />
                  Danger Zone
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-400 mb-4">
                  Permanently delete all your data. This action cannot be undone.
                </p>
                <Button 
                  variant="destructive" 
                  onClick={deleteAllData} 
                  disabled={isLoading}
                >
                  {isLoading ? "Deleting..." : "Delete All Data"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
