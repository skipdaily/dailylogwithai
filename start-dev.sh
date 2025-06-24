#!/bin/bash

# Create a .env.local file if it doesn't exist
if [ ! -f .env.local ]; then
  echo "Creating .env.local file..."
  cat << 'EOF' > .env.local
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
OPENAI_API_KEY=your-openai-api-key
EOF
fi

# Make sure Tailwind CSS is properly installed and configured
echo "Ensuring Tailwind CSS is properly configured..."
npm uninstall tailwindcss postcss autoprefixer
npm install tailwindcss@3.3.5 postcss@8.4.31 autoprefixer@10.4.16 --save-exact

# Update postcss.config.js
cat << 'EOF' > postcss.config.js
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
EOF

# Start the development server
echo "Starting the development server..."
npm run dev
