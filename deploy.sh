#!/bin/bash
# Deployment script for Vercel

# Ensure we have the Vercel CLI
if ! command -v vercel &> /dev/null; then
  echo "Vercel CLI not found. Installing..."
  npm install -g vercel
fi

# Check if we're logged in
if ! vercel whoami &> /dev/null; then
  echo "Please log in to Vercel:"
  vercel login
fi

# Deploy to Vercel
echo "Deploying to Vercel..."
vercel --prod

echo "Deployment complete! Don't forget to set environment variables in the Vercel dashboard:"
echo "1. OPENAI_API_KEY - Your OpenAI API key"
echo "2. NEXT_PUBLIC_SUPABASE_URL - Your Supabase URL"
echo "3. NEXT_PUBLIC_SUPABASE_ANON_KEY - Your Supabase anonymous key"
