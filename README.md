# Construction Daily Log Application

A web application for tracking and managing construction daily logs. Built with Next.js, Tailwind CSS, Supabase, and ChatGPT integration.

## Features

- Create and manage daily construction logs
- Track subcontractors and crews
- Document work performed, delays, meetings, and action items
- Export logs to PDF
- AI assistant for analyzing log data and answering questions
- User-friendly dashboard interface

## Tech Stack

- **Frontend**: Next.js, React, TypeScript, Tailwind CSS
- **Backend**: Supabase (Database, Authentication)
- **AI Integration**: OpenAI ChatGPT
- **Deployment**: Vercel

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables in `.env.local`
4. Run development server: `npm run dev`

## Environment Variables

Create a `.env.local` file with the following variables:

```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
OPENAI_API_KEY=your-openai-api-key
```

## Deployment

This project is set up to be deployed on Vercel with Supabase for the database.

### Deploying to Vercel

#### Option 1: Using the Vercel CLI (Recommended)

1. Make sure you have the Vercel CLI installed:
   ```bash
   npm install -g vercel
   ```

2. Login to Vercel:
   ```bash
   vercel login
   ```

3. Deploy the project by running:
   ```bash
   npm run deploy
   ```
   
   Alternatively, you can run the deploy script directly:
   ```bash
   ./deploy.sh
   ```

#### Option 2: Direct Deployment

1. Push your code to a GitHub repository
2. Go to [Vercel Dashboard](https://vercel.com/dashboard)
3. Click "New Project" and import your GitHub repository
4. Configure the project settings
5. Set up the environment variables:
   - `OPENAI_API_KEY`: Your OpenAI API key
   - `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous key
6. Deploy the project

### Important Deployment Notes

1. **Environment Variables**: Make sure to set all required environment variables in the Vercel dashboard.
2. **Build Settings**: The project is configured to ignore TypeScript and ESLint errors during build.
3. **Database**: Ensure your Supabase database is properly set up and accessible.
4. **OpenAI API Key**: A valid OpenAI API key is required for the AI functionality to work.

### Troubleshooting Deployment Issues

If you encounter issues during deployment:

1. Check the Vercel deployment logs for specific error messages
2. Verify that all environment variables are correctly set
3. Ensure your Supabase database is properly configured
4. Check that your OpenAI API key is valid and has sufficient quota
