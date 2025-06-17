"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export default function SessionDebugPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [logs, setLogs] = useState<string[]>([])

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 19)])
  }

  useEffect(() => {
    addLog(`Session status changed: ${status}`)
    if (session) {
      addLog(`Session data: ${JSON.stringify(session, null, 2)}`)
    }
  }, [session, status])

  const manualSessionCheck = async () => {
    try {
      const response = await fetch('/api/auth/session')
      const data = await response.json()
      addLog(`Manual session check: ${JSON.stringify(data, null, 2)}`)
    } catch (error) {
      addLog(`Manual session check error: ${error}`)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Session Debug Page</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-900 p-4 rounded-lg">
            <h2 className="text-lg font-semibold mb-2">Current State</h2>
            <div className="space-y-2 text-sm">
              <p><strong>Status:</strong> {status}</p>
              <p><strong>Has Session:</strong> {session ? 'Yes' : 'No'}</p>
              {session && (
                <>
                  <p><strong>User Email:</strong> {session.user?.email}</p>
                  <p><strong>User Name:</strong> {session.user?.name}</p>
                  <p><strong>User ID:</strong> {(session.user as any)?.id}</p>
                </>
              )}
            </div>
            
            <button 
              onClick={manualSessionCheck}
              className="mt-4 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-sm"
            >
              Manual Session Check
            </button>
            
            <button 
              onClick={() => router.push('/dashboard')}
              className="mt-4 ml-2 bg-green-600 hover:bg-green-700 px-4 py-2 rounded text-sm"
            >
              Go to Dashboard
            </button>
          </div>
          
          <div className="bg-slate-900 p-4 rounded-lg">
            <h2 className="text-lg font-semibold mb-2">Session Raw Data</h2>
            <pre className="text-xs bg-slate-800 p-2 rounded overflow-auto">
              {JSON.stringify(session, null, 2)}
            </pre>
          </div>
        </div>
        
        <div className="mt-6 bg-slate-900 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Debug Logs</h2>
          <div className="space-y-1 text-sm max-h-96 overflow-y-auto">
            {logs.length === 0 ? (
              <p className="text-slate-400">No logs yet...</p>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="font-mono text-xs bg-slate-800 p-2 rounded">
                  {log}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
