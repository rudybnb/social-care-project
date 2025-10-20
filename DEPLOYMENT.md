# Deployment Guide - Render

This guide will help you deploy the Social Care project to Render.

## Prerequisites

1. **GitHub Repository**: Push your code to a GitHub repository
2. **Render Account**: Sign up at [render.com](https://render.com)

## Deployment Steps

### 1. Connect GitHub Repository

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New +" → "Blueprint"
3. Connect your GitHub account and select this repository
4. Render will automatically detect the `render.yaml` file

### 2. Configure Environment Variables

The following environment variables will be automatically set by the `render.yaml` configuration:

#### Backend Service
- `NODE_ENV=production`
- `PORT=10000` (automatically set by Render)
- `DATABASE_URL` - Will be automatically connected to the PostgreSQL database

#### Frontend Service
- `NODE_ENV=production`
- `REACT_APP_API_URL` - Will automatically point to your backend service

### 3. Database Setup

The PostgreSQL database will be automatically created with:
- **Database Name**: `socialcare`
- **User**: `socialcare_user`
- **Plan**: Free tier

### 4. Deployment Process

1. **Automatic Build**: Render will:
   - Install dependencies for both frontend and backend
   - Build the TypeScript backend
   - Build the React frontend for production
   - Deploy both services

2. **Health Checks**: The backend includes a health check endpoint at `/api/health`

3. **Static Files**: The frontend will be served as static files from the build directory

## Service URLs

After deployment, you'll get:
- **Frontend**: `https://social-care-frontend.onrender.com`
- **Backend API**: `https://social-care-backend.onrender.com`
- **Database**: Internal connection (not publicly accessible)

## Monitoring

- Check service logs in the Render dashboard
- Monitor the health check endpoint: `https://social-care-backend.onrender.com/api/health`
- View deployment status and build logs

## Troubleshooting

### Common Issues

1. **Build Failures**:
   - Check that all dependencies are in `package.json`
   - Verify TypeScript compilation works locally

2. **Database Connection**:
   - Ensure `DATABASE_URL` environment variable is set
   - Check database service is running

3. **CORS Issues**:
   - Frontend and backend are on different domains
   - CORS is configured in the backend to allow frontend domain

### Local Testing

Before deploying, test the production build locally:

```bash
# Backend
cd backend
npm run build
npm start

# Frontend
cd frontend
npm run build
npx serve -s build
```

## Free Tier Limitations

- **Sleep Mode**: Services sleep after 15 minutes of inactivity
- **Build Minutes**: 500 minutes per month
- **Bandwidth**: 100GB per month
- **Database**: 1GB storage, 1 month retention

## Scaling

To upgrade from free tier:
1. Go to service settings in Render dashboard
2. Choose a paid plan for more resources
3. Enable auto-scaling if needed

## Support

- [Render Documentation](https://render.com/docs)
- [Render Community](https://community.render.com)