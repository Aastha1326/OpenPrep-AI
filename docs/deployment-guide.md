# 🚀 Deployment Guide

This guide describes how to deploy **OpenPrep AI** in production environments.

---

## 🗄️ PostgreSQL Configuration

For production, use a managed PostgreSQL provider. The project uses **Neon** or **Render PostgreSQL** for fully managed database hosting.

### Option A: Neon (Serverless PostgreSQL — Recommended)

1. **Create an Account**: Visit [Neon](https://neon.tech) and sign up.
2. **Create a Project**: Click **New Project**, name it `openprep-ai`, and select your preferred region.
3. **Copy Connection String**: From your project dashboard, copy the connection string:
   `postgres://alice_1234:password@ep-cool-darkness-123456.us-east-2.aws.neon.tech/openprep-ai?sslmode=require`
4. **Set Environment Variable**: Add the connection string as `DATABASE_URL` in your deployment.

### Option B: Render PostgreSQL

1. **Create an Account**: Visit [Render](https://render.com) and sign up.
2. **Create a New PostgreSQL Database**: In the Render dashboard, click **New +** → **PostgreSQL**.
3. **Configure**: Choose the free or paid tier, set the database name to `openprep`, and create.
4. **Copy Internal Connection String**: Once provisioned, copy the **Internal Database URL** from the Render dashboard.
5. **Set Environment Variable**: Add the connection string as `DATABASE_URL` in your backend service environment variables.

---

## 🌍 Deployment Options

### 1. Render Deployment (Recommended for cloud hosting)

Render allows easy Git-push automatic deployments for frontend and backend components.

#### A. Backend Web Service
1. Sign in to [Render](https://render.com/).
2. Create a new **Web Service** and connect it to your GitHub repository.
3. Set the following settings:
   * **Root Directory**: `backend`
   * **Runtime**: `Node`
   * **Build Command**: `npm install`
   * **Start Command**: `npm start`
4. Under **Advanced**, add your Production Environment Variables:
   * `PORT`: `5000`
   * `DATABASE_URL`: (Your PostgreSQL connection string from Neon/Render)
   * `JWT_SECRET`: (Random strong string)
   * `GEMINI_API_KEY`: (Your Gemini Key)

#### B. Frontend Static Site
1. Create a new **Static Site** on Render.
2. Connect to the same GitHub repository.
3. Set the following settings:
   * **Root Directory**: `frontend`
   * **Build Command**: `npm install && npm run build`
   * **Publish Directory**: `dist`
4. Add the following Environment Variable:
   * `VITE_API_URL`: (The URL of your live backend Render Web Service)

---

### 2. Railway Deployment

Railway is excellent for running containerized setups using your existing configuration:

1. Sign in to [Railway](https://railway.app/).
2. Create a new project, select **Deploy from GitHub repo**, and select your repository.
3. Define backend build attributes:
   * Railway automatically reads `backend/Dockerfile` and builds the Node container.
   * Add the required environment variables (`DATABASE_URL`, `JWT_SECRET`, `GEMINI_API_KEY`) in the Railway variables tab.
4. Define frontend build attributes:
   * Set `VITE_API_URL` pointing to your Railway backend domain.
   * Railway builds the static SPA and serves it.

---

### 3. VPS Deployment (Ubuntu VPS e.g., AWS EC2, DigitalOcean)

For full control, deploy on an Ubuntu Linux server using **PM2** and **Nginx**.

#### A. Pre-requisites
SSH into your Ubuntu server and install Node.js and Nginx:
```bash
sudo apt update
sudo apt install -y nodejs npm nginx git
sudo npm install -g pm2
```

#### B. Clone and Configure
1. Clone your project:
   ```bash
   cd /var/www
   git clone https://github.com/yourusername/OpenPrep-AI.git
   cd OpenPrep-AI
   ```
2. Setup and build the frontend:
   ```bash
   cd frontend
   # Create .env and set VITE_API_URL=https://api.yourdomain.com
   npm install
   npm run build
   # Move build files to Nginx web directory
   sudo cp -r dist/* /var/www/html/
   ```
3. Setup and run backend under PM2:
   ```bash
   cd ../backend
   # Create .env and configure DATABASE_URL, JWT_SECRET, etc.
   npm install
   pm2 start server.js --name "openprep-backend"
   pm2 save
   pm2 startup
   ```

#### C. Configure Nginx Reverse Proxy
Edit the Nginx default configuration:
```bash
sudo nano /etc/nginx/sites-available/default
```

Replace the server block with:
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Serve React Frontend static files
    location / {
        root /var/www/html;
        index index.html index.htm;
        try_files $uri $uri/ /index.html;
    }

    # Proxy API requests to Node.js Backend (port 5000)
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Validate and reload Nginx:
```bash
sudo nginx -t
sudo systemctl restart nginx
```
*(Optional) Install Let's Encrypt Certbot for SSL/HTTPS:*
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```
