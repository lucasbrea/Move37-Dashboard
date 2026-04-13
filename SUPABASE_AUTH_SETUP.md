# Supabase Authentication & Storage Setup Guide

## 1. Enable Authentication in Supabase

1. Go to your Supabase Dashboard
2. Navigate to **Authentication** → **Providers**
3. Enable **Email** provider (it's usually enabled by default)
4. Configure email settings if needed

## 2. Create Storage Bucket

1. Go to **Storage** in your Supabase Dashboard
2. Click **New bucket**
3. Name it: `dlc_uploads` (or your preferred name)
4. Set it to **Public** if you want public URLs, or **Private** for authenticated-only access
5. Click **Create bucket**

## 3. Set Up RLS Policies for Storage

1. Go to **Storage** → Click on your bucket (`dlc_uploads`)
2. Go to **Policies** tab
3. Create the following policies:

### Policy 1: Allow Authenticated Users to Upload
- **Policy name**: `Allow authenticated uploads`
- **Allowed operation**: `INSERT`
- **Target roles**: `authenticated`
- **Policy definition**:
```sql
( bucket_id = 'dlc_uploads'::text )
```

### Policy 2: Allow Authenticated Users to Read
- **Policy name**: `Allow authenticated read`
- **Allowed operation**: `SELECT`
- **Target roles**: `authenticated`
- **Policy definition**:
```sql
( bucket_id = 'dlc_uploads'::text )
```

### Policy 3: Allow Authenticated Users to Delete (Optional)
- **Policy name**: `Allow authenticated delete`
- **Allowed operation**: `DELETE`
- **Target roles**: `authenticated`
- **Policy definition**:
```sql
( bucket_id = 'dlc_uploads'::text )
```

## 4. Create Your First User

### Option A: Through the App
1. Go to the Conformation page
2. Click "Sign In to Upload"
3. Click "Don't have an account? Sign up"
4. Enter your email and password (min 6 characters)
5. Check your email for confirmation link
6. Click the confirmation link
7. Sign in with your credentials

### Option B: Through Supabase Dashboard
1. Go to **Authentication** → **Users**
2. Click **Add user** → **Create new user**
3. Enter email and password
4. User will be created and can sign in immediately

## 5. Test the Upload

1. Sign in to your app
2. Go to the Conformation page
3. You should see "Signed in as [your-email]"
4. Try uploading a photo - it should work now!

## Troubleshooting

### "Bucket not found" error
- Make sure the bucket name matches exactly (case-sensitive)
- Check that the bucket exists in your Supabase Storage

### "Permission denied" error
- Check that RLS policies are set up correctly
- Make sure you're signed in (check the top right of the page)
- Verify the bucket allows authenticated users

### "User not authenticated" error
- Make sure you've confirmed your email (if email confirmation is enabled)
- Try signing out and signing back in
- Check browser console for auth errors

## Security Notes

- For production, consider more restrictive RLS policies
- You can add policies to restrict uploads by file size, type, or user
- Consider adding rate limiting for uploads
- Enable email confirmation for better security


