# CTF Platform - Render Deployment Guide

This guide will help you deploy the CTF Platform to Render's free tier.

## Quick Setup (Recommended)

Use the automated setup script to configure your deployment:

**Linux/Mac:**
```bash
./setup-render-deployment.sh
```

**Windows:**
```cmd
setup-render-deployment.bat
```

The script will:
- Prompt for your Convex deployment URL
- Optionally prompt for MongoDB connection string
- Update all configuration files automatically
- Provide next steps for deployment

## Prerequisites

1. **Render Account**: Sign up at [render.com](https://render.com)
2. **Convex Account**: Sign up at [convex.dev](https://convex.dev)
3. **MongoDB Atlas**: Free tier database (optional, if not using Convex for everything)

## Deployment Steps

### 1. Deploy Convex Backend

1. Go to [Convex Dashboard](https://dashboard.convex.dev)
2. Create a new project
3. Copy the deployment URL (it will look like `https://your-project-name.convex.cloud`)

### 2. Deploy to Render

#### Option A: Multi-Service Deployment (Recommended)

1. Fork this repository to your GitHub account
2. Go to [Render Dashboard](https://dashboard.render.com)
3. Click "New" → "Blueprint"
4. Connect your GitHub repository
5. Render will automatically detect the `render.yaml` file
6. Configure the secrets:
   - `convex-url`: Your Convex deployment URL
   - `mongo-url`: Your MongoDB connection string (if needed)
7. Click "Create Blueprint"

#### Option B: Manual Service Creation

**Backend Service:**
1. Click "New" → "Web Service"
2. Connect your repository
3. Configure:
   - **Name**: `ctf-backend`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
4. Add environment variables:
   - `CONVEX_URL`: Your Convex URL
   - `MONGO_URL`: Your MongoDB URL (if needed)
   - `SECRET_KEY`: Generate a random string
   - `JWT_SECRET_KEY`: Generate a random string

**Frontend Service:**
1. Click "New" → "Static Site"
2. Connect your repository
3. Configure:
   - **Name**: `ctf-frontend`
   - **Build Command**: `npm run build`
   - **Publish Directory**: `dist`
4. Add environment variables:
   - `VITE_CONVEX_URL`: Your Convex URL
   - `VITE_API_URL`: Your backend service URL (e.g., `https://ctf-backend.onrender.com`)

### 3. Update CORS Configuration

After deployment, update the backend CORS settings in `backend/main.py`:

```python
allow_origins=[
    "http://localhost:3000",
    "http://localhost:5173",
    "https://your-frontend-app.onrender.com",  # Update with actual frontend URL
],
```

### 4. Update Environment Files

Update the following files with your actual URLs:

- `frontend/.env.production`
- `backend/.env.production`
- `render.yaml` (if using multi-service deployment)

## Free Tier Considerations

- **Sleeping Services**: Render free services sleep after 15 minutes of inactivity
- **Cold Starts**: First request after sleeping may take 10-30 seconds
- **Monthly Hours**: 750 hours free, monitor usage in dashboard
- **No Background Workers**: All processing must be request-driven

## Health Checks

The backend includes a `/health` endpoint for Render's health checks.

## Troubleshooting

1. **CORS Issues**: Ensure frontend URL is in backend CORS allow_origins
2. **Environment Variables**: Check that all required env vars are set
3. **Build Failures**: Ensure all dependencies are in requirements.txt
4. **Convex Connection**: Verify Convex URL is correct and accessible

## URLs After Deployment

- Frontend: `https://ctf-frontend.onrender.com`
- Backend: `https://ctf-backend.onrender.com`
- Convex: `https://your-project-name.convex.cloud`