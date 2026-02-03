# Complete UI Documentation - Lawyer Diary
## End-to-End Visual Design System

---

## Table of Contents
1. [Color System](#color-system)
2. [Typography](#typography)
3. [Buttons](#buttons)
4. [Cards](#cards)
5. [Icons](#icons)
6. [Badges & Labels](#badges--labels)
7. [Forms & Inputs](#forms--inputs)
8. [Layout Components](#layout-components)
9. [Page-by-Page UI Breakdown](#page-by-page-ui-breakdown)
10. [Spacing System](#spacing-system)
11. [Responsive Design](#responsive-design)
12. [Animation & Transitions](#animation--transitions)

---

## Color System

> **Mobile-First Principle**: Colors are optimized for small screens with higher contrast ratios and softer saturations to reduce eye strain. All colors meet WCAG AAA standards where possible.

### Light Theme (Morning Horizon)

#### Primary Colors
- **Primary Blue**: `#0070F2` (Desktop) / `#1A91FF` (Mobile - higher contrast, less glare)
  - Usage: Main actions, links, active states, primary buttons
  - Hover: `#0057D2`
  - Active: `#0040B0`
  - Background: `rgba(0, 112, 242, 0.05)` to `rgba(0, 112, 242, 0.1)`
  - **Mobile Optimization**: Softer saturation (`#1A91FF`) reduces glare on small screens
  - **Contrast Ratio**: 4.8:1 on white (AAA for large text, AA for small text)

#### Semantic Colors
- **Success Green**: `#107E3E`
  - Usage: Success messages, completed states, positive metrics
  - Soft Background: `#E8F5E9`
  
- **Warning Orange**: `#E9730C`
  - Usage: Warnings, pending states, attention needed
  - Soft Background: `#FFF4E6`
  
- **Destructive Red**: `#BB0000`
  - Usage: Errors, delete actions, critical alerts
  - Soft Background: `#FFEBEE`

#### Neutral Colors
- **Background**: `#F5F6F7` (Main page background)
- **Foreground**: `#32363A` (Primary text)
- **Card**: `#FFFFFF` (Card backgrounds)
- **Muted**: `#F5F6F7` (Subtle backgrounds)
- **Muted Foreground**: `#6A6D70` (Secondary text)
- **Border**: `#D9D9D9` (Borders, dividers)
- **Input**: `#D9D9D9` (Input borders)
- **Neutral Accent (Mobile)**: `#E0E0E0` (Subtle dividers for mobile to reduce visual clutter)

#### Chart Colors
- Chart 1 (Primary): `#0070F2`
- Chart 2 (Success): `#107E3E`
- Chart 3 (Warning): `#E9730C`
- Chart 4 (Destructive): `#BB0000`
- Chart 5 (Info): `#5C67E5`
- **Color-Blind Support**: Charts include patterns, labels, and icons in addition to colors. Use CSS filters for color-blind modes when needed.

#### Sidebar Colors
- Background: `#FFFFFF`
- Foreground: `#32363A`
- Primary: `#0070F2`
- Border: `#D9D9D9`

---

### Dark Theme (Evening Horizon)

#### Primary Colors
- **Primary Blue**: `#4DB1FF`
  - Usage: Main actions, links, active states
  - Foreground: `#1C2834`

#### Semantic Colors
- **Success Green**: `#5DC122`
  - Foreground: `#1C2834`
  
- **Warning Orange**: `#FFB300`
  - Foreground: `#1C2834`
  
- **Destructive Red**: `#FF5C77`
  - Foreground: `#1C2834`

#### Neutral Colors
- **Background**: `#1C2834` (Main page background)
- **Foreground**: `#F5F6F7` (Primary text)
- **Card**: `#2A3A48` (Card backgrounds)
- **Muted**: `#2A3A48` (Subtle backgrounds)
- **Muted Foreground**: `#A9B4BE` (Secondary text)
- **Border**: `#3A4A58` (Borders, dividers)
- **Input**: `#3A4A58` (Input borders)

#### Chart Colors (Dark)
- Chart 1: `#4DB1FF`
- Chart 2: `#5DC122`
- Chart 3: `#FFB300`
- Chart 4: `#FF5C77`
- Chart 5: `#7B8FFF`

#### Sidebar Colors (Dark)
- Background: `#1C2834`
- Foreground: `#F5F6F7`
- Primary: `#4DB1FF`
- Border: `#3A4A58`

---

## Typography

> **Mobile-First Principle**: Typography starts at 16px base on mobile to prevent iOS zoom, then scales down for desktop density. Line heights are increased for thumb-scrolling readability.

### Font Family
- **Primary**: Geist Sans (Variable)
- **Mono**: Geist Mono (Variable)
- **Fallback**: System fonts (`-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`)
- **Dynamic Type Support**: Uses `rem` units tied to user font size preferences via `prefers-reduced-motion` and accessibility settings

### Font Sizes

#### Headings
- **H1**: 
  - Mobile: `1.75rem` (28px) - `text-3xl`, Line Height: 1.3
  - Desktop: `1.5rem` (24px) - `text-2xl`, Line Height: 1.25
  - Font Weight: 600 (semibold)
  - Usage: Page titles, hero sections
  - **Mobile-First**: Larger on mobile for better hierarchy, shorter text with ellipsis for truncation

- **H2**: 
  - Mobile: `1.5rem` (24px) - `text-2xl`, Line Height: 1.3
  - Desktop: `1.25rem` (20px) - `text-xl`, Line Height: 1.25
  - Font Weight: 600 (semibold)
  - Usage: Section titles, card headers

- **H3**: 
  - Mobile: `1.25rem` (20px) - `text-xl`, Line Height: 1.4
  - Desktop: `1.125rem` (18px) - `text-lg`, Line Height: 1.375
  - Font Weight: 600 (semibold)
  - Usage: Subsection titles

- **H4**: 
  - Mobile: `1.125rem` (18px) - `text-lg`, Line Height: 1.4
  - Desktop: `1rem` (16px) - `text-base`, Line Height: 1.375
  - Font Weight: 600 (semibold)
  - Usage: Card titles, form labels

#### Body Text
- **Base**: 
  - Mobile: `1rem` (16px) - Prevents iOS zoom, better readability
  - Desktop: `0.875rem` (14px) - SAP Fiori standard for density
  - Line Height: 1.6 (mobile) / 1.5 (desktop) - Increased for thumb-scrolling
  - Usage: Default body text, descriptions

- **Small**: `0.75rem` (12px) - `text-xs`
  - Line Height: 1.5
  - Usage: Hints, captions, metadata
  - **Minimum**: 12px is the absolute minimum for readability

- **Extra Small**: `0.625rem` (10px) - `text-[10px]`
  - Usage: Labels, badges, fine print
  - **Note**: Avoid for body text; use only for decorative elements

#### Responsive Typography
- **Mobile-First**: Base font size 16px (prevents iOS zoom, better touch targets)
- **Desktop**: Base font size 14px (allows more content density)
- **Readable Mode**: Optional accessibility mode that increases all sizes by 10-20%
- **Dynamic Type**: Respects user font size preferences via `rem` units and media queries

---

## Buttons

### Button Variants

#### 1. Default (Primary)
**Style**: Gradient blue background with glow effect
- **Background**: `linear-gradient(to right, #0070F2, rgba(0, 112, 242, 0.9))`
- **Text**: White (`#FFFFFF`)
- **Hover**: Darker gradient + shadow glow
  - Gradient: `#0057D2` to `#0040B0`
  - Shadow: `0 4px 12px rgba(0,112,242,0.3), 0 0 20px rgba(0,112,242,0.2)`
- **Active**: `scale(0.98)` + darker gradient
- **Border Radius**: `0.5rem` (8px)
- **Usage**: Primary actions, CTAs, form submissions

#### 2. Destructive
**Style**: Red background
- **Background**: `#BB0000` (Light) / `#FF5C77` (Dark)
- **Text**: White
- **Hover**: `rgba(187, 0, 0, 0.9)`
- **Usage**: Delete actions, dangerous operations

#### 3. Success
**Style**: Green background
- **Background**: `#107E3E` (Light) / `#5DC122` (Dark)
- **Text**: White / Dark background
- **Hover**: `rgba(16, 126, 62, 0.9)`
- **Usage**: Confirm actions, success states

#### 4. Warning
**Style**: Orange background
- **Background**: `#E9730C` (Light) / `#FFB300` (Dark)
- **Text**: White / Dark background
- **Hover**: `rgba(233, 115, 12, 0.9)`
- **Usage**: Warning actions, attention needed

#### 5. Outline
**Style**: Transparent with border
- **Background**: Transparent
- **Border**: `1px solid #D9D9D9` (Light) / `#3A4A58` (Dark)
- **Text**: Foreground color
- **Hover**: Muted background + primary border
  - Background: `#F5F6F7` (Light) / `#2A3A48` (Dark)
  - Border: `rgba(0, 112, 242, 0.3)`
- **Usage**: Secondary actions, cancel buttons

#### 6. Secondary
**Style**: Light blue background
- **Background**: `#E8F4F8` (Light) / `#2A3A48` (Dark)
- **Text**: `#0070F2` (Light) / `#F5F6F7` (Dark)
- **Hover**: `#D1E9F4`
- **Usage**: Secondary actions, alternative CTAs

#### 7. Ghost
**Style**: Transparent, no border
- **Background**: Transparent
- **Text**: Muted foreground
- **Hover**: Muted background
  - Background: `#F5F6F7` (Light) / `#2A3A48` (Dark)
- **Usage**: Tertiary actions, icon buttons

#### 8. Link
**Style**: Text link
- **Text**: Primary blue (`#0070F2`)
- **Decoration**: Underline on hover
- **Usage**: Inline links, navigation

### Button Sizes

> **Mobile-First**: Touch targets are standardized at 48x48px minimum for better usability and fat-finger error prevention.

#### Default
- **Height**: `48px` (mobile - standard touch target) / `40px` (desktop)
- **Padding**: `0.75rem 1rem` (mobile) / `0.5rem 1rem` (desktop)
- **Font Size**: `16px` (mobile) / `14px` (desktop)
- **Min Width**: `48px` (touch target - up from 44px)

#### Small (`sm`)
- **Height**: `48px` (mobile) / `36px` (desktop)
- **Padding**: `0.625rem 0.875rem`
- **Font Size**: `16px` (mobile) / `14px` (desktop)
- **Gap**: `0.375rem` (6px)
- **Note**: Even "small" buttons maintain 48px height on mobile

#### Large (`lg`)
- **Height**: `56px` (mobile) / `48px` (desktop)
- **Padding**: `0.875rem 1.5rem`
- **Font Size**: `18px` (mobile) / `16px` (desktop)
- **Usage**: Primary CTAs, important actions

#### Icon Sizes
- **Icon**: `48x48px` (mobile) / `40x40px` (desktop)
- **Icon Small**: `48x48px` (mobile) / `36x36px` (desktop)
- **Icon Large**: `56x56px` (mobile) / `48x48px` (desktop)
- **Icon Minimum**: 24px on mobile (up from 16px for better visibility)

#### Floating Action Button (FAB)
- **New Variant**: Circular, floating button for primary actions
- **Size**: `56x56px` (mobile) / `48x48px` (desktop)
- **Position**: Bottom-right corner, fixed
- **Shadow**: Elevated shadow for depth
- **Usage**: "New Case", "New Client" - always accessible
- **Mobile-First**: Positioned at bottom for thumb reach

### Button States
- **Default**: Normal appearance
- **Hover** (Desktop): Lighter/darker shade + shadow + slight lift (`translateY(-2px)`)
- **Tap** (Mobile): Ripple effect (CSS radial gradient) + background color transition
  - Replaces hover transforms with immediate visual feedback
  - Uses `:active` pseudo-class for touch feedback
  - Brief scale animation (1.05) for tactile response
- **Active**: `scale(0.98)` + darker shade
- **Disabled**: `opacity: 0.5` + `pointer-events: none`
- **Loading**: Progress bar for longer operations (over 2s), spinner for quick actions
- **Mobile-First**: No hover states on touch devices; all feedback is immediate tap response

---

## Cards

### Card Types

#### 1. Standard Card (`.sap-card`)
**Structure**:
```
┌─────────────────────────────────────┐
│ Border: rgba(0,0,0,0.05)           │
│ Background: rgba(255,255,255,0.8)  │
│ Backdrop Blur: xl                   │
│ Border Radius: 0.75rem (12px)      │
│ Shadow: Multi-layer                 │
│                                     │
│ [Card Header]                       │
│ - Title                             │
│ - Description                       │
│                                     │
│ [Card Content]                      │
│ - Main content                      │
└─────────────────────────────────────┘
```

**Styles**:
- **Border**: `1px solid rgba(217, 217, 217, 0.6)`
- **Background**: `rgba(255, 255, 255, 0.8)` with backdrop blur
- **Shadow**: 
  - `0 0 0 1px rgba(0,0,0,0.05)`
  - `0 1px 2px rgba(0,0,0,0.1)`
  - `0 4px 12px rgba(0,0,0,0.05)`
- **Hover**: 
  - Border: `rgba(0, 112, 242, 0.3)`
  - Shadow: Enhanced with primary glow
  - Transform: `translateY(-1px)`

#### 2. Hero Card (`.sap-card-hero`)
**Style**: Primary gradient background
- **Background**: 
  - Mobile: Solid tint `rgba(0, 112, 242, 0.08)` (faster load, less battery drain)
  - Desktop: `linear-gradient(to bottom right, rgba(0,112,242,0.1), rgba(0,112,242,0.05), transparent)`
- **Border**: `rgba(0, 112, 242, 0.3)`
- **Shadow**: Primary-colored shadow
- **Usage**: Welcome banners, important announcements
- **Mobile-First**: Simplified background for performance

#### 3. Primary Card (`.sap-card-primary`)
**Style**: Blue-tinted card
- **Border**: `rgba(0, 112, 242, 0.2)`
- **Background**: `linear-gradient(to bottom right, rgba(0,112,242,0.05), rgba(0,112,242,0.03), transparent)`
- **Shadow**: Blue-tinted shadow
- **Usage**: Important content, highlighted sections

#### 4. Success Card (`.sap-card-success`)
**Style**: Green-tinted card
- **Border**: `rgba(16, 126, 62, 0.2)`
- **Background**: `linear-gradient(to bottom right, rgba(16,126,62,0.05), rgba(16,126,62,0.03), transparent)`
- **Usage**: Success messages, completed states

#### 5. Warning Card (`.sap-card-warning`)
**Style**: Orange-tinted card
- **Border**: `rgba(233, 115, 12, 0.2)`
- **Background**: `linear-gradient(to bottom right, rgba(233,115,12,0.05), rgba(233,115,12,0.03), transparent)`
- **Usage**: Warnings, pending items

#### 6. Info Card (`.sap-card-info`)
**Style**: Purple-tinted card
- **Border**: `rgba(92, 103, 229, 0.2)`
- **Background**: `linear-gradient(to bottom right, rgba(92,103,229,0.05), rgba(92,103,229,0.03), transparent)`
- **Usage**: Informational content

#### 7. Tile (`.sap-tile`)
**Style**: Compact card for lists
- **Padding**: `1rem` (mobile) / `1.25rem` (desktop)
- **Hover** (Desktop): Enhanced shadow + `translateY(-2px) scale(1.01)`
- **Tap** (Mobile): `scale(1.02)` briefly + background color shift
- **Usage**: List items, case cards, client cards
- **Mobile-First**: Full-width, edge-to-edge on mobile with minimal side padding

#### 8. KPI Tile (`.sap-kpi-tile`)
**Style**: Metric display card
- **Variants**:
  - `.sap-kpi-tile-primary` - Blue gradient
  - `.sap-kpi-tile-success` - Green gradient
  - `.sap-kpi-tile-warning` - Orange gradient
  - `.sap-kpi-tile-info` - Purple gradient
- **Structure**:
  ```
  ┌─────────────────┐
  │ Label (uppercase)│
  │ Value (large)    │
  │ Hint (small)     │
  └─────────────────┘
  ```
- **Hover**: `translateY(-2px)` + enhanced shadow

#### 9. Module Card (`.sap-module-card`)
**Style**: Feature card
- **Padding**: `1.25rem` (mobile) / `1.5rem` (desktop)
- **Hover**: `translateY(-2px) scale(1.01)`
- **Usage**: Feature showcases, module descriptions

#### 10. Subtle Card (`.sap-subtle`)
**Style**: Empty state card
- **Border**: Dashed
- **Background**: Muted with 50% opacity
- **Usage**: Empty states, placeholders

#### 11. Expandable Card (`.sap-card-expandable`)
**Style**: Accordion-style card for mobile
- **Mobile-First**: Tap to expand/collapse content
- **Indicator**: Chevron icon rotates on expand
- **Animation**: Smooth height transition (respects `prefers-reduced-motion`)
- **Usage**: Case details, timelines, dense content on mobile
- **Desktop**: Always expanded

### Card Components

#### CardHeader
- **Layout**: Flex column (mobile) / Flex row (desktop)
- **Gap**: `0.5rem` (mobile) / `0.75rem` (desktop)
- **Alignment**: Space between on desktop

#### CardTitle
- **Font**: Semibold
- **Size**: Inherits from parent heading

#### CardDescription
- **Color**: Muted foreground
- **Size**: `text-sm`

#### CardContent
- **Padding**: `1.5rem` (horizontal)

#### CardFooter
- **Padding**: `1.5rem` (horizontal)
- **Border**: Top border if present

---

## Icons

### Icon Library
**Source**: Lucide React (`lucide-react`)
**Default Size**: 
- Mobile: `20px` (h-5 w-5) - Minimum for touch visibility
- Desktop: `16px` (h-4 w-4)
**Variants**: 
- Small: `16px` (mobile) / `12px` (desktop) - `h-4 w-4` / `h-3 w-3`
- Default: `20px` (mobile) / `16px` (desktop) - `h-5 w-5` / `h-4 w-4`
- Medium: `24px` (mobile) / `20px` (desktop) - `h-6 w-6` / `h-5 w-5`
- Large: `32px` (mobile) / `24px` (desktop) - `h-8 w-8` / `h-6 w-6`
- Extra Large: `40px` (mobile) / `32px` (desktop) - `h-10 w-10` / `h-8 w-8`
**Optimization**: SVGs are optimized (removed unused paths) to reduce file size
**Accessibility**: All icons have `aria-label` attributes for screen readers
**High-Contrast Mode**: Icons adapt to system high-contrast settings

### Navigation Icons
- **LayoutDashboard** - Dashboard page
- **Briefcase** - Cases/Matters
- **CalendarDays** - Calendar
- **Banknote** - Billing, Subscription
- **Users** - Clients, Team
- **MessageSquare** - Messages
- **MessageCircle** - Contact
- **Activity** - Activity log
- **BookOpen** - User Manual
- **Settings** - Settings

### Action Icons
- **Plus** - Add/Create
- **Pencil/Edit** - Edit
- **Trash2** - Delete
- **Download** - Export/Download
- **Upload** - Upload
- **Search** - Search
- **Filter** - Filter
- **X** - Close/Cancel
- **Check** - Confirm
- **CheckCheck** - Read/Confirmed
- **Send** - Send message
- **Inbox** - Received messages
- **Eye** - View/Visible
- **EyeOff** - Hide/Invisible
- **GripVertical** - Drag handle
- **Settings2** - Customize/Settings
- **Sun** - Light mode
- **Moon** - Dark mode

### Status Icons
- **CheckCircle2** - Success/Complete
- **AlertTriangle** - Warning/Alert
- **XCircle** - Error
- **Info** - Information
- **Clock** - Time/Pending
- **Loader2** - Loading (spinning)

### Document Icons
- **FileText** - Document
- **File** - File
- **Image** - Image
- **Camera** - Camera/Photo
- **Paperclip** - Attachment

### Finance Icons
- **TrendingUp** - Growth/Revenue
- **DollarSign** - Money/Currency
- **Receipt** - Invoice
- **CreditCard** - Payment

### Communication Icons
- **Mail** - Email
- **Phone** - Phone
- **MessageSquare** - Message
- **Bell** - Notification
- **BellRing** - Notification (active)

### Location Icons
- **MapPin** - Location/Address
- **Building2** - Organization/Building

### User Icons
- **User** - User profile
- **UserCircle** - User avatar
- **Users** - Team/Group

### Form Icons
- **ChevronDown** - Dropdown
- **ChevronUp** - Dropdown (open)
- **ChevronLeft** - Previous/Back
- **ChevronRight** - Next/Forward

### Customization Icons
- **Palette** - Colors
- **Type** - Typography
- **Maximize2** - Large size
- **Minimize2** - Small size

### Icon Colors
- **Default**: Current text color (foreground)
- **Primary**: `#0070F2` (Light) / `#4DB1FF` (Dark)
- **Muted**: `#6A6D70` (Light) / `#A9B4BE` (Dark)
- **Success**: `#107E3E` (Light) / `#5DC122` (Dark)
- **Warning**: `#E9730C` (Light) / `#FFB300` (Dark)
- **Destructive**: `#BB0000` (Light) / `#FF5C77` (Dark)

---

## Badges & Labels

### Badge Variants

#### 1. Default
- **Background**: Primary blue
- **Text**: White
- **Border**: Transparent
- **Usage**: Primary status, important labels

#### 2. Secondary
- **Background**: Secondary color
- **Text**: Secondary foreground
- **Usage**: Secondary status

#### 3. Destructive
- **Background**: Red
- **Text**: White
- **Usage**: Errors, critical status

#### 4. Success
- **Background**: Green
- **Text**: White / Dark
- **Usage**: Success, completed

#### 5. Warning
- **Background**: Orange
- **Text**: White / Dark
- **Usage**: Warnings, pending

#### 6. Outline
- **Background**: Transparent
- **Border**: Border color
- **Text**: Foreground
- **Usage**: Subtle labels, tags

### Badge Sizes
- **Default**: `px-2.5 py-0.5 text-xs` (12px - minimum readable size)
- **Small**: `px-2 py-0.5 text-xs` (12px - avoid 10px for readability)
- **Large**: `px-3 py-1 text-sm` (14px)
- **Mobile-First**: Minimum text size is 12px; smaller badges use 12px text with reduced padding
- **Touch Feedback**: Vibration feedback on tap for status changes (where supported)

### Badge Styles
- **Shape**: Rounded full (pill shape)
- **Font**: Medium weight
- **Border Radius**: `9999px` (fully rounded)

---

## Forms & Inputs

### Input Types

#### Text Input
- **Height**: `48px` (mobile - up from 44px) / `40px` (desktop)
- **Padding**: `0.875rem 1rem` (mobile) / `0.625rem 0.875rem` (desktop)
- **Font Size**: `16px` (mobile - prevents iOS zoom) / `14px` (desktop)
- **Border**: `1px solid #D9D9D9`
- **Border Radius**: `0.5rem` (8px)
- **Background**: 
  - Mobile: `rgba(255, 255, 255, 0.95)` (solid, no blur)
  - Desktop: `rgba(255, 255, 255, 0.5)` with backdrop blur
- **Focus**: 
  - Border: `rgba(0, 112, 242, 0.6)`
  - Ring: `rgba(0, 112, 242, 0.2)` with 2px width
  - Shadow: Multi-layer glow effect
- **Mobile-Specific**:
  - Input masks for dates, phone numbers
  - Appropriate keyboard types (`tel`, `email`, `numeric`)
  - Auto-capitalization where appropriate
  - Haptic feedback on focus (where supported)

#### Textarea
- **Min Height**: `100px`
- **Resize**: Vertical only (or none)
- **Same styling as text input**

#### Select Dropdown
- **Same height/padding as text input**
- **Chevron icon**: Right side, `h-4 w-4`, 50% opacity
- **Options**: 
  - Hover: `bg-primary/10`
  - Selected: Check icon on left

#### Checkbox
- **Size**: `16px x 16px`
- **Border Radius**: `4px`
- **Checked**: Primary blue background + white check
- **Focus**: Ring with primary color

#### Radio
- **Size**: `16px x 16px`
- **Shape**: Circle
- **Checked**: Primary blue fill

#### Date Picker
- **Same as text input**
- **Calendar icon**: Optional

#### File Upload
- **Border**: Dashed
- **Background**: Muted
- **Hover**: Primary border
- **Drag & Drop**: Highlighted state

### Form Layout

#### Form Container (`.sap-form`)
- **Gap**: `0.75rem` (mobile) / `1rem` (desktop) / `1.25rem` (large)

#### Form Grid (`.sap-form-grid`)
- **Columns**: 1 (mobile) / 2 (desktop)
- **Gap**: `0.75rem` (mobile) / `1rem` (desktop) / `1.25rem` (large)

#### Form Labels
- **Font**: Medium weight
- **Size**: `text-sm`
- **Color**: Foreground
- **Margin**: `mb-2`

#### Form Errors
- **Color**: Destructive red
- **Size**: `text-sm`
- **Position**: Below input

---

## Layout Components

### App Shell

#### Header (`.sap-shell-bar`)
- **Position**: Sticky top
- **Z-Index**: 40
- **Background**: 
  - Mobile: `rgba(255, 255, 255, 0.95)` (solid, no blur)
  - Desktop: `rgba(255, 255, 255, 0.8)` with backdrop blur
- **Border**: Bottom border
- **Shadow**: Subtle shadow
- **Height**: Auto (responsive)

#### Navigation
- **Mobile**: Bottom tab bar (Dashboard, Cases, Calendar, Billing, More)
  - Fixed bottom position
  - Icons + labels for clarity
  - Active state indicator
  - Overflow menu for additional items
  - Height: `64px` (standard mobile nav)
  - Background: Solid white/dark with subtle shadow
- **Desktop**: Left sidebar
  - Width: `4.5rem` (collapsed) / `16rem` (expanded on hover)
  - Background: White (Light) / `#1C2834` (Dark)
  - Border: Right border
  - Transition: Smooth width transition
  - Position: Fixed left

#### Main Content
- **Padding**: 
  - Mobile: `1rem` (edge-to-edge with minimal padding)
  - Desktop: `1rem` / `1.25rem` (large)
- **Max Width**: 
  - Mobile: `100%` (fluid, edge-to-edge)
  - Desktop: `1280px` (7xl)
- **Margin**: 
  - Mobile: `0` (full width)
  - Desktop: Auto (centered)

### Container (`.sap-container`)
- **Max Width**: `1280px`
- **Padding**: 
  - Mobile: `0.75rem` (12px)
  - Tablet: `1rem` (16px)
  - Desktop: `1.25rem` (20px)
  - Large: `2rem` (32px)

### Grid Layouts

#### KPI Grid (`.sap-kpi-grid`)
- **Columns**: 1 (mobile) / 2 (tablet) / 4 (desktop)
- **Gap**: `1rem` (16px)

#### Module Grid (`.sap-module-grid`)
- **Columns**: 1 (mobile) / 2 (desktop)
- **Gap**: `1rem` (16px)

#### Section Grid (`.sap-section-grid`)
- **Columns**: 1 (mobile) / 2 (desktop) with 1.3:1 ratio
- **Gap**: `1.5rem` (24px)

---

## Page-by-Page UI Breakdown

### 1. Dashboard (`/dashboard`)

#### Layout Structure
**Mobile-First**:
```
┌─────────────────────────────────────────┐
│ Trial Banner (if on trial)             │
├─────────────────────────────────────────┤
│ Welcome Card (Hero)                     │
│ - Title: "Welcome back, {name}"        │
│ - Description                          │
│ - Actions: "New case", "Schedule"      │
├─────────────────────────────────────────┤
│ KPI Cards (3-4 key metrics, stacked)   │
│ - Single column, full width            │
│ - Tap to navigate                      │
├─────────────────────────────────────────┤
│ Agenda Widget (Collapsible)             │
│ - Today's hearings                      │
│ - Tap to expand for details             │
├─────────────────────────────────────────┤
│ [FAB: New Case - Bottom Right]         │
└─────────────────────────────────────────┘
```

**Desktop**:
```
┌─────────────────────────────────────────┐
│ Trial Banner (if on trial)             │
├─────────────────────────────────────────┤
│ Welcome Card (Hero)                     │
│ - Title: "Welcome back, {name}"        │
│ - Description                          │
│ - Actions: "New case", "Schedule"      │
├─────────────────────────────────────────┤
│ Customizable Dashboard Widgets         │
│ - KPI Cards (6 cards in grid)          │
│ - Agenda Widget                        │
│ - [Custom widgets]                     │
└─────────────────────────────────────────┘
```

#### Components
- **TrialBanner**: Alert component with status
- **Welcome Card**: Hero card with solid tint (mobile) / gradient (desktop)
- **DashboardKpiCards**: 
  - Mobile: 3-4 key metrics, single column, full width
  - Desktop: 6 cards in responsive grid
  - Colors: Primary, Success, Warning, Info (rotating)
  - Clickable: Navigate to billing
- **Agenda Widget**: 
  - Mobile: Collapsible/expandable card
  - Desktop: Always expanded
  - Today's hearings list
- **Customization Panel**: 
  - Mobile: Sheet overlay
  - Desktop: Side panel
- **FAB (Mobile)**: Floating action button for "New Case" at bottom-right

#### Colors Used
- Primary blue for welcome card
- Rotating colors for KPI tiles
- Muted for empty states

#### Icons Used
- LayoutDashboard, Briefcase, CalendarDays, Banknote, Users, Plus (FAB)

---

### 2. Clients (`/clients`)

#### Layout Structure
```
┌─────────────────────────────────────────┐
│ Hero Header                            │
│ - Title: "Clients"                     │
│ - Description                          │
│ - Action: "New Client" button          │
├─────────────────────────────────────────┤
│ Client List Card                       │
│ - Search/Filter (optional)             │
│ - Client Tiles (grid/list)             │
│   - Name, Type badge                   │
│   - Email, Phone, City                 │
│   - Actions: View, Delete              │
└─────────────────────────────────────────┘
```

#### Components
- **ClientManager**: Main container
- **ClientList**: List of client tiles
- **NewClientSheet**: Slide-in form
- **ClientTile**: Individual client card
  - Badge for type (Individual/Organization)
  - Contact information
  - Action buttons

#### Colors Used
- Outline badges for client types
- Primary for action buttons
- Destructive for delete

#### Icons Used
- Users, Plus, Trash2, Eye, Building2, Mail, Phone, MapPin

---

### 3. Cases (`/cases`)

#### Layout Structure
```
┌─────────────────────────────────────────┐
│ Hero Header                            │
│ - Title: "Matters"                     │
│ - Action: "New Matter" button          │
├─────────────────────────────────────────┤
│ Case Board Card                        │
│ - Search input                         │
│ - Status filter dropdown               │
│ - Case Tiles (list)                    │
│   - Serial number                      │
│   - Client name                        │
│   - Status badge (colored)             │
│   - Case details (type, court, etc.)   │
│   - Actions: Open, Delete              │
└─────────────────────────────────────────┘
```

#### Components
- **CaseBoard**: Main container
- **CaseTile**: Individual case card
  - Status badges with color coding:
    - Execution/Review: Green
    - Pending/Fresh Diary: Orange
    - Appeal: Red
    - Others: Gray
- **NewMatterSheet**: Slide-in form
- **DeleteMatterButton**: Confirmation dialog

#### Colors Used
- Status-based badge colors
- Primary for links
- Destructive for delete

#### Icons Used
- Briefcase, Plus, Trash2, Search, Filter, ChevronDown

---

### 4. Case Detail (`/cases/[id]`)

#### Layout Structure
```
┌─────────────────────────────────────────┐
│ Hero Header                            │
│ - Case info (serial, client, court)    │
│ - Status badge                        │
│ - Actions: Edit, Delete                │
├─────────────────────────────────────────┤
│ Main Content Grid (2 columns)          │
│ ┌──────────────┬──────────────────┐   │
│ │ Timeline     │ Finance Card     │   │
│ │ Documents    │ Team Card        │   │
│ └──────────────┴──────────────────┘   │
└─────────────────────────────────────────┘
```

#### Components
- **MatterTimeline**: History entries
- **MatterDocumentsCard**: Document list with upload
- **MatterFinanceCard**: Fees and payments
- **MatterTeamCard**: Assigned attorneys
- **Summary Cards**: Key metrics

#### Colors Used
- Primary for actions
- Success for payments
- Warning for pending

#### Icons Used
- Briefcase, FileText, Users, DollarSign, Calendar, Edit, Trash2, Upload, Camera

---

### 5. Calendar (`/calendar`)

#### Layout Structure
```
┌─────────────────────────────────────────┐
│ Hero Header                            │
│ - Title: "Calendar"                    │
│ - Action: "New Hearing" button         │
├─────────────────────────────────────────┤
│ Hearing Timeline Card                  │
│ - Date navigation                      │
│ - Hearing list (timeline)              │
│   - Date/Time                          │
│   - Matter info                        │
│   - Location                           │
│   - Status badge                       │
│   - Actions: Edit, Delete              │
└─────────────────────────────────────────┘
```

#### Components
- **HearingTimeline**: Vertical timeline
- **HearingCard**: Individual hearing
- **NewHearingSheet**: Slide-in form
- **HearingEditDialog**: Edit modal

#### Colors Used
- Warning for upcoming
- Success for completed
- Destructive for cancelled

#### Icons Used
- CalendarDays, Plus, Clock, MapPin, Edit, Trash2, Printer

---

### 6. Billing (`/billing`)

#### Layout Structure
```
┌─────────────────────────────────────────┐
│ Hero Header                            │
│ - Title: "Billing"                     │
│ - Action: "New Invoice" button         │
├─────────────────────────────────────────┤
│ Billing Stats Cards (4 cards)          │
│ - Outstanding                          │
│ - Collected                            │
│ - Overdue                              │
│ - Due Soon                             │
├─────────────────────────────────────────┤
│ Aging Chart Card                       │
│ - Bar chart visualization              │
├─────────────────────────────────────────┤
│ Invoice Board Card                     │
│ - Tabs: Outstanding, Paid, Drafts, Void│
│ - Search input                         │
│ - Status filter                        │
│ - Invoice Cards                        │
│   - Invoice number                     │
│   - Client name                        │
│   - Amount, Status                     │
│   - Actions: Mark paid, Void, Delete,  │
│     Export PDF                         │
└─────────────────────────────────────────┘
```

#### Components
- **BillingStatsCards**: 4 clickable stat cards
- **AgingChartCard**: Chart visualization
- **InvoiceBoard**: Tabbed invoice list
- **InvoiceCard**: Individual invoice
- **NewInvoiceSheet**: Slide-in form

#### Colors Used
- Success for paid
- Destructive for overdue
- Warning for sent
- Muted for draft

#### Icons Used
- Banknote, Plus, TrendingUp, Download, Check, XCircle, Trash2, Receipt

---

### 7. Messages (`/messages`)

#### Layout Structure
```
┌─────────────────────────────────────────┐
│ Hero Header                            │
│ - Title: "Team Messages"               │
├─────────────────────────────────────────┤
│ Grid Layout (2 columns)                 │
│ ┌──────────────┬──────────────────┐   │
│ │ Messages     │ Send Message     │   │
│ │ - Tabs: All, │ - Group checkbox │   │
│ │   Sent,      │ - Recipient      │   │
│ │   Received,  │   select         │   │
│ │   Group      │ - Message text   │   │
│ │ - Message    │ - Send button    │   │
│ │   list with  │                   │   │
│ │   read status│                   │   │
│ └──────────────┴──────────────────┘   │
└─────────────────────────────────────────┘
```

#### Components
- **MessagesList**: Tabbed message list
- **MessageCard**: Individual message
  - Sent: Right-aligned, primary background
  - Received: Left-aligned, muted background
  - Group: Special icon
- **MessageComposer**: Send form
- **Tabs**: All, Sent, Received, Group

#### Colors Used
- Primary for sent messages
- Muted for received
- Primary border for unread

#### Icons Used
- MessageSquare, Send, Inbox, Users, Check, CheckCheck, Eye, EyeOff

---

### 8. Activity (`/activity`)

#### Layout Structure
```
┌─────────────────────────────────────────┐
│ Hero Header                            │
│ - Title: "Activity Log"                │
├─────────────────────────────────────────┤
│ Activity Card                           │
│ - Filters: Action, Entity Type         │
│ - Activity Table                       │
│   - Time (date, time, relative)        │
│   - User (with icon)                   │
│   - Action (badge with icon)           │
│   - Entity Type (with icon)            │
│   - Details (JSON preview)            │
└─────────────────────────────────────────┘
```

#### Components
- **ActivityFilters**: Filter dropdowns
- **ActivityTable**: Data table
- **ActionBadges**: Color-coded by action type

#### Colors Used
- Success for created
- Destructive for deleted
- Primary for updated

#### Icons Used
- Activity, User, FileText, Briefcase, Banknote, Users, Settings, Filter, X

---

### 9. Subscription (`/subscription`)

#### Layout Structure
```
┌─────────────────────────────────────────┐
│ Hero Header                            │
│ - Title: "Subscription"                │
├─────────────────────────────────────────┤
│ Trial Banner (if applicable)           │
├─────────────────────────────────────────┤
│ Grid (2 columns)                        │
│ ┌──────────────┬──────────────────┐   │
│ │ Status Card  │ Management Card  │   │
│ │ - Plan name  │ - Upgrade       │   │
│ │ - Status     │ - Cancel        │   │
│ │ - Dates      │ - Portal link   │   │
│ └──────────────┴──────────────────┘   │
├─────────────────────────────────────────┤
│ Grid (2 columns)                        │
│ ┌──────────────┬──────────────────┐   │
│ │ History Card │ Guide Card       │   │
│ └──────────────┴──────────────────┘   │
└─────────────────────────────────────────┘
```

#### Components
- **SubscriptionStatus**: Current plan info
- **SubscriptionManagement**: Action buttons
- **SubscriptionHistory**: Payment history
- **SubscriptionGuide**: Help information

#### Colors Used
- Success for active
- Warning for trial
- Destructive for cancelled

#### Icons Used
- Banknote, CheckCircle2, AlertTriangle, ExternalLink, CreditCard

---

### 10. Settings (`/settings`)

#### Layout Structure
```
┌─────────────────────────────────────────┐
│ Hero Header                            │
│ - Title: "Workspace Settings"          │
│ - Icon: Settings                       │
├─────────────────────────────────────────┤
│ Settings Tabs                          │
│ - Profile                              │
│ - Firm                                │
│ - Notifications                       │
│ - Billing                             │
│ - Team                                │
│                                       │
│ [Tab Content]                         │
│ - Forms with inputs                   │
│ - Save buttons                        │
└─────────────────────────────────────────┘
```

#### Components
- **SettingsTabs**: Tab navigation
- **ProfileSettingsForm**: User profile
- **FirmSettingsCard**: Firm information
- **NotificationSettingsForm**: Preferences
- **BillingSettingsForm**: Invoice settings
- **TeamManagement**: Team members list
- **InviteManager**: Invitation management

#### Colors Used
- Primary for save buttons
- Muted for disabled

#### Icons Used
- Settings, User, Building2, Bell, Banknote, Users, Mail, Plus, Trash2, Edit

---

### 11. Contact (`/contact`)

#### Layout Structure
```
┌─────────────────────────────────────────┐
│ Hero Header                            │
│ - Title: "Contact Us"                  │
├─────────────────────────────────────────┤
│ Contact Form Card                      │
│ - Name input                           │
│ - Email input                          │
│ - Subject input                        │
│ - Message textarea                     │
│ - Submit button                        │
└─────────────────────────────────────────┘
```

#### Components
- **ContactForm**: Simple form
- **Input fields**: Text, email, textarea
- **Submit button**: Primary variant

#### Colors Used
- Primary for submit
- Muted for labels

#### Icons Used
- MessageCircle, Send, Mail, User

---

### 12. User Manual (`/user-manual`)

#### Layout Structure
```
┌─────────────────────────────────────────┐
│ Hero Header                            │
│ - Title: "User Manual"                 │
├─────────────────────────────────────────┤
│ Manual Content Card                     │
│ - Sections with headings               │
│ - Step-by-step guides                  │
│ - Feature descriptions                 │
│ - Code examples (if any)              │
└─────────────────────────────────────────┘
```

#### Components
- **ManualContent**: Markdown-like content
- **Sections**: Collapsible sections
- **Code blocks**: Syntax highlighted

#### Colors Used
- Primary for links
- Muted for code blocks

#### Icons Used
- BookOpen, ChevronDown, ExternalLink

---

## Spacing System

### Gap Sizes
- **xs**: `0.5rem` (8px) - `gap-2`
- **sm**: `0.75rem` (12px) - `gap-3`
- **md**: `1rem` (16px) - `gap-4`
- **lg**: `1.25rem` (20px) - `gap-5`
- **xl**: `1.5rem` (24px) - `gap-6`
- **2xl**: `2rem` (32px) - `gap-8`

### Padding Sizes
- **Card Body**: `1rem` (mobile) / `1.25rem` (desktop) / `1.5rem` (large)
- **Card Header**: `1.5rem` (horizontal)
- **Card Content**: `1.5rem` (horizontal)
- **Section**: `0.75rem` (mobile) / `1rem` (desktop) / `1.25rem` (large)

### Margin Sizes
- **Page Top**: `0.75rem` (mobile) / `1rem` (desktop) / `1.25rem` (large)
- **Section**: `1rem` (mobile) / `1.5rem` (desktop) / `2rem` (large)
- **Element**: `0.5rem` to `1rem`

### Responsive Spacing
- Mobile: Smaller gaps (`gap-3`, `gap-4`)
- Desktop: Larger gaps (`gap-4`, `gap-5`, `gap-6`)

---

## Responsive Design

### Breakpoints
- **Mobile-First**: Design starts at mobile, then enhances for larger screens
- **Mobile**: `0px - 639px` (base, no prefix)
- **Tablet**: `≥ 640px` (sm:)
- **Desktop**: `≥ 1024px` (lg:)
- **Large Desktop**: `≥ 1280px` (xl:)
- **Approach**: Mobile styles are default; use `sm:`, `lg:`, `xl:` to enhance for larger screens

### Mobile Optimizations
- **Touch Targets**: Minimum 48x48px (up from 44px for better usability)
- **Font Size**: 16px base (prevents iOS zoom)
- **Spacing**: Optimized gaps (not just reduced - purposefully sized)
- **Layout**: Single column, stacked, edge-to-edge
- **Navigation**: Bottom tab bar (replaces sidebar)
- **Tables**: Horizontal scroll with visual indicators, or card view alternative
- **Forms**: Full width inputs, labels above, single column
- **Lists**: Infinite scroll (replaces pagination)
- **Gestures**: Swipe to delete, pull to refresh
- **Performance**: Reduced shadows, no backdrop blur, solid backgrounds
- **Primary CTAs**: Floating action buttons at bottom for thumb reach

### Desktop Optimizations
- **Layout**: Multi-column grids (enhanced from mobile single-column)
- **Font Size**: 14px base (reduced from mobile 16px for density)
- **Spacing**: Larger gaps (enhanced from mobile)
- **Navigation**: Left sidebar (replaces bottom nav)
- **Tables**: Full width, sortable columns
- **Forms**: Grid layouts (2 columns where appropriate)
- **Hover Effects**: Enabled (not available on mobile)
- **Backdrop Blur**: Enabled for glass morphism effects

---

## Animation & Transitions

### Transitions
- **Duration**: 
  - Mobile: `100ms` (faster, less CPU intensive)
  - Desktop: `150ms` (default), `200ms` (buttons), `300ms` (cards)
- **Timing**: `cubic-bezier(0.4, 0, 0.2, 1)`
- **Properties**: Color, background, border (avoid transforms on mobile)
- **Reduced Motion**: Respects `prefers-reduced-motion`
  - Disables transforms and complex animations
  - Uses opacity and color transitions only
  - Duration reduced to `50ms` or removed entirely

### Hover Effects (Desktop Only)
- **Cards**: `translateY(-2px)` + enhanced shadow
- **Buttons**: `translateY(-2px)` + glow effect
- **Links**: Underline animation
- **Icons**: Color change

### Tap Effects (Mobile)
- **Cards**: `scale(1.02)` briefly + background color shift
- **Buttons**: Ripple effect (CSS radial gradient) + background transition
- **Links**: Immediate color change (no animation)
- **Icons**: Color change + slight scale
- **No Transforms**: Avoid `translateY` on mobile (performance)

### Active Effects
- **Buttons**: 
  - Mobile: `scale(0.95)` (more pronounced for tactile feedback)
  - Desktop: `scale(0.98)`
- **Cards**: 
  - Mobile: `scale(0.98)` (subtle)
  - Desktop: `scale(0.98)`

### Loading States
- **Spinner**: Rotating icon (`Loader2`) - for quick actions (< 2s)
- **Progress Bar**: For longer operations (> 2s) - shows percentage
- **Skeleton**: Placeholder content with shimmer effect
- **Disabled**: `opacity: 0.5`
- **Mobile-First**: Larger spinners (24px) for better visibility

### Focus States
- **Ring**: `2px` or `3px` ring with primary color
- **Shadow**: Multi-layer glow
- **Outline**: `2px solid` with offset

---

## Component Specifications

### Buttons
- **Border Radius**: `0.5rem` (8px)
- **Font Weight**: Medium (500)
- **Transition**: All properties, 200ms
- **Focus Ring**: 3px, primary color, 50% opacity

### Cards
- **Border Radius**: `0.75rem` (12px)
- **Backdrop Blur**: `xl` (24px)
- **Shadow Layers**: 3 layers for depth
- **Hover Transform**: `translateY(-1px)` to `translateY(-2px)`

### Inputs
- **Border Radius**: `0.5rem` (8px)
- **Focus Ring**: 2px, primary color, 20% opacity
- **Focus Shadow**: Multi-layer glow
- **Placeholder**: Muted foreground, 50% opacity

### Badges
- **Border Radius**: `9999px` (fully rounded)
- **Padding**: `0.125rem 0.625rem`
- **Font Size**: `0.75rem` (12px)
- **Font Weight**: Medium (500)

### Tables
- **Border**: Bottom border on rows
- **Hover**: Muted background
- **Padding**: `0.75rem` (cells)
- **Font Size**: `0.875rem` (14px)

---

## Accessibility

### Color Contrast
- **Text on Background**: WCAG AAA compliant where possible (7:1 for normal text, 4.5:1 for large text)
- **Primary Blue**: `#1A91FF` on mobile provides better contrast than `#0070F2`
- **Interactive Elements**: Clear focus states with 2px+ ring
- **Status Colors**: Not color-only (includes icons/text for color-blind users)
- **Chart Colors**: Include patterns, labels, and icons in addition to colors

### Touch Targets
- **Minimum Size**: 48x48px (mobile - up from 44px for better usability)
- **Spacing**: Minimum 8px gap between targets (prevents mis-taps)
- **Button Padding**: Sufficient for easy tapping (0.75rem minimum)
- **Primary CTAs**: Larger targets (56px) for important actions

### Keyboard Navigation
- **Focus Indicators**: Visible ring/shadow
- **Tab Order**: Logical flow
- **Skip Links**: Available (if implemented)

### Screen Readers
- **ARIA Labels**: On all icon buttons and interactive elements
- **Alt Text**: On images
- **Semantic HTML**: Proper heading hierarchy (H1 → H2 → H3)
- **Live Regions**: For dynamic content updates (e.g., new messages, notifications)
- **Landmarks**: Proper use of `<nav>`, `<main>`, `<aside>`, etc.
- **Focus Management**: Logical tab order, skip links for main content

---

## Design Tokens Summary

### Colors (Light Theme)
```css
Primary: #0070F2
Success: #107E3E
Warning: #E9730C
Destructive: #BB0000
Background: #F5F6F7
Foreground: #32363A
Card: #FFFFFF
Muted: #F5F6F7
Muted Foreground: #6A6D70
Border: #D9D9D9
```

### Colors (Dark Theme)
```css
Primary: #4DB1FF
Success: #5DC122
Warning: #FFB300
Destructive: #FF5C77
Background: #1C2834
Foreground: #F5F6F7
Card: #2A3A48
Muted: #2A3A48
Muted Foreground: #A9B4BE
Border: #3A4A58
```

### Typography
```css
Font Family: Geist Sans, system-ui
Base Size: 14px (desktop) / 16px (mobile)
Line Height: 1.5
Font Weights: 400 (normal), 500 (medium), 600 (semibold), 700 (bold)
```

### Spacing
```css
Base Unit: 4px
Scale: 2, 3, 4, 5, 6, 8 (0.5rem to 2rem)
Gaps: 3, 4, 5, 6 (responsive)
Padding: 4, 5, 6 (responsive)
```

### Border Radius
```css
Small: 0.5rem (8px)
Medium: 0.625rem (10px)
Large: 0.75rem (12px)
Full: 9999px (pill)
```

### Shadows
```css
Card: Multi-layer (3 layers)
Button Hover: Glow effect
Focus: Ring + glow
Hover: Enhanced shadow
```

---

## UI Patterns

### Empty States
- **Icon**: Large, muted color
- **Title**: Medium weight
- **Description**: Muted text, smaller
- **Action**: Optional CTA button

### Loading States
- **Spinner**: Centered, primary color
- **Skeleton**: Placeholder with shimmer
- **Text**: "Loading..." or progress

### Error States
- **Alert**: Destructive variant
- **Icon**: AlertTriangle
- **Message**: Clear error description
- **Action**: Retry or contact support

### Success States
- **Alert**: Success variant
- **Icon**: CheckCircle2
- **Message**: Success confirmation
- **Auto-dismiss**: Optional toast

---

## Icon Usage Guidelines

### Icon Sizes by Context
- **Navigation**: `h-4 w-4` (16px) to `h-5 w-5` (20px)
- **Buttons**: `h-4 w-4` (16px)
- **Cards**: `h-5 w-5` (20px) to `h-6 w-6` (24px)
- **Empty States**: `h-12 w-12` (48px)
- **Hero Sections**: `h-8 w-8` (32px) to `h-10 w-10` (40px)

### Icon Colors
- **Default**: Current text color (inherits)
- **Primary**: Primary blue
- **Muted**: Muted foreground
- **Status**: Semantic colors (success, warning, destructive)

### Icon Spacing
- **With Text**: `gap-2` (8px) minimum
- **In Buttons**: `mr-2` (8px) before text
- **Standalone**: Centered in container

---

## Visual Hierarchy

### Heading Hierarchy
1. **H1**: Page titles (24px, semibold)
2. **H2**: Section titles (20px, semibold)
3. **H3**: Subsection titles (18px, semibold)
4. **H4**: Card titles (16px, semibold)

### Text Hierarchy
1. **Body**: Default text (14px)
2. **Small**: Secondary text (12px)
3. **Extra Small**: Labels, hints (10px)

### Color Hierarchy
1. **Foreground**: Primary text
2. **Muted Foreground**: Secondary text
3. **Primary**: Interactive elements
4. **Semantic**: Status indicators

---

## Mobile-Specific UI

### Navigation
- **Hamburger Menu**: Top left
- **Slide-out Drawer**: Full height, overlay
- **Close Button**: Top right (X icon)

### Forms
- **Full Width**: All inputs
- **Stacked**: Labels above inputs
- **Large Touch Targets**: 44px minimum
- **Sticky Submit**: Optional at top

### Cards
- **Full Width**: No side margins
- **Stacked**: Vertical layout
- **Reduced Padding**: `p-4` instead of `p-6`

### Tables
- **Horizontal Scroll**: With indicator
- **Stacked Layout**: Alternative view
- **Card View**: Convert to cards on mobile

---

## Desktop-Specific UI

### Navigation
- **Sidebar**: Fixed left, collapsible
- **Hover Expand**: Sidebar expands on hover
- **Breadcrumbs**: Optional (future)

### Layouts
- **Multi-column**: 2-3 columns
- **Grid Systems**: Responsive grids
- **Side Panels**: Optional right sidebar

### Tables
- **Full Width**: All columns visible
- **Sortable**: Click headers
- **Pagination**: Bottom of table

---

## Component States

### Buttons
- **Default**: Normal appearance
- **Hover**: Lighter/darker + shadow
- **Active**: Pressed state
- **Disabled**: Grayed out
- **Loading**: Spinner + disabled

### Inputs
- **Default**: Normal border
- **Focus**: Primary border + ring
- **Error**: Destructive border + message
- **Disabled**: Grayed out
- **Filled**: With value

### Cards
- **Default**: Normal shadow
- **Hover**: Enhanced shadow + lift
- **Selected**: Primary border
- **Loading**: Skeleton content

### Badges
- **Default**: Normal appearance
- **Hover**: Slight opacity change
- **Active**: Selected state (if applicable)

---

## Color Usage Rules

### Primary Blue
- ✅ Primary actions
- ✅ Links
- ✅ Active states
- ✅ Focus rings
- ❌ Not for text (use foreground)

### Success Green
- ✅ Success messages
- ✅ Completed states
- ✅ Positive metrics
- ❌ Not for primary actions

### Warning Orange
- ✅ Warnings
- ✅ Pending states
- ✅ Attention needed
- ❌ Not for errors

### Destructive Red
- ✅ Errors
- ✅ Delete actions
- ✅ Critical alerts
- ❌ Not for warnings

### Muted Colors
- ✅ Secondary text
- ✅ Placeholders
- ✅ Disabled states
- ✅ Subtle backgrounds

---

## Typography Usage Rules

### Headings
- ✅ One H1 per page
- ✅ Logical hierarchy (H1 → H2 → H3)
- ✅ Descriptive and concise
- ❌ Don't skip levels

### Body Text
- ✅ 14px base size
- ✅ 1.5 line height
- ✅ Sufficient contrast
- ❌ Don't use below 12px for body

### Labels
- ✅ Medium weight (500)
- ✅ Clear and descriptive
- ✅ Associated with inputs
- ❌ Don't use all caps (except badges)

---

## Spacing Usage Rules

### Consistent Gaps
- ✅ Use spacing scale (3, 4, 5, 6)
- ✅ Consistent within sections
- ✅ Responsive adjustments
- ❌ Don't mix arbitrary values

### Card Spacing
- ✅ `p-4` to `p-6` (responsive)
- ✅ `gap-4` to `gap-6` between cards
- ✅ `space-y-4` for vertical lists
- ❌ Don't use tight spacing

### Form Spacing
- ✅ `gap-4` between fields
- ✅ `mb-2` for labels
- ✅ `mt-1` for error messages
- ❌ Don't cramp inputs

---

## Icon Usage Rules

### Consistency
- ✅ Use Lucide React icons
- ✅ Consistent sizes
- ✅ Appropriate colors
- ❌ Don't mix icon libraries

### Context
- ✅ Icons with text labels
- ✅ Meaningful icons
- ✅ Accessible (ARIA labels)
- ❌ Don't use icons alone without labels (unless obvious)

### Sizing
- ✅ Match text size
- ✅ Consistent in groups
- ✅ Appropriate for context
- ❌ Don't mix sizes randomly

---

## Responsive Behavior

### Mobile (< 640px)
- Single column layouts
- Stacked cards
- Full-width inputs
- Hamburger menu
- Larger touch targets
- Reduced spacing

### Tablet (640px - 1024px)
- 2-column grids
- Side-by-side forms
- Expanded sidebar
- Medium spacing

### Desktop (> 1024px)
- Multi-column grids
- Sidebar navigation
- Optimized spacing
- Hover effects
- Full feature set

---

## Dark Mode Considerations

### Color Adjustments
- All colors have dark variants
- Maintains contrast ratios
- Semantic colors adjusted
- Backgrounds darker
- Text lighter

### Component Adjustments
- Cards: Darker backgrounds
- Borders: More visible
- Shadows: Adjusted for dark
- Icons: Appropriate colors

### User Preference
- System preference detection
- Manual toggle available
- Persists across sessions
- Smooth transitions

---

## Performance Optimizations

### Animations
- GPU-accelerated transforms
- Reduced motion support
- Smooth 60fps transitions
- Optimized hover effects

### Images
- Lazy loading
- Responsive sizes
- WebP format (if applicable)
- Placeholder blur

### Fonts
- Variable fonts (Geist) - reduces file size
- Subset loading - only required characters
- Font display: swap - prevents invisible text during load
- System fallbacks - `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto`
- Preload critical fonts - improves initial render

### Mobile-Specific Optimizations
- **3G Network Optimization**: 
  - Minify CSS/JS
  - Compress icons (SVG optimization)
  - Lazy load non-critical components
  - Code splitting for routes
- **Offline Support**: 
  - Service Workers for PWA capabilities
  - Offline fallbacks for critical pages
  - Cache strategies for static assets
- **Performance Targets**:
  - First Contentful Paint: < 1.5s
  - Time to Interactive: < 3s
  - Lighthouse Score: 90+ (Performance, Accessibility, Best Practices)

---

## Browser Support

### Supported Browsers
- Chrome/Edge: Latest 2 versions
- Firefox: Latest 2 versions
- Safari: Latest 2 versions
- Mobile Safari: iOS 14+
- Chrome Mobile: Android 8+

### Feature Support
- CSS Grid: ✅
- Flexbox: ✅
- Backdrop Filter: ✅ (with fallback)
- CSS Variables: ✅
- Modern JavaScript: ✅

---

## Design System Principles

### 1. Mobile-First
- **Design for constraints**: Small screens, touch input, variable networks
- **Progressive enhancement**: Start simple, enhance for larger devices
- **Performance priority**: Fast load times, smooth interactions
- **Touch-optimized**: 48px minimum targets, thumb-friendly positioning
- **Offline-capable**: PWA support for spotty networks

### 2. Consistency
- Same components, same behavior
- Consistent spacing
- Unified color usage
- Standardized typography
- Predictable patterns

### 3. Accessibility
- **WCAG AAA compliance** (where possible, AA minimum)
- Keyboard navigation
- Screen reader support
- Sufficient contrast (7:1 for normal text)
- Dynamic type support
- Reduced motion respect

### 4. Clarity
- Clear visual hierarchy
- Obvious interactions
- Helpful feedback (immediate on mobile)
- Intuitive navigation
- Minimal cognitive load

### 5. Efficiency
- Reusable components
- Design tokens
- Consistent patterns
- DRY principles
- **Minimalism**: Fewer variants, smarter defaults

### 6. Performance
- Optimized for 3G networks
- Reduced animations on mobile
- Solid backgrounds over blur
- Lazy loading
- Code splitting

### 7. Inclusivity
- Color-blind friendly (patterns + labels)
- Multiple input methods (touch, keyboard, voice)
- Offline support
- Cross-device compatibility

---

**Document Version**: 2.0 (Mobile-First Enhanced)  
**Last Updated**: 2025-01-27  
**Design System**: SAP Fiori Horizon (Mobile-First Enhanced)  
**Framework**: Next.js 16 + Tailwind CSS 4  
**Component Library**: Shadcn/ui + Custom  
**Approach**: Mobile-First with Progressive Enhancement

---

## Mobile-First Implementation Checklist

### Colors
- [x] Higher contrast primary blue for mobile (`#1A91FF`)
- [x] Color-blind support (patterns + labels in charts)
- [x] Softer saturations to reduce glare
- [x] Neutral accent for subtle dividers

### Typography
- [x] 16px base on mobile (prevents iOS zoom)
- [x] Increased line heights (1.6 for body)
- [x] Dynamic type support (rem units)
- [x] System font fallbacks

### Buttons
- [x] 48x48px minimum touch targets
- [x] Ripple/tap feedback (replaces hover)
- [x] FAB variant for primary actions
- [x] Bottom positioning for thumb reach

### Cards
- [x] Reduced shadow layers (performance)
- [x] No backdrop blur on mobile
- [x] Tap feedback (scale + color)
- [x] Expandable variant for dense content

### Icons
- [x] 20px minimum on mobile
- [x] ARIA labels for accessibility
- [x] SVG optimization
- [x] High-contrast mode support

### Layouts
- [x] Bottom nav bar (mobile)
- [x] Edge-to-edge on mobile
- [x] Infinite scroll for lists
- [x] Gesture support (swipe to delete)

### Forms
- [x] Single column default
- [x] Labels above inputs
- [x] Input masks and keyboard types
- [x] Haptic feedback (where supported)

### Performance
- [x] Reduced animations (100ms on mobile)
- [x] Solid backgrounds (no blur)
- [x] Lazy loading
- [x] Offline support (PWA)

### Accessibility
- [x] WCAG AAA contrast
- [x] Reduced motion support
- [x] Live regions for dynamic content
- [x] Comprehensive ARIA labels
