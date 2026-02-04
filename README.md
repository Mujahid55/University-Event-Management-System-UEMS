# University Event Management System (UEMS)

A comprehensive web-based platform for managing university events, streamlining the approval process, and tracking attendance. Built as a senior project to solve the challenges of event coordination across multiple student organizations and administrative departments.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [System Architecture](#system-architecture)
- [Getting Started](#getting-started)
- [User Roles](#user-roles)
- [Key Workflows](#key-workflows)
- [Database Schema](#database-schema)
- [Screenshots](#screenshots)
- [Future Enhancements](#future-enhancements)
- [Contributing](#contributing)
- [License](#license)

## Overview

The University Event Management System (UEMS) is designed to streamline the entire event lifecycle at universities - from initial planning to post-event analytics. The system addresses common pain points in event management including:

- Complex multi-level approval workflows
- Venue booking conflicts
- Manual attendance tracking
- Lack of centralized event visibility
- Inefficient communication between clubs and administrators

### Problem Statement

Universities typically host hundreds of events annually across various student clubs and organizations. The traditional process involves:
- Paper-based or email approval chains
- Manual venue conflict checking
- Spreadsheet-based attendance tracking
- Disconnected communication channels
- Limited analytics and reporting

UEMS provides a unified digital platform to manage all these aspects efficiently.

## Features

### Event Management
- **Event Creation & Editing**: Rich text editor with AI-assisted description generation
- **Template System**: Save and reuse event configurations for recurring events
- **Multi-level Approval Workflow**: Automated routing through club officers and student affairs
- **Status Tracking**: Real-time visibility into event approval status
- **Conflict Detection**: Automatic venue and time conflict checking

### Venue Management
- **Venue Registry**: Comprehensive database of campus venues with capacity and amenities
- **Blackout Dates**: Configure unavailable periods for maintenance or special events
- **Operating Hours**: Define venue availability schedules
- **Capacity Tracking**: Ensure events don't exceed venue limits

### Club Management
- **Club Profiles**: Manage club information, logos, and membership
- **Role Assignment**: Assign officers, sponsors, and members with appropriate permissions
- **Club Dashboard**: View all club events and pending approvals

### Attendance Tracking
- **QR Code Check-in**: Generate unique QR codes for each event
- **Real-time Tracking**: Monitor attendance as participants check in
- **Export Functionality**: Download attendance reports for record-keeping
- **Analytics**: View attendance trends and statistics

### Analytics & Reporting
- **Event Analytics**: Track event success metrics and attendance patterns
- **Club Performance**: Compare activity levels across organizations
- **Venue Utilization**: Identify popular venues and optimal booking times
- **Trend Analysis**: Visualize event data over time with charts and graphs

### User Management
- **Role-Based Access Control**: Five distinct user roles with granular permissions
- **Profile Management**: Customizable user profiles with avatars
- **Notification System**: Real-time updates on event status changes
- **Authentication**: Secure authentication powered by Supabase Auth

### Additional Features
- **Calendar View**: Visualize all events in a monthly/weekly calendar format
- **Dark Mode**: User preference-based theme switching
- **Responsive Design**: Fully functional on desktop, tablet, and mobile devices
- **AI Assistance**: AI-powered event description generator and recommendations
- **Comments & Feedback**: Threaded discussions on event proposals

## Tech Stack

### Frontend
- **React 18**: Modern UI library with hooks
- **TypeScript**: Type-safe development
- **Vite**: Fast build tool and development server
- **Tailwind CSS**: Utility-first CSS framework
- **shadcn/ui**: High-quality component library built on Radix UI
- **React Router v6**: Client-side routing
- **TanStack Query**: Server state management
- **React Hook Form**: Form state and validation
- **Zod**: Schema validation
- **Recharts**: Data visualization
- **React Big Calendar**: Calendar component
- **date-fns**: Date manipulation utilities

### Backend & Infrastructure
- **Supabase**: Backend-as-a-Service platform
  - PostgreSQL database
  - Real-time subscriptions
  - Authentication & authorization
  - Row Level Security (RLS)
  - Storage for file uploads
- **Edge Functions**: Serverless functions for business logic

### Development Tools
- **ESLint**: Code linting
- **TypeScript ESLint**: TypeScript-specific linting rules
- **Autoprefixer**: CSS vendor prefixing
- **PostCSS**: CSS transformations

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Client Application                       │
│                  (React + TypeScript + Vite)                 │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Pages      │  │  Components  │  │    Hooks     │      │
│  │              │  │              │  │              │      │
│  │ • Dashboard  │  │ • Event Form │  │ • useAuth    │      │
│  │ • Events     │  │ • Calendar   │  │ • useEvents  │      │
│  │ • Analytics  │  │ • Charts     │  │ • useVenues  │      │
│  │ • Admin      │  │ • Dialogs    │  │ • useRoles   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                              │
│                    ┌──────────────────┐                     │
│                    │  TanStack Query  │                     │
│                    │  (State Manager) │                     │
│                    └──────────────────┘                     │
└──────────────────────────┬──────────────────────────────────┘
                          │
                          │ REST API / Real-time
                          │
┌─────────────────────────┴──────────────────────────────────┐
│                    Supabase Backend                         │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  PostgreSQL  │  │     Auth     │  │   Storage    │      │
│  │   Database   │  │              │  │              │      │
│  │              │  │ • Email/Pass │  │ • Event      │      │
│  │ • Events     │  │ • OAuth      │  │   Attachments│      │
│  │ • Clubs      │  │ • JWT        │  │ • Avatars    │      │
│  │ • Venues     │  │              │  │              │      │
│  │ • Users      │  └──────────────┘  └──────────────┘      │
│  │ • Approvals  │                                           │
│  │ • Attendance │  ┌──────────────┐  ┌──────────────┐      │
│  └──────────────┘  │  Real-time   │  │ Edge Funcs   │      │
│                    │ Subscriptions│  │              │      │
│                    │              │  │ • Notifications     │
│                    │ • Event      │  │ • Email      │      │
│                    │   Updates    │  │ • Scheduled  │      │
│                    │ • Notifications  │   Tasks      │      │
│                    └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

## Getting Started

### Prerequisites

- Node.js 18.x or higher
- npm or bun package manager
- Git
- Supabase account (for production deployment)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd "University Event Management System (UEMS)"
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   bun install
   ```

3. **Set up environment variables**

   Create a `.env` file in the root directory:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
   VITE_SUPABASE_PROJECT_ID=your_project_id
   ```

4. **Set up Supabase**

   - Create a new Supabase project at [supabase.com](https://supabase.com)
   - Run the database migrations:
     ```bash
     # Install Supabase CLI
     npm install -g supabase

     # Link to your project
     supabase link --project-ref your-project-id

     # Push migrations
     supabase db push
     ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Access the application**

   Open your browser and navigate to `http://localhost:5173`

### First-Time Setup

1. **Create an admin account**
   - Register through the authentication page
   - Manually update your role to 'admin' in the Supabase dashboard:
     ```sql
     UPDATE profiles SET role = 'admin' WHERE email = 'your-email@example.com';
     ```

2. **Create clubs and venues**
   - Navigate to Admin > Clubs to add student organizations
   - Navigate to Admin > Venues to add campus venues

3. **Assign roles to users**
   - Use the Admin > Role Management page to assign appropriate roles to users

## User Roles

The system implements a hierarchical role-based access control system:

### 1. Member
- View public events
- RSVP to events
- Check in to events via QR code
- View their own attendance history

### 2. Officer
- All member permissions
- Create event proposals for their club
- Edit draft events
- View club-specific analytics
- Manage club member roster

### 3. Sponsor
- All officer permissions
- Approve/reject event proposals from their club
- Request changes to event proposals
- View comprehensive club analytics

### 4. Student Affairs (SA)
- View all events across all clubs
- Final approval authority for events
- Manage venues and blackout dates
- Access system-wide analytics
- Request changes or reject events

### 5. Admin
- All permissions in the system
- User role management
- Club creation and management
- System configuration
- Access to all administrative functions

## Key Workflows

### Event Creation & Approval Workflow

```
┌──────────────┐
│   Officer    │
│Creates Event │
│  (Draft)     │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│   Officer    │
│Submits Event │
└──────┬───────┘
       │
       ▼
┌──────────────────┐      ┌─────────────────┐
│  Club Sponsor    │─────▶│ Changes Required│
│Reviews Event     │      └────────┬────────┘
└──────┬───────────┘              │
       │                          │
       │ Approves                 │ Officer
       ▼                          │ Revises
┌──────────────────┐              │
│ Student Affairs  │◀─────────────┘
│Reviews Event     │
└──────┬───────────┘
       │
       ├─────────▶ ┌─────────────┐
       │           │  Rejected   │
       │           └─────────────┘
       │
       │ Approves
       ▼
┌──────────────┐
│  Approved &  │
│  Published   │
└──────────────┘
```

### Attendance Tracking Workflow

```
┌──────────────┐
│Event Approved│
└──────┬───────┘
       │
       ▼
┌──────────────────┐
│System Generates  │
│Unique QR Code    │
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│Attendees Scan    │
│QR at Event       │
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│Check-in Recorded │
│in Real-time      │
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│Officers View     │
│Attendance Report │
└──────────────────┘
```

## Database Schema

### Core Tables

**profiles**
- Extends Supabase auth.users
- Stores user information and role
- Links users to clubs

**clubs**
- Student organizations
- Tracks active status
- Stores club metadata

**venues**
- Campus locations for events
- Capacity and amenities
- Operating hours
- Active status

**events**
- Event details and description
- Links to club and venue
- Status tracking through approval workflow
- Timestamps for scheduling

**approvals**
- Audit trail of approval decisions
- Links to events and reviewers
- Stage-based approval tracking

**attendance**
- Event check-in records
- Timestamp tracking
- Links to events and users

**blackout_dates**
- Venue unavailability periods
- Maintenance and special events

**notifications**
- User notifications
- Event-based triggers
- Read/unread status

**comments**
- Discussion threads on events
- Feedback and questions

### Relationships

```
clubs ──┬─── has many ───▶ events
        └─── has many ───▶ profiles

venues ──┬─── has many ───▶ events
         └─── has many ───▶ blackout_dates

events ──┬─── has many ───▶ approvals
         ├─── has many ───▶ attendance
         ├─── has many ───▶ comments
         └─── has many ───▶ notifications

profiles ──┬─── creates ───▶ events
           ├─── reviews ───▶ approvals
           └─── attends ───▶ attendance
```

## Screenshots

> Note: Add screenshots of your application here showing:
> - Dashboard view
> - Event creation form
> - Calendar view
> - Analytics page
> - Admin panel
> - Mobile responsive views

## Future Enhancements

### Planned Features
- [ ] Email notifications for event updates
- [ ] SMS reminders for upcoming events
- [ ] Budget tracking and financial reporting
- [ ] Event feedback and rating system
- [ ] Integration with university calendar systems
- [ ] Mobile native applications (iOS/Android)
- [ ] Advanced analytics with ML predictions
- [ ] Multi-language support
- [ ] Event livestream integration
- [ ] Automated event promotion on social media

### Technical Improvements
- [ ] Implement comprehensive test suite (unit, integration, e2e)
- [ ] Add CI/CD pipeline with GitHub Actions
- [ ] Implement caching strategies for better performance
- [ ] Add offline support with service workers
- [ ] Optimize bundle size and lazy loading
- [ ] Add comprehensive error tracking (Sentry)
- [ ] Implement rate limiting and security hardening
- [ ] Add database backups and disaster recovery

## Project Structure

```
University Event Management System (UEMS)/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── ui/             # shadcn/ui components
│   │   ├── AIDescriptionGenerator.tsx
│   │   ├── NotificationBell.tsx
│   │   ├── RoleManagement.tsx
│   │   └── ...
│   ├── pages/              # Route pages
│   │   ├── Dashboard.tsx
│   │   ├── CreateEvent.tsx
│   │   ├── Calendar.tsx
│   │   ├── Analytics.tsx
│   │   ├── Admin.tsx
│   │   └── ...
│   ├── hooks/              # Custom React hooks
│   │   ├── use-toast.ts
│   │   ├── useUserRoles.ts
│   │   └── ...
│   ├── lib/                # Utility functions
│   │   ├── auth.tsx
│   │   └── utils.ts
│   ├── integrations/       # External service integrations
│   │   └── supabase/
│   ├── App.tsx             # Main app component
│   ├── main.tsx            # Entry point
│   └── index.css           # Global styles
├── supabase/
│   ├── migrations/         # Database migrations
│   ├── functions/          # Edge functions
│   └── config.toml         # Supabase configuration
├── public/                 # Static assets
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.ts
└── README.md
```

## Contributing

This is a senior project, but contributions, suggestions, and feedback are welcome!

### How to Contribute
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Development Guidelines
- Follow the existing code style and conventions
- Write meaningful commit messages
- Add comments for complex logic
- Update documentation for new features
- Test your changes thoroughly

## License

This project is developed as a senior capstone project. All rights reserved.

## Acknowledgments

- **shadcn/ui** for the beautiful component library
- **Supabase** for the excellent backend platform
- **Radix UI** for accessible component primitives
- **Vercel** for hosting and deployment
- University faculty and staff for guidance and feedback
- Fellow students who provided testing and suggestions

## Contact

For questions, feedback, or collaboration opportunities:
- Project Repository: [GitHub Repository URL]
- Email: [Your Email]
- LinkedIn: [Your LinkedIn Profile]

---

**Built with ❤️ as a Senior Project**

*This system demonstrates full-stack development capabilities including React, TypeScript, database design, authentication, real-time features, and complex business logic implementation.*
