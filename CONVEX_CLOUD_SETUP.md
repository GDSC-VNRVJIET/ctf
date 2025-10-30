# Convex Cloud Setup Guide

This guide will help you set up Convex's online database for your CTF platform.

## Prerequisites

1. **Convex Account**: Sign up at [convex.dev](https://convex.dev)
2. **Node.js**: Make sure you have Node.js installed
3. **Convex CLI**: Install globally with `npm install -g convex`

## Step 1: Create a Convex Cloud Project

1. Go to [Convex Dashboard](https://dashboard.convex.dev)
2. Click "Create Project"
3. Choose your project name (e.g., `ctf-convergence`)
4. Select your preferred region
5. Click "Create"

## Step 2: Deploy Your Convex Functions

1. **Login to Convex CLI:**
   ```bash
   npx convex login
   ```
   This will open your browser for authentication.

2. **Initialize/Connect Your Project:**
   ```bash
   cd convex
   npx convex dev --once
   ```
   This will link your local project to the cloud deployment.

3. **Deploy Your Functions:**
   ```bash
   npx convex deploy
   ```
   This pushes your Convex functions, schema, and data to the cloud.

## Step 3: Get Your Deployment URL

After deployment, you'll see your deployment URL in the terminal or dashboard. It will look like:
```
https://your-project-name.convex.cloud
```

## Step 4: Update Environment Variables

1. **Update Convex Environment:**
   ```bash
   # In convex/.env.local
   CONVEX_DEPLOYMENT=your-project-name
   CONVEX_URL=https://your-project-name.convex.cloud
   ```

2. **Update Frontend Environment:**
   ```bash
   # In frontend/.env.production
   VITE_CONVEX_URL=https://your-project-name.convex.cloud
   ```

3. **Update Backend Environment:**
   ```bash
   # In backend/.env.production
   CONVEX_URL=https://your-project-name.convex.cloud
   ```

## Step 5: Test the Connection

1. **Start your local development:**
   ```bash
   # In the convex directory
   npx convex dev
   ```

2. **Test your frontend:**
   ```bash
   cd frontend
   npm run dev
   ```

3. **Verify data syncs to cloud** by checking the Convex dashboard.

## Team Collaboration Setup

### Adding Team Members

1. **Go to Convex Dashboard** → Your Project → Settings → Members
2. **Invite team members** by email
3. **Assign roles:**
   - **Admin**: Full access to deploy and manage
   - **Developer**: Can deploy functions and modify data
   - **Viewer**: Read-only access

### Local Development with Team

Each team member should:

1. **Clone the repository**
2. **Install dependencies:**
   ```bash
   cd convex
   npm install
   ```
3. **Login to Convex:**
   ```bash
   npx convex login
   ```
4. **Link to the project:**
   ```bash
   npx convex dev --once
   ```

### Development Workflow

1. **Pull latest changes** from the repository
2. **Make changes** to Convex functions/schema
3. **Test locally** with `npx convex dev`
4. **Deploy to cloud** with `npx convex deploy`
5. **Commit and push** your changes

## Production Deployment

### Automated Deployment (Recommended)

Use the setup scripts we created:

```bash
# Linux/Mac
./setup-render-deployment.sh

# Windows
setup-render-deployment.bat
```

The script will prompt for your Convex URL and update all configurations.

### Manual Deployment

1. **Deploy Convex functions:**
   ```bash
   cd convex
   npx convex deploy --prod
   ```

2. **Deploy to Render** using the blueprint or manual setup

3. **Update CORS** in your backend to allow your Render frontend URL

## Monitoring and Management

### Convex Dashboard Features

- **Data Browser**: View and edit your data in real-time
- **Function Logs**: Monitor function execution and errors
- **Metrics**: Usage statistics and performance data
- **Backups**: Automatic data backups

### Common Commands

```bash
# View deployment status
npx convex dashboard

# View function logs
npx convex logs

# Export data (for backup)
npx convex export

# Import data (for restore)
npx convex import data.json
```

## Troubleshooting

### Connection Issues

1. **Check your CONVEX_URL** - make sure it's correct
2. **Verify deployment** - ensure functions are deployed with `npx convex deploy`
3. **Check permissions** - make sure you have access to the project

### Data Sync Issues

1. **Run schema migrations** if you've changed the schema
2. **Check function logs** for errors
3. **Verify environment variables** are set correctly

### Team Collaboration Issues

1. **Re-link project** with `npx convex dev --once`
2. **Check member permissions** in the dashboard
3. **Ensure everyone is using the same deployment**

## Security Best Practices

1. **Environment Variables**: Never commit secrets to git
2. **Access Control**: Use appropriate member roles
3. **Data Validation**: Validate data in Convex functions
4. **Rate Limiting**: Implement appropriate limits for your use case

## Free Tier Limits

Convex offers generous free tier limits:
- 1GB data storage
- 100k function calls/month
- 1GB bandwidth/month
- Real-time subscriptions included

Monitor usage in the Convex dashboard to stay within limits.

---

## Quick Setup Summary

1. Create Convex project at [dashboard.convex.dev](https://dashboard.convex.dev)
2. Run `npx convex login` and `npx convex dev --once`
3. Deploy with `npx convex deploy`
4. Update environment variables with your deployment URL
5. Run the setup script: `./setup-render-deployment.sh`
6. Deploy to Render

Your team can now collaborate in real-time on the same cloud database! 🚀</content>
<parameter name="filePath">c:\Users\mahes\OneDrive\Desktop\Projects\Projects_Personal\CTF\CTF---Convergence\CONVEX_CLOUD_SETUP.md