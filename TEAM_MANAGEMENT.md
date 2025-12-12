# Team Management & Access Control System

## Overview

This document describes the comprehensive team management and role-based access control (RBAC) system implemented in Lawyer Diary.

## Roles & Permissions

### 1. **Firm Owner**
- **Who**: The user who created the firm
- **Can See**: ALL cases in the firm
- **Can Do**: 
  - Manage all team members
  - Invite new members
  - Edit firm information
  - See all cases, clients, invoices, and time entries
  - Delete matters

### 2. **Principal Partner**
- **Who**: Users with role `principal_partner`
- **Can See**: ALL cases in the firm
- **Can Do**:
  - Manage team members (invite, assign roles)
  - See all cases, clients, invoices, and time entries
  - Create, edit, and delete matters
  - Manage staff assignments

### 3. **Associate**
- **Who**: Users with role `associate`
- **Can See**: 
  - Cases they created
  - Cases they are assigned to (via `assigned_attorneys` field)
- **Can Do**:
  - Create new matters
  - Edit matters they created or are assigned to
  - View assigned clients
  - Track time on assigned matters

### 4. **Of Counsel**
- **Who**: Users with role `of_counsel`
- **Can See**: 
  - Cases they created
  - Cases they are assigned to
- **Can Do**:
  - Create new matters
  - Edit matters they created or are assigned to
  - View assigned clients

### 5. **Paralegal**
- **Who**: Users with role `paralegal`
- **Can See**: ONLY cases they are assigned to
- **Can Do**:
  - View assigned matters
  - Add case history entries
  - Upload documents to assigned matters
  - Cannot create new matters

### 6. **Staff**
- **Who**: Users with role `staff`
- **Can See**: ONLY cases they are assigned to
- **Can Do**:
  - View assigned matters
  - Limited editing capabilities
  - Cannot create new matters

### 7. **Client**
- **Who**: Users with role `client`
- **Can See**: Only their own cases (if client portal is implemented)
- **Can Do**: Limited to viewing their own case information

## How to Add Team Members

### Step 1: Invite Team Member
1. Go to **Settings** → **Team** tab
2. Only **Firm Owners** and **Principal Partners** can invite new members
3. Click "Send Invite" in the Invitations section
4. Enter:
   - **Email**: The email address of the person to invite
   - **Role**: Select appropriate role (Principal Partner, Associate, Paralegal, etc.)
5. Click "Send invite"

### Step 2: Invitation Email
- The invited person receives an email with a secure invitation link
- The link contains a unique token that expires after a set period

### Step 3: Accept Invitation
1. The invited person clicks the link in the email
2. They are redirected to a sign-up page
3. They set their own password (security best practice)
4. They complete their profile
5. They are automatically added to the firm

### Step 4: Assign to Matters
- After joining, team members can be assigned to specific matters
- Go to a matter detail page and add them to `assigned_attorneys`
- Or use the Staff Manager to assign courts/districts

## Password Management

**Best Practice**: Team members set their own passwords when accepting invitations. This ensures:
- Better security (no password sharing)
- User control over their account
- Compliance with security standards

**Who Can Reset Passwords**: 
- Users can reset their own passwords via "Forgot Password"
- Firm owners cannot see or reset user passwords (handled by Supabase Auth)

## Database Schema

### Key Tables

#### `profiles`
- Stores user information and role
- `role` field determines access level
- `firm_id` links user to their firm

#### `firm_invitations`
- Tracks pending invitations
- Contains invitation token, email, role, and expiration

#### `staff`
- Maps users to staff roles (junior, senior, staff)
- Tracks assigned courts and districts

#### `matters`
- `created_by`: UUID of user who created the matter
- `assigned_attorneys`: Array of user UUIDs assigned to the matter
- `firm_id`: Links matter to firm

## RLS Policies

Row Level Security (RLS) policies enforce access control at the database level:

### Matters Table Policies

1. **SELECT (Read)**: 
   - Owners/Principals: See all matters
   - Associates/Of Counsel: See matters they created or are assigned to
   - Paralegals/Staff: See only assigned matters

2. **INSERT (Create)**:
   - Only firm members can create matters
   - Associates, Of Counsel, and Principals can create

3. **UPDATE (Edit)**:
   - Must be able to see the matter (using SELECT logic)
   - Additional checks ensure proper access

4. **DELETE**:
   - Only Owners and Principal Partners can delete

## Implementation Files

- **UI Components**: 
  - `web/components/settings/team-management.tsx` - Main team management UI
  - `web/components/settings/invite-manager.tsx` - Invitation management
  - `web/components/settings/staff-manager.tsx` - Staff assignments

- **Server Actions**:
  - `web/app/(app)/settings/actions.ts` - Team management actions

- **Database Policies**:
  - `supabase/rls-policies-matters.sql` - RLS policies for matters
  - `supabase/schema.sql` - Main database schema

## Security Best Practices

1. **Principle of Least Privilege**: Users only see what they need
2. **Role-Based Access**: Clear role definitions with specific permissions
3. **Invitation System**: Secure token-based invitations
4. **Password Management**: Users control their own passwords
5. **RLS at Database Level**: Access control enforced in database, not just UI
6. **Audit Trail**: `created_by` and `updated_by` fields track who did what

## Troubleshooting

### User Can't See Cases
- Check their role in `profiles` table
- Verify they are assigned to the matter (`assigned_attorneys` field)
- Check if they created the matter (`created_by` field)
- Verify RLS policies are applied correctly

### Can't Invite Team Members
- Only Firm Owners and Principal Partners can invite
- Check your role in the `profiles` table
- Verify you have `canManageStaff` permission

### Invitation Not Working
- Check invitation token hasn't expired
- Verify email address is correct
- Check invitation status in `firm_invitations` table

## Future Enhancements

- [ ] Client portal for clients to view their cases
- [ ] More granular permissions (e.g., can edit but not delete)
- [ ] Team member activity logs
- [ ] Bulk invitation system
- [ ] Role templates for common firm structures

