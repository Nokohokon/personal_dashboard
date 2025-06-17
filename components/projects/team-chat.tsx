"use client"

import { useState, useEffect, useRef } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  MessageSquare, 
  Send, 
  Users, 
  Clock,
  Crown,
  User as UserIcon,
  CheckCircle2,
  AlertCircle
} from "lucide-react"
import { format, isToday, isYesterday, formatDistanceToNow } from "date-fns"
import { de } from "date-fns/locale"

interface ChatMessage {
  _id: string
  projectId: string
  userId: string
  userName: string
  userEmail: string
  message: string
  timestamp: Date
  type: 'message' | 'system'
  isEdited?: boolean
  editedAt?: Date
}

interface TeamMember {
  email: string
  userId: string | null
  name: string | null
  isRegistered: boolean
  role: 'owner' | 'collaborator'
  addedAt: Date
  isOnline?: boolean
  lastSeen?: Date
}

interface TeamChatProps {
  projectId: string
  projectName: string
  allMembers: TeamMember[]
}

export function TeamChat({ projectId, projectName, allMembers }: TeamChatProps) {
  const { data: session } = useSession()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const currentUserId = (session?.user as any)?.id

  useEffect(() => {
    if (projectId) {
      fetchMessages()
    }
  }, [projectId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Auto-refresh messages every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (projectId) {
        fetchMessages()
      }
    }, 30000)

    return () => clearInterval(interval)
  }, [projectId])

  const fetchMessages = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/chat`)
      if (response.ok) {
        const data = await response.json()
        setMessages(data.messages || [])
      }
    } catch (error) {
      console.error("Error fetching messages:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || isSending) return

    setIsSending(true)
    try {
      const response = await fetch(`/api/projects/${projectId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: newMessage.trim() })
      })

      if (response.ok) {
        const data = await response.json()
        setMessages(prev => [...prev, data.message])
        setNewMessage("")
        scrollToBottom()
      }
    } catch (error) {
      console.error("Error sending message:", error)
    } finally {
      setIsSending(false)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const getInitials = (name: string, email: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    }
    return email.substring(0, 2).toUpperCase()
  }

  const formatMessageTime = (timestamp: Date) => {
    const date = new Date(timestamp)
    
    if (isToday(date)) {
      return format(date, "HH:mm")
    } else if (isYesterday(date)) {
      return `Gestern ${format(date, "HH:mm")}`
    } else {
      return format(date, "dd.MM. HH:mm")
    }
  }

  const getUserMember = (userId: string) => {
    return allMembers.find(member => member.userId === userId)
  }

  const isOwnMessage = (message: ChatMessage) => {
    return message.userId === currentUserId
  }

  const shouldShowAvatar = (message: ChatMessage, index: number) => {
    if (index === messages.length - 1) return true
    const nextMessage = messages[index + 1]
    return nextMessage.userId !== message.userId || 
           new Date(nextMessage.timestamp).getTime() - new Date(message.timestamp).getTime() > 300000 // 5 minutes
  }

  const shouldShowTimestamp = (message: ChatMessage, index: number) => {
    if (index === 0) return true
    const prevMessage = messages[index - 1]
    return new Date(message.timestamp).getTime() - new Date(prevMessage.timestamp).getTime() > 300000 // 5 minutes
  }

  return (
    <Card className="bg-gray-800/60 backdrop-blur-xl border border-gray-700/50 shadow-xl h-full flex flex-col">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-white flex items-center space-x-3">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <MessageSquare className="w-5 h-5 text-purple-400" />
              </div>
              <span>Team Chat</span>
            </CardTitle>
            <CardDescription className="text-gray-400">
              {projectName} • {allMembers.filter(m => m.isRegistered).length} aktive Mitglieder
            </CardDescription>
          </div>
          <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/30">
            <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
            Live
          </Badge>
        </div>
        
        {/* Team Members Status */}
        <div className="flex items-center space-x-2 pt-2">
          <Users className="w-4 h-4 text-gray-400" />
          <div className="flex -space-x-2">
            {allMembers.filter(m => m.isRegistered).slice(0, 5).map((member, index) => (
              <Avatar key={index} className="w-6 h-6 border-2 border-gray-800">
                <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${member.name || member.email}`} />
                <AvatarFallback className="bg-gray-600 text-white text-xs">
                  {getInitials(member.name || "", member.email)}
                </AvatarFallback>
              </Avatar>
            ))}
            {allMembers.filter(m => m.isRegistered).length > 5 && (
              <div className="w-6 h-6 bg-gray-600 rounded-full flex items-center justify-center text-xs text-white border-2 border-gray-800">
                +{allMembers.filter(m => m.isRegistered).length - 5}
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      <Separator className="bg-gray-700/50" />

      {/* Messages Area */}
      <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <MessageSquare className="w-12 h-12 text-gray-500 mb-4" />
            <p className="text-gray-400 text-lg font-medium mb-2">Noch keine Nachrichten</p>
            <p className="text-gray-500 text-sm">
              Seien Sie der erste, der eine Nachricht in diesem Projekt-Chat sendet!
            </p>
          </div>
        ) : (
          <>
            {messages.map((message, index) => {
              const member = getUserMember(message.userId)
              const isOwn = isOwnMessage(message)
              const showAvatar = shouldShowAvatar(message, index)
              const showTimestamp = shouldShowTimestamp(message, index)

              return (
                <div key={message._id}>
                  {showTimestamp && (
                    <div className="flex justify-center my-4">
                      <Badge variant="secondary" className="bg-gray-700/50 text-gray-400 text-xs">
                        {formatMessageTime(message.timestamp)}
                      </Badge>
                    </div>
                  )}
                  
                  <div className={`flex items-end space-x-3 ${isOwn ? 'flex-row-reverse space-x-reverse' : ''}`}>
                    {showAvatar ? (
                      <div className="flex flex-col items-center space-y-1">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${message.userName || message.userEmail}`} />
                          <AvatarFallback className="bg-gray-600 text-white text-xs">
                            {getInitials(message.userName || "", message.userEmail)}
                          </AvatarFallback>
                        </Avatar>
                        {member?.role === 'owner' && (
                          <Crown className="w-3 h-3 text-yellow-400" />
                        )}
                      </div>
                    ) : (
                      <div className="w-8"></div>
                    )}

                    <div className={`max-w-[70%] ${isOwn ? 'text-right' : ''}`}>
                      {showAvatar && (
                        <div className={`flex items-center space-x-2 mb-1 ${isOwn ? 'flex-row-reverse space-x-reverse' : ''}`}>
                          <p className="text-sm font-medium text-white">
                            {message.userName || message.userEmail}
                          </p>
                          {member?.role === 'owner' && (
                            <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs">
                              Owner
                            </Badge>
                          )}
                        </div>
                      )}
                      
                      <div className={`rounded-lg px-4 py-2 ${
                        isOwn 
                          ? 'bg-purple-600 text-white' 
                          : 'bg-gray-700/50 text-gray-100'
                      }`}>
                        <p className="text-sm whitespace-pre-wrap break-words">
                          {message.message}
                        </p>
                        {message.isEdited && (
                          <p className="text-xs text-gray-400 mt-1 italic">
                            bearbeitet
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
            <div ref={messagesEndRef} />
          </>
        )}
      </CardContent>

      <Separator className="bg-gray-700/50" />

      {/* Message Input */}
      <div className="p-4">
        <form onSubmit={sendMessage} className="flex space-x-3">
          <div className="flex-1">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Nachricht eingeben..."
              className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-purple-500"
              disabled={isSending}
              maxLength={1000}
            />
          </div>
          <Button 
            type="submit" 
            disabled={!newMessage.trim() || isSending}
            className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600"
          >
            {isSending ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : (
              <Send className="w-4 h-4 mr-2" />
            )}
            {isSending ? "Senden..." : "Senden"}
          </Button>
        </form>
        
        {/* Character count */}
        <div className="flex justify-between items-center mt-2">
          <p className="text-xs text-gray-500">
            {newMessage.length}/1000 Zeichen
          </p>
          <p className="text-xs text-gray-500">
            Drücken Sie Enter zum Senden
          </p>
        </div>
      </div>
    </Card>
  )
}
