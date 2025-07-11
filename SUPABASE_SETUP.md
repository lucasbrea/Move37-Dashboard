# Supabase Setup Guide

## 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create an account
2. Create a new project
3. Note down your project URL and anon key from the project settings

## 2. Create the Reports Table

In your Supabase dashboard, go to the SQL editor and run this query:

```sql
CREATE TABLE reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  category TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  criador TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows all operations (for development)
-- In production, you should create more restrictive policies
CREATE POLICY "Allow all operations" ON reports FOR ALL USING (true);
```

## 3. Set Up Environment Variables

Create a `.env.local` file in your project root with:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Replace the values with your actual Supabase project URL and anon key.

## 4. Install Dependencies

The Supabase client is already installed. If you need to reinstall:

```bash
npm install @supabase/supabase-js
```

## 5. Usage

The app now uses the `useReports` hook to manage reports from Supabase. The hook provides:

- `reports`: Array of reports from the database
- `loading`: Loading state
- `error`: Error state
- `addReport`: Function to add a new report
- `updateReport`: Function to update an existing report
- `deleteReport`: Function to delete a report

## 6. Database Schema

Your reports table should have these columns:

- `id` (UUID, Primary Key)
- `title` (TEXT, Required)
- `url` (TEXT, Required)
- `category` (TEXT, Required)
- `tags` (TEXT[], Array of tags)
- `criador` (TEXT, Optional)
- `created_at` (TIMESTAMP, Auto-generated)
- `updated_at` (TIMESTAMP, Auto-generated)

## 7. Example Usage

```typescript
import { useReports } from '../hooks/useReports';

function MyComponent() {
  const { reports, loading, error, addReport } = useReports('category-name');
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  
  return (
    <div>
      {reports.map(report => (
        <div key={report.id}>{report.title}</div>
      ))}
    </div>
  );
}
``` 