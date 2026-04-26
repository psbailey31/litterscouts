# LitterScouts Deployment Guide

**Free hosting: Render (app) + Neon (database) + UptimeRobot (keep-alive)**

## 1. Create the Database (Neon — free forever)

1. Go to https://neon.tech and sign up with GitHub
2. Create a new project called `litterscouts`
3. Copy the connection string — it looks like:
   `postgresql://user:pass@ep-something.eu-central-1.aws.neon.tech/litterscouts?sslmode=require`

## 2. Push to GitHub

```bash
cd /Volumes/Data/litter/litterscouts-prod
git add -A
git commit -m "Initial commit"
```

Create a repo on GitHub, then:
```bash
git remote add origin https://github.com/YOUR_USERNAME/litterscouts.git
git branch -M main
git push -u origin main
```

## 3. Deploy on Render (free)

1. Go to https://render.com and sign up with GitHub
2. Click **New** → **Web Service**
3. Connect your `litterscouts` repo
4. Settings:
   - **Name**: `litterscouts`
   - **Region**: Frankfurt (EU) or Oregon (US)
   - **Runtime**: Docker
   - **Instance Type**: Free
5. Add **Environment Variables**:
   - `DATABASE_URL` = your Neon connection string from step 1
   - `CLERK_SECRET_KEY` = your Clerk live secret key
   - `NODE_ENV` = `production`
   - `PORT` = `3005`
   - `OPENWEATHER_API_KEY` = your key
   - `AHASEND_API_KEY` = your key
   - `FROM_EMAIL` = `LitterScouts <noreply@psbailey.uk>`
   - `FRONTEND_URL` = `https://litterscouts.onrender.com`
   - `CORS_ORIGIN` = `https://litterscouts.onrender.com`
   - `APP_URL` = `https://litterscouts.onrender.com`
6. Under **Docker** build settings, add build arg:
   - `VITE_CLERK_PUBLISHABLE_KEY` = your Clerk live publishable key
7. Click **Deploy**

Your site will be at `https://litterscouts.onrender.com`

## 4. Prevent Sleep (UptimeRobot — free)

1. Go to https://uptimerobot.com and sign up
2. Add a new monitor:
   - **Type**: HTTP(s)
   - **URL**: `https://litterscouts.onrender.com/health`
   - **Interval**: 5 minutes
3. This keeps the app awake so there are no cold starts

## 5. Custom Domain (optional)

In Render dashboard → your service → **Settings** → **Custom Domains**:
1. Add `litterscouts.psbailey.uk`
2. Update your Cloudflare DNS to point to Render (CNAME to `litterscouts.onrender.com`)
3. Update the env vars `FRONTEND_URL`, `CORS_ORIGIN`, and `APP_URL` to use the custom domain

## Local Development

```bash
# Start local PostgreSQL
docker start litterscouts-db

# Start frontend + backend
npm run dev
```

Frontend: http://localhost:5200 | Backend: http://localhost:3005
