# Storage Setup Instructions

## Quick Setup

### Step 1: Create the Storage Bucket

**Option A: Via Supabase Dashboard (Recommended)**
1. Go to your Supabase Dashboard
2. Navigate to **Storage** in the left sidebar
3. Click **"New bucket"**
4. Configure:
   - **Name**: `case_files`
   - **Public**: `No` (Private bucket)
   - **File size limit**: `50MB`
   - **Allowed MIME types**: 
     - `application/pdf`
     - `image/jpeg`
     - `image/png`
     - `image/jpg`
     - `application/msword`
     - `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
     - `application/vnd.ms-excel`
     - `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
5. Click **"Create bucket"**

**Option B: Via Supabase CLI**
```bash
supabase login
supabase link --project-ref your-project-ref
supabase storage create case_files --public false
```

**Option C: Via Script**
```bash
cd web
npm run supabase:setup-storage
```

### Step 2: Set Up Storage Policies

**Option A: Via Supabase SQL Editor (Recommended)**
1. Go to Supabase Dashboard → **SQL Editor**
2. Open the file: `supabase/setup-storage.sql`
3. Copy and paste the entire SQL into the editor
4. Click **"Run"**

**Option B: Via Supabase CLI**
```bash
supabase db push
# Or manually:
supabase db execute -f supabase/setup-storage.sql
```

## What the Policies Do

The storage policies ensure that:
- ✅ Only authenticated users can access files
- ✅ Users can only access files from their own firm's folder
- ✅ File structure: `{firm_id}/clients/{client_id}/{filename}`
- ✅ Users can upload, read, update, and delete files in their firm's folder

## Verification

After setup, verify the bucket exists:
1. Go to Storage → You should see `case_files` bucket
2. Check policies: Storage → Policies → `case_files`
3. You should see 4 policies:
   - Firm members can upload files
   - Firm members can read files
   - Firm members can update files
   - Firm members can delete files

## Troubleshooting

**Error: "Bucket not found"**
- Make sure you created the bucket first (Step 1)
- Check the bucket name is exactly `case_files`

**Error: "Permission denied"**
- Make sure you ran the SQL policies (Step 2)
- Verify your user has a `firm_id` in the profiles table
- Check that you're authenticated

**Files not uploading**
- Check browser console for errors
- Verify file size is under 50MB
- Check file type is in allowed MIME types list

