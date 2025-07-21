# Personal Dashboard

A highly professional and modern personal dashboard with comprehensive productivity features, built with Next.js 15, TypeScript, MongoDB, and NextAuth.js.

## 🌟 Features

### 🔐 Authentication & Security
- **NextAuth.js Integration** - Secure authentication with email/password
- **Magic Link Authentication** - Passwordless login via email link
- **Password Hashing** - Secure storage with bcryptjs
- **Session Management** - JWT-based sessions
- **Flexible Login Options** - Choice between password or magic link

### ⏱️ Time Tracking
- **Project-based Time Tracking** - Organized by projects and tasks
- **Live Timer** - Real-time time tracking with start/stop functionality
- **Automatic Calculations** - Duration calculated automatically
- **History & Analytics** - Detailed time tracking with reports

### 👥 CRM & Contacts
- **Contact Management** - Complete contact database
- **Tagging System** - Contact categorization
- **Company Integration** - Link to companies and positions
- **Search Function** - Quick contact search

### 📝 Notes System
- **Categorized Notes** - Organized by categories
- **Markdown Support** - Rich-text notes
- **Contact Linking** - Notes can be linked to contacts
- **Tag System** - Flexible categorization
- **Collaborative Notes** - Share notes with other people
- **Project Integration** - Link notes to projects

### 🤝 Project Collaboration
- **Team Management** - Add team members via email
- **Role-based Permissions** - Project owners vs. collaborators
- **Project-based Access Control** - Automatic content permissions
- **Email-based Invitations** - Registered and unregistered users
- **Collaborative Content** - Shared notes, documents, contacts, and events

### 🔒 Access and Permission Management
- **Project Owner Rights** - Full access to all project data and project editing
- **Collaborator Rights** - Read/write access ONLY to project-related content (NOT the project itself)
- **Clear Separation** - Collaborators cannot edit project details
- **Protected Analytics** - Time tracking and analytics only for owners
- **Granular Sharing** - Share individual notes and documents

#### **📊 Permission Matrix**
| Feature | Project Owner | Collaborator | Individual Sharing |
|---------|----------------|---------------|-------------------|
| **Edit Project** | ✅ | ❌ | ❌ |
| **Manage Team** | ✅ | ❌ | ❌ |
| **Change Project Details** | ✅ | ❌ | ❌ |
| **Change Status/Budget** | ✅ | ❌ | ❌ |
| **Notes (project-related)** | ✅ | ✅ | ✅ |
| **Documents (project-related)** | ✅ | ✅ | ✅ |
| **Contacts (project-related)** | ✅ | ✅ | ✅ |
| **Calendar (project-related)** | ✅ | ✅ | ✅ |
| **Time-Tracking** | ✅ | ❌ | ❌ |
| **Analytics** | ✅ | ❌ | ❌ |

**🔐 Important Clarification:**
- Collaborators cannot edit the project itself (name, status, budget, etc.)
- Collaborators can ONLY edit project-related content (notes, documents, contacts, events)
- Only the project owner can manage the project and team

### 📊 Analytics & Reports
- **Productivity Dashboard** - Detailed insights into your work
- **Time Visualization** - Charts and graphs with Recharts
- **Project Distribution** - Analysis of time allocation
- **Trend Analysis** - Long-term productivity trends

### 📅 Calendar
- **Event Management** - Manage appointments and tasks
- **Various Event Types** - Meetings, tasks, reminders
- **Month View** - Clear calendar overview
- **Upcoming Events** - Overview of upcoming appointments
- **Advanced Recurring Events** - Complex repetition patterns
- **Flexible Repetitions** - Daily, weekly, monthly, yearly
- **Special Weekdays** - E.g. every 2nd Monday of the month
- **End Options** - By date, count, or infinite
- **Event Sharing** - Share events with team members

### 🎨 Modern Design
- **Dark Mode Only** - Consistent dark design
- **Responsive Design** - Optimized for all screen sizes
- **Tailwind CSS** - Modern and consistent UI
- **Radix UI Components** - High-quality, accessible components

### ⚙️ Settings
- **Profile Management** - Manage personal data
- **Change Password** - Secure password updates
- **Theme Settings** - Personalized display
- **Data Export** - Complete data export as JSON
- **Notifications** - Customizable notification settings

