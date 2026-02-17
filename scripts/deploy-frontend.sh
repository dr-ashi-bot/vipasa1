#!/bin/bash
# Deploy frontend to Vercel
# Run: vercel login   (first time only)
# Then: ./scripts/deploy-frontend.sh

set -e
cd "$(dirname "$0")/../frontend"
echo "Building frontend..."
npx expo export --platform web
echo "Deploying to Vercel..."
vercel --prod
echo "Done! Check the URL above."
