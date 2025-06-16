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
        return null
      }

      const client = await clientPromise
      const users = client.db().collection("users")
      
      const user = await users.findOne({
        email: credentials.email
      })

      if (!user) {
        return null
      }

      const isPasswordValid = await bcrypt.compare(
        credentials.password,
        user.password
      )

      if (!isPasswordValid) {
        return null
      }

      return {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
      }
    }
  })
]

// Add email provider if configured
const emailProvider = getEmailProvider()
if (emailProvider) {
  providers.push(emailProvider)
}

export const authOptions: NextAuthOptions = {
  adapter: MongoDBAdapter(clientPromise),
  providers,
  session: {
    strategy: "database"
  },
  pages: {
    signIn: "/auth/signin",
    verifyRequest: "/auth/verify-request",
    newUser: "/auth/success",
  },
  callbacks: {
    async signIn({ user, account, profile, email, credentials }) {
      // Für Magic Links (Email Provider)
      if (account?.provider === "email") {
        return true
      }
      
      // Für Credentials Provider
      if (account?.provider === "credentials") {
        return true
      }
      
      return true
    },
    async redirect({ url, baseUrl }) {
      // Nach erfolgreichem Magic Link Login immer zum Dashboard weiterleiten
      if (url.startsWith("/") || url.startsWith(baseUrl)) {
        // Wenn es ein relativer Pfad ist oder die gleiche Domain
        if (url.includes("/auth/signin") || url.includes("/api/auth/callback") || url.includes("/auth/success")) {
          return `${baseUrl}/dashboard`
        }
        return url
      }
      // Für externe URLs zum Dashboard weiterleiten
      return `${baseUrl}/dashboard`
    },
    async session({ session, user }) {
      if (user && session.user) {
        (session.user as any).id = user.id
      }
      return session
    }
  }
}