## 🛠️ Technology Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **Radix UI** - Primitive UI components
- **Lucide React** - Modern icon library
- **Recharts** - Data visualization
- **date-fns** - Date utilities

### Backend
- **Next.js API Routes** - Serverless API endpoints
- **MongoDB** - NoSQL database
- **NextAuth.js** - Authentication
- **bcryptjs** - Password hashing

### Development
- **ESLint** - Code quality
- **TypeScript** - Type checking
- **Turbopack** - Fast development server

## 📦 Installation & Setup

### Prerequisites
- Node.js 18.17.0 or higher
- MongoDB (local or Atlas)
- Git

### 1. Clone repository
```bash
git clone [repository-url]
cd personal_dashboard
```

### 2. Install dependencies
```bash
npm install
```

### 3. Set up environment variables
Create a `.env.local` file in the root directory:

```env
# Auth.js Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here-change-in-production

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/personal-dashboard

# Email Configuration (Optional - for email authentication)
EMAIL_SERVER_HOST=smtp.gmail.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=your-email@gmail.com
EMAIL_SERVER_PASSWORD=your-app-password
EMAIL_FROM=your-email@gmail.com
```

### 4. Set up MongoDB

#### Option A: Local MongoDB Installation
1. Install MongoDB Community Server
2. Start MongoDB service
3. The application will automatically create the required collections

#### Option B: MongoDB Atlas (Cloud)
1. Create an account at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a new cluster
3. Copy the connection string to `MONGODB_URI`

### 5. Start development server
```bash
npm run dev
```

The application is now available at `http://localhost:3000`.

## 🚀 Deployment

### Vercel (Recommended)
1. Push your code to GitHub
2. Connect your repository with Vercel
3. Configure environment variables in Vercel
4. Deploy!

### Other Hosting Providers
The application can be deployed on any platform that supports Next.js:
- Netlify
- Railway
- Digital Ocean
- AWS
- Google Cloud

## 📚 Usage

### Getting Started
1. Register via `/auth/signup`
2. Sign in via `/auth/signin`
3. Explore the dashboard

### Time Tracking
1. Click "Start Timer" in the dashboard
2. Select project and task
3. Start time tracking
4. Stop timer when finished

### CRM & Contacts
1. Navigate to "CRM Notes"
2. Add new contacts
3. Organize with tags
4. Create linked notes

### Analytics
1. Visit the Analytics page
2. Select desired time period
3. Analyze your productivity trends

## 🔧 Configuration

### Theme Customization
The theme can be customized in `components/providers/theme-provider.tsx`.

### Database Schema
MongoDB collections are created automatically:
- `users` - User accounts
- `accounts` - NextAuth account links
- `sessions` - Active sessions
- `timeEntries` - Time tracking entries
- `contacts` - CRM contacts
- `notes` - Notes

### API Endpoints
- `/api/auth/*` - Authentication (NextAuth)
- `/api/time-entries` - Time tracking CRUD
- `/api/contacts` - Contacts CRUD
- `/api/notes` - Notes CRUD

## 🧪 Development

### Code Structure
```
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   ├── auth/              # Authentication Pages
│   ├── dashboard/         # Dashboard Pages
│   └── globals.css        # Global Styles
├── components/            # React Components
│   ├── dashboard/         # Dashboard-specific Components
│   ├── providers/         # Context Providers
│   └── ui/                # Reusable UI Components
├── lib/                   # Utilities and Configuration
│   ├── auth.ts           # NextAuth Configuration
│   ├── mongodb.ts        # MongoDB Connection
│   └── utils.ts          # Utility Functions
└── public/               # Static Assets
```

### Adding New Features
1. Create new API routes in `app/api/`
2. Develop UI components in `components/`
3. Add new pages in `app/dashboard/`
4. Extend navigation in `dashboard-layout.tsx`

## 🔒 Security

- All passwords are hashed with bcryptjs
- JWT-based session management
- CSRF protection through NextAuth.js
- Server-side input validation
- Secure HTTP-only cookies

## 📝 License

This project is available for personal and commercial use.

## 🤝 Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Create a pull request

## 📞 Support

Bei Fragen oder Problemen öffnen Sie bitte ein Issue im Repository.

---

**Viel Erfolg mit Ihrem Personal Dashboard! 🚀**
