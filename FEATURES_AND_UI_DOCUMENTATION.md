# Lawyer Diary - Complete Features & UI Documentation

## 📋 Table of Contents
1. [Application Overview](#application-overview)
2. [Complete Feature List](#complete-feature-list)
3. [Detailed UI Documentation](#detailed-ui-documentation)
4. [Navigation Structure](#navigation-structure)
5. [Feature Descriptions](#feature-descriptions)
6. [UI Components](#ui-components)
7. [Mobile Responsiveness](#mobile-responsiveness)
8. [Theme & Styling](#theme--styling)

---

## Application Overview

**Lawyer Diary** is a comprehensive legal practice management system built with Next.js, Supabase, and Stripe. It provides law firms with tools to manage cases, clients, billing, calendar, team communication, and more.

**Tech Stack:**
- **Framework**: Next.js 16 (App Router)
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Payments**: Stripe
- **UI Library**: Shadcn/ui + Tailwind CSS
- **Styling**: SAP Fiori Horizon Design System

---

## Complete Feature List

### 🔐 Authentication & Onboarding
1. **Sign In**
   - Email/Password authentication
   - Google OAuth integration
   - Password reset functionality
   - Session management

2. **Sign Up**
   - New user registration
   - Email verification
   - Firm creation during onboarding

3. **Onboarding Flow**
   - Firm setup wizard
   - Initial user profile creation
   - Subscription plan selection

4. **Team Invitations**
   - Email-based invitations
   - Role-based access (owner, principal_partner, associate, of_counsel, paralegal, staff)
   - Invitation token system
   - Invitation expiration

### 📊 Dashboard
1. **KPI Cards**
   - Active Matters count
   - Hearings this week
   - Total Clients
   - Revenue metrics (Today, This Week, This Month)
   - Unpaid Invoices count

2. **Revenue Charts**
   - Revenue trends visualization
   - Time-based revenue analysis

3. **Quick Actions**
   - Quick access to common tasks
   - Recent activity summary

4. **Trial Banner**
   - Free trial status display
   - Days remaining indicator
   - Trial end date

### 👥 Clients Management
1. **Client List**
   - Grid/List view toggle
   - Search and filter functionality
   - Client type (Individual/Organization)
   - Client details:
     - Full name, Father's name
     - CNIC/ID number
     - Email, Phone
     - Address (City, Province, Country)
     - Representation details
     - Notes

2. **Client Operations**
   - Create new client
   - Edit client information
   - Delete client (with confirmation)
   - View client details page

3. **Client Documents**
   - Document upload (PDF, DOCX, images)
   - Camera capture for documents
   - Document list with preview
   - Download documents
   - Delete documents
   - PDF export of client information

4. **Client-Case Association**
   - Link clients to matters
   - View all cases for a client

### ⚖️ Cases/Matters Management
1. **Case Board**
   - Kanban-style board view
   - Status columns (New, In Progress, On Hold, Closed)
   - Drag-and-drop case status updates
   - Case cards with key information

2. **Case Details**
   - Serial number
   - Case number
   - Court name
   - Client association
   - Status tracking
   - Assigned attorneys
   - Fee information
   - Case timeline/history

3. **Case Operations**
   - Create new matter
   - Edit matter details
   - Delete matter (with confirmation)
   - Status updates
   - Team assignment

4. **Case Documents**
   - Document upload per case
   - Document categorization
   - Document analysis (AI-powered)
   - Document preview and download
   - PDF export of case documents

5. **Case Finance**
   - Fee tracking
   - Payment records
   - Financial summary
   - Payment history

6. **Case Timeline**
   - History entries
   - Event tracking
   - Timeline visualization
   - Add timeline entries

7. **Case Team**
   - Assign attorneys
   - Role-based access
   - Team member management

### 📅 Calendar & Hearings
1. **Hearing Timeline**
   - Calendar view of hearings
   - Timeline visualization
   - Date-based filtering
   - Hearing status indicators

2. **Hearing Management**
   - Create new hearing
   - Edit hearing details
   - Delete hearing
   - Hearing information:
     - Scheduled date/time
     - Duration
     - Location
     - Status (Scheduled, Completed, Cancelled, Postponed)
     - Associated matter
     - Notes

3. **Hearing Operations**
   - Quick add hearing
   - Edit hearing dialog
   - Status updates
   - Print today's docket

4. **Calendar Integration**
   - Date-based navigation
   - Week/Month views
   - Hearing reminders

### 💰 Billing & Invoicing
1. **Invoice Board**
   - Invoice list with status
   - Filter by status (Draft, Sent, Paid, Overdue, Cancelled)
   - Search functionality
   - Invoice cards with key info

2. **Invoice Management**
   - Create new invoice
   - Edit invoice
   - Delete invoice (with confirmation)
   - Invoice details:
     - Invoice number (auto-generated)
     - Client selection
     - Matter association
     - Issue date
     - Due date
     - Line items
     - Tax calculation
     - Discount application
     - Payment terms

3. **Invoice Operations**
   - Mark as sent
   - Record payments
   - Payment history
   - Invoice status updates
   - PDF generation and download
   - Email invoice (future)

4. **Billing Statistics**
   - Total revenue
   - Outstanding invoices
   - Paid invoices
   - Overdue invoices
   - Aging analysis

5. **Aging Chart**
   - Accounts receivable aging
   - Visual aging buckets
   - Payment tracking

6. **Time Entries Integration**
   - Link time entries to invoices
   - Billable hours tracking
   - Time-based billing

### ⏱️ Time Tracking
1. **Time Entry Management**
   - Start/stop timer
   - Manual time entry
   - Time entry details:
     - Matter association
     - Description
     - Start/end time
     - Duration
     - Billable status
     - Billing rate
     - Amount calculation

2. **Time Entry Operations**
   - Create time entry
   - Edit time entry
   - Delete time entry
   - Link to invoices
   - Billable/non-billable toggle

### 💬 Messages & Communication
1. **Team Messaging**
   - Send messages to team members
   - Group messages (all team members)
   - Direct messages (one-to-one)
   - Message threads

2. **Message Features**
   - Real-time message updates
   - Read/unread status
   - Message history
   - Sent/Received/Group tabs
   - Message timestamps
   - Auto-mark as read

3. **Message Organization**
   - All messages view
   - Sent messages view
   - Received messages view
   - Group messages view
   - Message search (future)

### 🔔 Notifications
1. **Notification Bell**
   - Unread notification count
   - Notification dropdown
   - Notification types:
     - Hearing reminders
     - Invoice reminders
     - Announcement updates
     - System notifications

2. **Notification Management**
   - Mark as read
   - Mark all as read
   - Notification preferences
   - Notification history

### 💳 Subscription Management
1. **Subscription Status**
   - Current plan display
   - Subscription status (Active, Trial, Cancelled, Past Due)
   - Trial days remaining
   - Billing cycle information

2. **Subscription Operations**
   - Upgrade plan
   - Downgrade plan
   - Cancel subscription
   - Resume subscription
   - Update payment method
   - Access Stripe Customer Portal

3. **Subscription History**
   - Payment history
   - Invoice history
   - Subscription changes log

4. **Subscription Guide**
   - Plan comparison
   - Feature comparison
   - Pricing information

### ⚙️ Settings
1. **Profile Settings**
   - Full name
   - Phone number
   - Language preference (English/Urdu)
   - Profile picture (future)

2. **Firm Settings**
   - Firm name
   - Contact email
   - Contact phone
   - Address
   - Firm logo (future)

3. **Notification Preferences**
   - Hearing reminders toggle
   - Invoice reminders toggle
   - Announcement updates toggle

4. **Billing Settings**
   - Invoice prefix
   - Invoice number format
   - Next invoice number
   - Default payment terms
   - Default currency
   - Sales tax rate
   - Tax registration numbers
   - Payment methods
   - Bank account details
   - Invoice footer/notes
   - Auto-generate invoice number

5. **Team Management**
   - View team members
   - Invite team members
   - Manage invitations
   - Role assignment
   - Remove team members
   - Staff management (courts, districts)

6. **Access Control**
   - Role-based permissions
   - Firm owner privileges
   - Principal partner privileges
   - Staff permissions

### 📞 Contact & Support
1. **Contact Form**
   - Name
   - Email
   - Subject
   - Message
   - Submit to support

2. **Support Links**
   - Email: info@ux4u.online
   - Contact page link
   - Help documentation

### 📖 User Manual
1. **Documentation**
   - Feature guides
   - How-to articles
   - Video tutorials (future)
   - FAQ section

### 🔍 Search
1. **Global Search**
   - Search across:
     - Cases/Matters
     - Clients
     - Invoices
   - Search results display
   - Quick navigation to results

### 📱 Admin Features (Owner Only)
1. **Firm Management**
   - Create new firms
   - View all firms
   - Firm administration

---

## Detailed UI Documentation

### Layout Structure

#### Desktop Layout
```
┌─────────────────────────────────────────────────────────┐
│ Header (AppNav)                                         │
│ - Logo/Brand                                            │
│ - Search                                                │
│ - Notifications                                         │
│ - User Menu                                             │
└─────────────────────────────────────────────────────────┘
┌──────────┬──────────────────────────────────────────────┐
│          │                                              │
│ Sidebar  │  Main Content Area                          │
│          │                                              │
│ - Nav    │  - Page Header                              │
│   Items  │  - Content Cards                            │
│          │  - Data Tables                              │
│          │  - Forms                                    │
│          │  - Charts                                   │
│          │                                              │
└──────────┴──────────────────────────────────────────────┘
```

#### Mobile Layout
```
┌─────────────────────────────────────┐
│ Header (Hamburger Menu)             │
│ - Menu Icon                         │
│ - Logo                              │
│ - Notifications                     │
└─────────────────────────────────────┘
│                                     │
│  Main Content (Full Width)         │
│                                     │
│  - Stacked Cards                   │
│  - Responsive Tables                │
│  - Mobile-Optimized Forms           │
│                                     │
└─────────────────────────────────────┘
```

### UI Components

#### 1. Cards
- **Standard Card**: White background, border, rounded corners
- **Hero Card**: Larger header card with icon and description
- **KPI Card**: Metric display with icon, value, label, hint
- **Stats Card**: Statistical information display
- **Chart Card**: Chart visualization container

**Card Structure:**
```
┌─────────────────────────────────┐
│ Card Header (Optional)          │
│ - Title                         │
│ - Description                   │
├─────────────────────────────────┤
│ Card Content                    │
│ - Main content area             │
│ - Forms, tables, charts, etc.   │
└─────────────────────────────────┘
```

#### 2. Buttons
- **Primary**: Blue background, white text
- **Secondary**: Outlined, border
- **Destructive**: Red background for delete actions
- **Ghost**: Transparent background
- **Icon Buttons**: Circular with icon only

#### 3. Forms
- **Input Fields**: Text, email, phone, number
- **Textarea**: Multi-line text input
- **Select Dropdown**: Single/multi-select
- **Checkbox**: Boolean selection
- **Radio**: Single choice from options
- **Date Picker**: Date selection
- **File Upload**: Document upload with drag-drop

#### 4. Tables
- **Data Table**: Sortable columns, pagination
- **Responsive Table**: Mobile-friendly stacked layout
- **Action Buttons**: Edit, Delete, View in rows

#### 5. Modals & Sheets
- **Dialog**: Centered modal overlay
- **Sheet**: Slide-in panel (right/left)
- **Confirm Dialog**: Confirmation before destructive actions

#### 6. Navigation
- **Sidebar**: Vertical navigation menu
- **Mobile Menu**: Hamburger menu with slide-out drawer
- **Breadcrumbs**: Page hierarchy (future)
- **Tabs**: Tabbed content organization

#### 7. Badges & Labels
- **Status Badge**: Color-coded status indicators
- **Count Badge**: Number badges for counts
- **Label**: Form field labels

#### 8. Charts & Visualizations
- **Area Chart**: Revenue trends
- **Bar Chart**: Comparative data
- **Aging Chart**: Accounts receivable aging

#### 9. Alerts & Notifications
- **Alert**: Information, warning, error messages
- **Toast**: Temporary notification popup
- **Notification Bell**: Unread count indicator

#### 10. Loading States
- **Skeleton**: Placeholder content while loading
- **Spinner**: Loading spinner
- **Progress Bar**: Progress indication

### Color Scheme (SAP Fiori Horizon)

#### Light Theme
- **Background**: #F5F6F7
- **Foreground**: #32363A
- **Primary**: #0070F2 (Blue)
- **Success**: #107E3E (Green)
- **Warning**: #E9730C (Orange)
- **Destructive**: #BB0000 (Red)
- **Muted**: #6A6D70
- **Border**: #D9D9D9

#### Dark Theme
- **Background**: #1C2834
- **Foreground**: #F5F6F7
- **Primary**: #4DB1FF (Light Blue)
- **Success**: #5DC122 (Light Green)
- **Warning**: #FFB300 (Yellow)
- **Destructive**: #FF5C77 (Pink)
- **Muted**: #A9B4BE
- **Border**: #3A4A58

### Typography
- **Font Family**: Geist Sans (System fallback)
- **Base Font Size**: 14px (0.875rem)
- **Line Height**: 1.5
- **Headings**: 
  - H1: 2xl (1.5rem), font-weight: 600
  - H2: xl (1.25rem), font-weight: 600
  - H3: lg (1.125rem), font-weight: 600
  - H4: base (1rem), font-weight: 600

### Spacing System
- **Gap Sizes**: 3, 4, 5, 6 (responsive: sm:gap-4, md:gap-5)
- **Padding**: p-4, p-6 (responsive variants)
- **Margin**: m-2, m-4, mt-1, mb-4, etc.

### Responsive Breakpoints
- **Mobile**: < 640px (sm)
- **Tablet**: 640px - 1024px (md)
- **Desktop**: > 1024px (lg)

---

## Navigation Structure

### Main Navigation (Sidebar)
1. **Dashboard** (`/dashboard`)
   - Overview of firm metrics
   - KPI cards
   - Revenue charts

2. **Clients** (`/clients`)
   - Client list
   - Client management

3. **Cases** (`/cases`)
   - Case board
   - Matter management

4. **Calendar** (`/calendar`)
   - Hearing timeline
   - Calendar view

5. **Billing** (`/billing`)
   - Invoice management
   - Billing statistics

6. **Messages** (`/messages`)
   - Team messaging
   - Communication

7. **Subscription** (`/subscription`)
   - Plan management
   - Billing information

8. **Contact** (`/contact`)
   - Support contact form

9. **User Manual** (`/user-manual`)
   - Documentation
   - Help guides

10. **Settings** (`/settings`)
    - Profile settings
    - Firm settings
    - Team management

### Mobile Navigation
- Hamburger menu with same items
- Slide-out drawer
- Full-screen overlay on mobile

---

## Feature Descriptions

### Dashboard
**Purpose**: Central hub showing key metrics and quick access

**Components**:
- KPI Cards (4-6 cards in grid)
- Revenue Chart Card
- Trial Banner (if on trial)
- Quick Actions (future)

**Mobile**: Cards stack vertically, full width

### Clients
**Purpose**: Manage client database

**Components**:
- Client List (grid/list toggle)
- Search/Filter bar
- New Client Sheet
- Client Cards with details
- Client Detail Page

**Mobile**: Single column grid, stacked cards

### Cases
**Purpose**: Manage legal matters/cases

**Components**:
- Case Board (Kanban)
- Case Cards
- New Matter Sheet
- Case Detail Page with tabs:
  - Overview
  - Documents
  - Finance
  - Team
  - Timeline

**Mobile**: Horizontal scrollable board, stacked cards

### Calendar
**Purpose**: Manage hearings and appointments

**Components**:
- Hearing Timeline
- Date navigation
- New Hearing Sheet
- Hearing Cards
- Print Docket button

**Mobile**: Vertical timeline, full-width cards

### Billing
**Purpose**: Invoice and payment management

**Components**:
- Invoice Board (filtered by status)
- Billing Stats Cards
- Aging Chart
- New Invoice Sheet
- Invoice Detail View

**Mobile**: Stacked cards, full-width tables

### Messages
**Purpose**: Team communication

**Components**:
- Message List with tabs (All, Sent, Received, Group)
- Message Composer
- Real-time updates
- Read status indicators

**Mobile**: Full-width messages, stacked layout

### Subscription
**Purpose**: Manage subscription and billing

**Components**:
- Subscription Status Card
- Plan Information
- Subscription Management
- Payment History
- Stripe Customer Portal link

**Mobile**: Stacked cards, full-width buttons

### Settings
**Purpose**: Configure profile, firm, and preferences

**Components**:
- Settings Tabs:
  - Profile
  - Firm
  - Notifications
  - Billing
  - Team
- Forms for each section

**Mobile**: Full-width tabs, stacked form fields

---

## UI Components

### Reusable Components
1. **Button** - Various variants and sizes
2. **Card** - Container with header/content
3. **Input** - Text input fields
4. **Textarea** - Multi-line input
5. **Select** - Dropdown selection
6. **Checkbox** - Boolean input
7. **Badge** - Status/label indicator
8. **Alert** - Information display
9. **Toast** - Notification popup
10. **Dialog** - Modal overlay
11. **Sheet** - Slide-in panel
12. **Table** - Data table
13. **Tabs** - Tabbed interface
14. **ScrollArea** - Scrollable container
15. **Separator** - Visual divider
16. **Label** - Form label
17. **Avatar** - User image placeholder
18. **Skeleton** - Loading placeholder
19. **Progress** - Progress indicator
20. **Tooltip** - Hover information
21. **Dropdown Menu** - Context menu

---

## Mobile Responsiveness

### Current Implementation Status
✅ **Responsive**: Most pages use responsive classes
✅ **Mobile Menu**: Hamburger menu implemented
✅ **Flexible Layouts**: Grid layouts adapt to screen size
✅ **Touch-Friendly**: Button sizes appropriate for touch
⚠️ **Some Issues**: Need verification on all pages

### Mobile Optimizations Needed
1. **Table Responsiveness**: Some tables may overflow on mobile
2. **Form Layouts**: Ensure all forms stack properly
3. **Card Sizing**: Verify cards fit screen width
4. **Modal/Sheet Sizing**: Ensure modals fit mobile screens
5. **Touch Targets**: Verify all buttons are 44x44px minimum
6. **Text Sizing**: Ensure text is readable on mobile
7. **Spacing**: Verify adequate spacing on small screens

---

## Theme & Styling

### Current Theme Implementation
✅ **Light Theme**: Fully implemented
✅ **Dark Theme**: CSS variables defined
⚠️ **Theme Toggle**: NOT IMPLEMENTED (needs UI control)

### Theme Variables
- Defined in `app/globals.css`
- Uses CSS custom properties
- SAP Fiori Horizon color palette
- Dark mode class: `.dark`

### Theme Toggle Needed
- Add theme switcher in settings or header
- Persist theme preference
- System preference detection (future)

---

## Missing Features (To Implement)

### 1. Activity Page/Log
- **Status**: ❌ NOT IMPLEMENTED
- **Database**: `audit_logs` table exists
- **UI**: No activity page yet
- **Needed**: Activity log page showing user actions

### 2. Drag-and-Drop Customizable Dashboard
- **Status**: ❌ NOT IMPLEMENTED
- **Needed**: 
  - Widget system
  - Drag-and-drop library (react-grid-layout or similar)
  - Widget customization (size, color, typography)
  - Save dashboard layout per user

### 3. Dark/Light Mode Toggle
- **Status**: ⚠️ PARTIALLY IMPLEMENTED
- **CSS**: Dark theme styles exist
- **UI**: No toggle button
- **Needed**: Theme switcher component

### 4. Gemini API Integration
- **Status**: ❌ NOT FOUND
- **AI Features**: OpenAI integration exists
- **Needed**: Check if Gemini API key integration needed for research

### 5. Widget Customization
- **Status**: ❌ NOT IMPLEMENTED
- **Needed**: 
  - Widget size adjustment
  - Color customization
  - Typography settings
  - Widget visibility toggle

---

## UI Issues to Check

### Screen Fit Issues
1. **Dashboard Cards**: Verify all KPI cards fit on screen
2. **Case Board**: Check horizontal scroll on mobile
3. **Invoice Board**: Verify status columns fit
4. **Message List**: Check message cards fit width
5. **Settings Tabs**: Verify tab content fits screen
6. **Forms**: Check all form fields visible without scrolling
7. **Modals**: Verify modals fit mobile screens
8. **Tables**: Check table overflow handling

### Responsive Issues
1. **Grid Layouts**: Verify breakpoints work correctly
2. **Flexbox**: Check flex wrapping on mobile
3. **Text Overflow**: Verify text truncation works
4. **Image Sizing**: Check image responsiveness
5. **Button Sizing**: Verify buttons are touch-friendly

---

## Next Steps for Analysis

1. ✅ Create feature documentation (THIS DOCUMENT)
2. ⏳ Code analysis end-to-end
3. ⏳ Mobile responsiveness audit
4. ⏳ UI component review
5. ⏳ Screen fit verification
6. ⏳ Theme toggle implementation
7. ⏳ Activity page implementation
8. ⏳ Dashboard customization planning
9. ⏳ Gemini API integration check
10. ⏳ Widget system design

---

**Document Version**: 1.0  
**Last Updated**: 2025-01-27  
**Author**: AI Assistant
