# Farm to Fork Backend - Deployment Guide

## Environment Variables Required for Render

You need to set these environment variables in your Render dashboard:

### 1. MongoDB Connection
```
MONGO_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/farm-to-fork?retryWrites=true&w=majority
```

**How to get your MongoDB Atlas connection string:**
1. Go to [MongoDB Atlas](https://cloud.mongodb.com/)
2. Click "Connect" on your cluster
3. Choose "Connect your application"
4. Copy the connection string
5. Replace `<password>` with your database user password
6. Replace `<dbname>` with `farm-to-fork`

### 2. JWT Secret
```
JWT_SECRET=your_secure_random_string_here
```
Generate a secure random string (at least 32 characters)

### 3. Admin Credentials
```
ADMIN_EMAIL=admin@farmtofork.com
ADMIN_PASSWORD=your_secure_admin_password
ADMIN_NAME=Administrator
```

### 4. Indian Government API Key (Optional)
```
DATA_GOV_API_KEY=your_data_gov_in_api_key
```
Get from: https://data.gov.in/

### 5. Port (Render sets this automatically)
```
PORT=5000
```

## Setting Environment Variables in Render

1. Go to your Render dashboard
2. Select your backend service
3. Go to "Environment" tab
4. Click "Add Environment Variable"
5. Add each variable listed above

## MongoDB Atlas Setup

If you don't have a MongoDB Atlas cluster:

1. Go to [MongoDB Atlas](https://cloud.mongodb.com/)
2. Create a free account
3. Create a new cluster (Free tier is fine)
4. Create a database user:
   - Go to "Database Access"
   - Add new database user
   - Set username and password
   - Give "Read and write to any database" permission
5. Whitelist Render's IP:
   - Go to "Network Access"
   - Click "Add IP Address"
   - Click "Allow Access from Anywhere" (0.0.0.0/0)
   - Or add Render's specific IPs
6. Get connection string:
   - Go to "Database" → "Connect"
   - Choose "Connect your application"
   - Copy the connection string

## Troubleshooting

### Error: querySrv ENOTFOUND
This means MongoDB connection string is not set or incorrect.
- Check that MONGO_URI is set in Render environment variables
- Verify the connection string format
- Ensure your MongoDB Atlas cluster is running
- Check that IP whitelist includes 0.0.0.0/0 or Render's IPs

### Error: Authentication failed
- Check database user credentials in connection string
- Verify user has correct permissions in MongoDB Atlas

### Server starts but crashes
- Check all required environment variables are set
- Review logs in Render dashboard for specific errors
