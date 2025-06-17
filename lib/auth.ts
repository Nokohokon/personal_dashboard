import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { MongoDBAdapter } from "@auth/mongodb-adapter"
import clientPromise from "@/lib/mongodb"
import bcrypt from "bcryptjs"

// Optional email provider - only load if email configuration is provided
const getEmailProvider = () => {
  if (process.env.EMAIL_SERVER_HOST && process.env.EMAIL_SERVER_USER && process.env.EMAIL_FROM) {
    const EmailProvider = require("next-auth/providers/email").default
    return EmailProvider({
      server: {
        host: process.env.EMAIL_SERVER_HOST,
        port: parseInt(process.env.EMAIL_SERVER_PORT || "587"),
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD
        }
      },
      from: process.env.EMAIL_FROM,
      maxAge: 24 * 60 * 60, // 24 hours
      sendVerificationRequest: async ({ identifier: email, url, provider, theme }: {
        identifier: string;
        url: string;
        provider: any;
        theme: any;
      }) => {
        const { server, from } = provider
        const { host } = new URL(url)
        
        const nodemailer = require("nodemailer")
        const transport = nodemailer.createTransport(server)
        
        const result = await transport.sendMail({
          to: email,
          from: from,
          subject: `Anmelden bei ${host}`,
          text: text({ url, host }),
          html: html({ url, host, email }),
        })
        
        const failed = result.rejected.concat(result.pending).filter(Boolean)
        if (failed.length) {
          throw new Error(`Email(s) (${failed.join(", ")}) could not be sent`)
        }
      },
    })
  }
  return null
}

function html({ url, host, email }: { url: string; host: string; email: string }) {
  const escapedEmail = `${email.replace(/\./g, "&#8203;.")}`
  const escapedHost = `${host.replace(/\./g, "&#8203;.")}`

  return `
    <body style="background: #f9f9f9;">
      <table width="100%" border="0" cellspacing="20" cellpadding="0" style="background: #f9f9f9; max-width: 600px; margin: auto; border-radius: 10px;">
        <tr>
          <td align="center" style="padding: 10px 0px; font-size: 22px; font-family: Helvetica, Arial, sans-serif; color: #333;">
            <strong>${escapedHost}</strong>
          </td>
        </tr>
        <tr>
          <td align="center" style="padding: 20px 0;">
            <table border="0" cellspacing="0" cellpadding="0">
              <tr>
                <td align="center" style="border-radius: 5px;" bgcolor="#346df1">
                  <a href="${url}" target="_blank" style="font-size: 18px; font-family: Helvetica, Arial, sans-serif; color: #fff; text-decoration: none; border-radius: 5px; padding: 10px 20px; border: 1px solid #346df1; display: inline-block; font-weight: bold;">
                    Anmelden
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td align="center" style="padding: 0px 0px 10px 0px; font-size: 16px; line-height: 22px; font-family: Helvetica, Arial, sans-serif; color: #333;">
            Wenn Sie sich nicht für ${escapedHost} angemeldet haben, können Sie diese E-Mail ignorieren.
          </td>
        </tr>
      </table>
    </body>
  `
}

function text({ url, host }: { url: string; host: string }) {
  return `Anmelden bei ${host}\n${url}\n\n`
}

const providers = [
  CredentialsProvider({
    name: "credentials",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" }
    },
    async authorize(credentials) {
      if (!credentials?.email || !credentials?.password) {
        console.log("Missing credentials")
        return null
      }

      try {
        const client = await clientPromise
        const users = client.db().collection("users")
        
        const user = await users.findOne({
          email: credentials.email.toLowerCase()
        })

        if (!user) {
          console.log("User not found:", credentials.email)
          return null
        }

        if (!user.password) {
          console.log("User has no password (likely created via magic link)")
          return null
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        )

        if (!isPasswordValid) {
          console.log("Invalid password for user:", credentials.email)
          return null
        }

        console.log("Login successful for user:", credentials.email)
        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
        }
      } catch (error) {
        console.error("Error in authorize function:", error)
        return null
      }
    }
  })
]

// Temporär Email Provider deaktivieren für JWT-Sessions
// const emailProvider = getEmailProvider()
// if (emailProvider) {
//   providers.push(emailProvider)
// }

export const authOptions: NextAuthOptions = {
  // Temporär auf JWT umstellen, um das Session-Problem zu lösen
  // adapter: MongoDBAdapter(clientPromise),
  providers,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/auth/signin",
    verifyRequest: "/auth/verify-request",
    newUser: "/auth/success",
  },
  callbacks: {
    async jwt({ token, user, account }) {
      console.log("🔑 JWT callback:", { 
        hasToken: !!token, 
        hasUser: !!user, 
        hasAccount: !!account,
        tokenEmail: token.email,
        userEmail: user?.email 
      })
      
      // Persist the OAuth account details to the token right after signin
      if (account && user) {
        token.id = user.id
        token.email = user.email
        token.name = user.name
        console.log("🔑 JWT - Adding user data to token")
      }
      return token
    },
    async signIn({ user, account, profile, email, credentials }) {
      console.log("🔐 SignIn callback:", { 
        provider: account?.provider, 
        userEmail: user?.email || email,
        hasUser: !!user,
        accountType: account?.type,
        userId: user?.id
      });
      
      // Für Magic Links (Email Provider)
      if (account?.provider === "email") {
        console.log("✅ Magic Link signin approved")
        return true
      }
      
      // Für Credentials Provider
      if (account?.provider === "credentials") {
        console.log("✅ Credentials signin approved")
        return true
      }
      
      console.log("✅ Default signin approved")
      return true
    },
    async redirect({ url, baseUrl }) {
      console.log("🔄 Redirect callback:", { url, baseUrl });
      
      // Nach erfolgreichem Login immer zum Dashboard weiterleiten
      if (url.startsWith("/") || url.startsWith(baseUrl)) {
        // Wenn es ein relativer Pfad ist oder die gleiche Domain
        if (url.includes("/auth/signin") || url.includes("/api/auth/callback") || url.includes("/auth/success")) {
          const dashboardUrl = `${baseUrl}/dashboard`
          console.log("🎯 Redirecting to dashboard:", dashboardUrl)
          return dashboardUrl
        }
        console.log("🎯 Redirecting to original URL:", url)
        return url
      }
      // Für externe URLs zum Dashboard weiterleiten
      const dashboardUrl = `${baseUrl}/dashboard`
      console.log("🎯 External URL, redirecting to dashboard:", dashboardUrl)
      return dashboardUrl
    },
    async session({ session, token }) {
      console.log("📋 Session callback:", { 
        hasSession: !!session, 
        hasToken: !!token, 
        sessionUserEmail: session?.user?.email,
        tokenId: token?.id,
        tokenEmail: token?.email
      })
      
      if (token && session?.user) {
        (session.user as any).id = token.id
        session.user.email = token.email as string
        session.user.name = token.name as string
        console.log("📋 Session updated with token data")
      }
      return session
    }
  },
  debug: process.env.NODE_ENV === "development",
}
