# Access Control: User Creation & Team Management

## Summary

**Only Principal Partners** can create user accounts and send invitations. This restriction has been implemented at both the UI and server levels.

## Permission Structure

### Who Can Do What

| Action | Firm Owner | Principal Partner | Associate | Staff/Paralegal |
|--------|------------|-------------------|-----------|-----------------|
| **Create User Accounts** | ❌ No | ✅ Yes | ❌ No | ❌ No |
| **Send Invitations** | ❌ No | ✅ Yes | ❌ No | ❌ No |
| **Manage Staff Assignments** | ✅ Yes | ✅ Yes | ❌ No | ❌ No |
| **View Team Members** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |

## Implementation Details

### 1. Server-Side Restrictions

**File: `web/app/(app)/settings/actions.ts`**

#### `createUser()` Function
- **Before**: Firm Owners AND Principal Partners could create users
- **After**: ONLY Principal Partners can create users
- **Code Change**:
  ```typescript
  // OLD: const canCreateUsers = isOwner || actorProfile.role === "principal_partner";
  // NEW:
  const canCreateUsers = actorProfile.role === "principal_partner";
  ```

#### `createInvitation()` Function
- **Before**: Any firm member could send invitations
- **After**: ONLY Principal Partners can send invitations
- **Code Change**:
  ```typescript
  if (profile.role !== "principal_partner") {
    return {
      message: "Only Principal Partners can send invitations to add team members.",
    };
  }
  ```

### 2. UI-Level Restrictions

**File: `web/components/settings/team-management.tsx`**

- The "Add Team Members" section (Create User + Invite tabs) is only visible to Principal Partners
- Uses `canCreateUsers` prop which is `true` only for Principal Partners
- Shows an alert message to non-Principal Partners explaining the restriction

**File: `web/components/settings/invite-manager.tsx`**

- Added `canInvite` prop to conditionally show/hide the invitation form
- Shows permission alert if user tries to access without permission

### 3. Permission Checks

**File: `web/app/(app)/settings/page.tsx`**

- Added `canCreateUsers` variable that checks:
  ```typescript
  const canCreateUsers = profile.role === "principal_partner";
  ```
- This is passed down to components to control UI visibility

## Security Benefits

1. **Principle of Least Privilege**: Only the most trusted role can add users
2. **Prevents Unauthorized Access**: Even if someone gains access to a staff account, they cannot add new users
3. **Clear Separation**: Firm Owners manage firm settings, Principal Partners manage team
4. **Audit Trail**: All user creation is traceable to Principal Partners only

## User Experience

### For Principal Partners:
- ✅ Can see "Add Team Members" section
- ✅ Can create user accounts directly
- ✅ Can send email invitations
- ✅ Clear UI indicating their permissions

### For Firm Owners:
- ❌ Cannot see "Add Team Members" section
- ✅ Can still manage staff assignments
- ✅ Can view team members
- ℹ️ See alert explaining they need a Principal Partner to add users

### For Associates/Staff/Paralegals:
- ❌ Cannot see "Add Team Members" section
- ❌ Cannot create users
- ❌ Cannot send invitations
- ✅ Can view team members
- ℹ️ See alert explaining they need a Principal Partner to add users

## Error Messages

When unauthorized users try to create users (via API):
- **Message**: "Only Principal Partners can create user accounts. Firm Owners cannot create users directly."

When unauthorized users try to send invitations:
- **Message**: "Only Principal Partners can send invitations to add team members."

## Testing Checklist

- [ ] Principal Partner can create users ✅
- [ ] Principal Partner can send invitations ✅
- [ ] Firm Owner cannot create users ✅
- [ ] Firm Owner cannot send invitations ✅
- [ ] Associate cannot create users ✅
- [ ] Staff cannot create users ✅
- [ ] UI properly hides forms for unauthorized users ✅
- [ ] Server-side validation prevents unauthorized access ✅

## Future Considerations

If you want to allow Firm Owners to also create users in the future:
1. Change `canCreateUsers` to: `const canCreateUsers = isOwner || actorProfile.role === "principal_partner";`
2. Update the `createUser()` and `createInvitation()` functions accordingly
3. Update UI messages to reflect the change

