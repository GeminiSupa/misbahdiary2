# How to Create Users as Principal Partner

## Overview

Principal Partners and Firm Owners can create user accounts directly with email and password, or send email invitations. This guide explains both methods.

## Method 1: Create User Directly (Recommended for Internal Setup)

### Steps:

1. **Navigate to Settings**
   - Go to **Settings** → **Team** tab
   - Only Principal Partners and Firm Owners will see the "Add Team Members" section

2. **Open Create User Tab**
   - Click on the **"Create User Account"** tab
   - You'll see a form to create a new user

3. **Fill in User Details**
   - **Full Name**: Enter the user's full name
   - **Email Address**: Enter a valid email address (must be unique)
   - **Role**: Select the appropriate role:
     - **Principal Partner**: Full access, can manage team
     - **Associate**: Can see assigned cases and cases they created
     - **Of Counsel**: Can see assigned cases and cases they created
     - **Paralegal**: Can see only assigned cases
     - **Staff**: Can see only assigned cases
     - **Client**: Limited access (for client portal)
   - **Password**: Create a strong password (minimum 8 characters, must include uppercase, lowercase, and number)
   - **Confirm Password**: Re-enter the password

4. **Create the User**
   - Click **"Create User"** button
   - The user account will be created immediately
   - The user can sign in right away with the email and password you set

### What Happens:
- User account is created in Supabase Auth
- Profile is automatically created with the role and firm association
- User can sign in immediately
- Email is auto-confirmed (no email verification needed)

## Method 2: Send Invitation (Recommended for External Users)

### Steps:

1. **Navigate to Settings**
   - Go to **Settings** → **Team** tab
   - Click on the **"Send Invitation"** tab

2. **Fill Invitation Details**
   - **Email**: Enter the user's email address
   - **Role**: Select the appropriate role

3. **Send Invitation**
   - Click **"Send Invite"**
   - An invitation email will be sent (if email service is configured)
   - The user receives a secure invitation link

4. **User Accepts Invitation**
   - User clicks the invitation link
   - User sets their own password (better security)
   - User completes their profile
   - User is added to the firm

### Benefits of Invitation Method:
- User sets their own password (more secure)
- Better user experience
- Follows security best practices
- Email verification included

## Password Requirements

When creating users directly, passwords must meet these requirements:
- **Minimum 8 characters**
- **At least one uppercase letter** (A-Z)
- **At least one lowercase letter** (a-z)
- **At least one number** (0-9)

## Role Permissions Summary

| Role | Can See All Cases | Can Create Cases | Can Manage Team | Can Delete Cases |
|------|------------------|------------------|-----------------|------------------|
| Firm Owner | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |
| Principal Partner | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |
| Associate | ❌ No (assigned only) | ✅ Yes | ❌ No | ❌ No |
| Of Counsel | ❌ No (assigned only) | ✅ Yes | ❌ No | ❌ No |
| Paralegal | ❌ No (assigned only) | ❌ No | ❌ No | ❌ No |
| Staff | ❌ No (assigned only) | ❌ No | ❌ No | ❌ No |

## Security Best Practices

1. **Use Strong Passwords**: Always create strong, unique passwords
2. **Share Credentials Securely**: If creating users directly, share credentials through a secure channel
3. **Prefer Invitations**: Use the invitation method when possible for better security
4. **Regular Audits**: Periodically review team members and their roles
5. **Remove Access**: Remove users who no longer need access

## Troubleshooting

### "A user with this email already exists"
- The email is already registered in the system
- Check if the user already has an account
- Use the invitation method if the user needs to set their own password

### "Server configuration error"
- The `SUPABASE_SERVICE_ROLE_KEY` environment variable is not set
- Contact your system administrator to configure this

### "Only firm owners or principal partners can create user accounts"
- You don't have permission to create users
- Only Firm Owners and Principal Partners can create users
- Contact your firm owner to get Principal Partner role

### User Created But Can't Sign In
- Check that the email and password are correct
- Verify the user's profile was created correctly
- Check if the user is associated with the correct firm

## Environment Setup

To enable user creation, ensure these environment variables are set:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key  # Required for creating users
```

**Important**: The `SUPABASE_SERVICE_ROLE_KEY` should be kept secret and only used on the server side. Never expose it in client-side code.

