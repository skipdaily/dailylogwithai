# Deployment Guide for Construction Daily Log App

This guide provides detailed instructions for deploying the Construction Daily Log application to Vercel.

## Prerequisites

1. A [Vercel](https://vercel.com) account
2. A [Supabase](https://supabase.com) account with your database already set up
3. An [OpenAI](https://openai.com) account with an API key

## Deployment Options

### Option 1: Manual Deployment

1. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **Log in to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy the Application**:
   ```bash
   # From the project root
   vercel --prod
   ```

4. **Set Environment Variables**:
   After deployment, go to the Vercel dashboard and configure the following environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous key
   - `OPENAI_API_KEY`: Your OpenAI API key

### Option 2: GitHub Integration

1. Push your code to a GitHub repository
2. Connect your Vercel account to GitHub
3. Import the repository in the Vercel dashboard
4. Configure build settings and environment variables
5. Deploy

### Option 3: Using GitHub Actions

1. Set up the following secrets in your GitHub repository settings:
   - `VERCEL_TOKEN`: Your Vercel API token
   - `VERCEL_ORG_ID`: Your Vercel organization ID
   - `VERCEL_PROJECT_ID`: Your Vercel project ID
   - `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anon key
   - `OPENAI_API_KEY`: Your OpenAI API key

2. Push to the main branch, and the GitHub workflow will automatically deploy to Vercel

## Verifying Deployment

After deployment, you can verify that everything is working correctly:

1. Visit your deployed site at the Vercel-provided URL
2. Check the health endpoint at `/api/health` to verify all services are connected
3. Test creating a new log to verify database connectivity
4. Test the AI assistant to verify OpenAI connectivity

## Troubleshooting

### Common Issues

1. **Build Failures**:
   - Check the build logs for specific errors
   - Verify that all dependencies are installed
   - Ensure all environment variables are properly set

2. **Database Connection Issues**:
   - Verify that your Supabase project is active
   - Check that your Supabase URL and anon key are correct
   - Make sure your IP is not being blocked by any security rules

3. **AI Functionality Not Working**:
   - Verify that your OpenAI API key is valid
   - Check that you have sufficient quota/credits
   - Look for errors in the browser console or server logs

4. **Authentication Problems**:
   - Ensure Supabase authentication is properly configured
   - Check for CORS issues if experiencing login problems

## Ongoing Maintenance

After deployment, consider setting up:

1. **Monitoring**: Integrate with a monitoring service to track application health
2. **Analytics**: Add analytics to understand user behavior
3. **Backups**: Regular database backups to prevent data loss
4. **Updates**: Regularly update dependencies to maintain security

---

For further assistance, contact the development team or refer to the documentation for [Next.js](https://nextjs.org/docs), [Vercel](https://vercel.com/docs), and [Supabase](https://supabase.com/docs).
