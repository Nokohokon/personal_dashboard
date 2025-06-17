"use client"

import { SessionProvider } from "next-auth/react"

export function Providers({ children }: { children: React.ReactNode }) {
  console.log("🔧 SessionProvider - Initializing")
  
  return (
    <SessionProvider 
      refetchInterval={5 * 60} // refetch every 5 minutes
      refetchOnWindowFocus={true}
    >
      {children}
    </SessionProvider>
  )
}
