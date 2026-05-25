# Render Deployment Setup - Quick Fix Guide

## The Problem
Your deployment is failing with: `querySrv ENOTFOUND _mongodb._tcp.cluster0.wh5gwdo.mongodb.net`

This means the MongoDB connection string is either:
- Not set in Render environment variables
- Pointing to a non-existent or deleted MongoDB cluster
- Incorrectly formatted

## Solution: Create a New MongoDB Atlas Cluster

### Step 1: Create MongoDB Atlas Cluster (5 minutes)

1. **Go to MongoDB Atlas**: https://cloud.mongodb.com/
2. **Sign in** or create a free account
3. **Create a New Cluster**:
   - Click "Build a Database"
   - Choose "M0 FREE" tier
   - Select a cloud provider (AWS recommended)
   - Choose a region close to your Render deployment
   - Click "Create"
   - Wait 3-5 minutes for cluster to deploy

### Step 2: Create Database User

1. In MongoDB Atlas, go to **"Database Access"** (left sidebar)
2. Click **"Add New Database User"**
3. Choose **"Password"** authentication
4. Set credentials:
   - Username: `farmtofork_user`
   - Password: Click "Autogenerate Secure Password" (SAVE THIS!)
5. Database User Privileges: Select **"Read and write to any database"**
6. Click **"Add User"**

### Step 3: Configure Network Access

1. Go to **"Network Access"** (left sidebar)
2. Click **"Add IP Address"**
3. Click **"Allow Access from Anywhere"**
4. This adds `0.0.0.0/0` to the whitelist
5. Click **"Confirm"**

### Step 4: Get Connection String

1. Go to **"Database"** (left sidebar)
2. Click **"Connect"** button on your cluster
3. Choose **"Connect your application"**
4. Driver: **Node.js**, Version: **5.5 or later**
5. Copy the connection string (looks like):
   ```
   mongodb+srv://farmtofork_user:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
6. **Replace `<password>`** with the password you saved earlier
7. **Add database name** before the `?`:
   ```
   mongodb+srv://farmtofork_user:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/farm-to-fork?retryWrites=true&w=majority
   ```

### Step 5: Set Environment Variables in Render

1. Go to **Render Dashboard**: https://dashboard.render.com/
2. Select your **backend service**
3. Go to **"Environment"** tab
4. Click **"Add Environment Variable"**
5. Add these variables:

```bash
# Required - MongoDB Connection
MONGO_URI=mongodb+srv://farmtofork_user:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/farm-to-fork?retryWrites=true&w=majority

# Required - JWT Secret (change this to a random string)
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production

# Required - Admin Credentials
ADMIN_EMAIL=admin@farmtofork.com
ADMIN_PASSWORD=SecureAdminPassword123!
ADMIN_NAME=Administrator

# Optional - Indian Government API
DATA_GOV_API_KEY=579b464db66ec23bdd00000134def222aee64b8c4c651e16b6397a35

# Required - Brevo email (OTP + order notifications)
BREVO_API_KEY=your_brevo_v3_api_key
EMAIL_FROM=FarmToFork <your-verified@gmail.com>
FRONTEND_URL=https://farmtofork-frontend.vercel.app

# Optional - Port (Render sets this automatically)
PORT=5000
```

**Brevo setup (required for OTP):**
1. Sign up at https://app.brevo.com
2. **Senders & IPs → Senders** — verify the same email used in `EMAIL_FROM`
3. **SMTP & API → API Keys** — create a key and paste into `BREVO_API_KEY`
4. After deploy, open `https://your-backend.onrender.com/health` — `email` should be `"configured"`

6. Click **"Save Changes"**

### Step 6: Deploy

Render will automatically redeploy after saving environment variables.

If not, click **"Manual Deploy"** → **"Deploy latest commit"**

## Verification

After deployment, check the logs. You should see:
```
✅ MongoDB Connected Successfully!
📊 Database: farm-to-fork
🌐 Host: cluster0-shard-00-00.xxxxx.mongodb.net
Server running on port 5000
```

## Troubleshooting

### Still getting ENOTFOUND error?
- Double-check the connection string format
- Ensure password doesn't contain special characters (or URL encode them)
- Verify cluster is running in MongoDB Atlas
- Wait a few minutes after creating the cluster

### Authentication failed?
- Check username and password are correct
- Ensure database user has "Read and write" permissions
- Password might contain special characters - try URL encoding

### Connection timeout?
- Check Network Access whitelist includes 0.0.0.0/0
- Verify cluster is in "Running" state in MongoDB Atlas

## Alternative: Use a Different MongoDB Provider

If MongoDB Atlas doesn't work, try:
- **Railway**: https://railway.app/ (has built-in MongoDB)
- **Render PostgreSQL**: Switch to PostgreSQL instead
- **MongoDB Cloud Manager**: Self-hosted option

## Need Help?

Check the deployment logs in Render for specific error messages.
The new error logging will show exactly what's wrong with the connection.
