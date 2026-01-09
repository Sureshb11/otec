# Deployment Guide

This guide explains how to set up automated deployment to Docker Hub and Azure App Service using GitHub Actions.

## Prerequisites

1. **Docker Hub Account**
   - Create an account at https://hub.docker.com
   - Generate an access token: Account Settings → Security → New Access Token

2. **Azure Account**
   - Create an Azure account at https://azure.microsoft.com
   - Create two App Services (one for backend, one for frontend)
   - Create a Service Principal for authentication

## Setup Instructions

### 1. Create Azure App Services

#### Backend App Service:
```bash
az webapp create \
  --resource-group <your-resource-group> \
  --plan <your-app-service-plan> \
  --name otec-backend \
  --deployment-container-image-name <docker-hub-username>/otec-backend:latest
```

#### Frontend App Service:
```bash
az webapp create \
  --resource-group <your-resource-group> \
  --plan <your-app-service-plan> \
  --name otec-frontend \
  --deployment-container-image-name <docker-hub-username>/otec-frontend:latest
```

### 2. Configure App Services for Docker

Both App Services need to be configured to use Docker containers:

1. Go to Azure Portal → App Services → Your App Service
2. Go to **Configuration** → **General settings**
3. Set **Stack** to `Docker`
4. Set **Docker image** to your Docker Hub image (e.g., `yourusername/otec-backend:latest`)
5. Add Docker Hub credentials in **Container settings**

### 3. Create Azure Service Principal

```bash
az ad sp create-for-rbac --name "github-actions-otec" --role contributor \
  --scopes /subscriptions/<subscription-id>/resourceGroups/<resource-group> \
  --sdk-auth
```

Copy the JSON output - this is your `AZURE_CREDENTIALS` secret.

### 4. Configure GitHub Secrets

Go to your GitHub repository → **Settings** → **Secrets and variables** → **Actions** and add:

#### Required Secrets:

1. **DOCKER_HUB_USERNAME**
   - Your Docker Hub username

2. **DOCKER_HUB_TOKEN**
   - Your Docker Hub access token (from Docker Hub → Account Settings → Security)

3. **AZURE_WEBAPP_NAME_BACKEND**
   - Your Azure App Service name for backend (e.g., `otec-backend`)

4. **AZURE_WEBAPP_NAME_FRONTEND**
   - Your Azure App Service name for frontend (e.g., `otec-frontend`)

5. **AZURE_RESOURCE_GROUP**
   - Your Azure resource group name (e.g., `otec-rg`)

6. **AZURE_CREDENTIALS**
   - The JSON output from the Service Principal creation (entire JSON object)

### 5. Environment Variables for App Services

Configure these in Azure Portal → App Service → Configuration → Application settings:

#### Backend App Service:
```
DB_HOST=otec.postgres.database.azure.com
DB_PORT=5432
DB_USERNAME=clouduser
DB_PASSWORD=<your-db-password>
DB_DATABASE=otec_db
JWT_SECRET=<your-jwt-secret>
JWT_EXPIRES_IN=24h
NODE_ENV=production
FRONTEND_URL=https://otec-frontend.azurewebsites.net
```

#### Frontend App Service:
```
VITE_API_BASE_URL=https://otec-backend.azurewebsites.net/api
VITE_USE_MOCK_API=false
```

Note: For frontend, you may need to set these as build-time variables or use a different approach since Vite uses `import.meta.env`.

### 6. Database Configuration

Ensure your Azure PostgreSQL database:
- Allows connections from Azure services
- Has the correct firewall rules
- Has SSL enabled (which is already configured in the code)

### 7. Workflow Behavior

The workflow will:
- **On push to main/develop**: Build Docker images, push to Docker Hub, and deploy to Azure
- **On pull requests**: Only build and push Docker images (no deployment)

### 8. Manual Deployment

If you need to deploy manually:

```bash
# Build and push backend
docker build -t <docker-hub-username>/otec-backend:latest ./backend
docker push <docker-hub-username>/otec-backend:latest

# Build and push frontend
docker build -t <docker-hub-username>/otec-frontend:latest ./frontend
docker push <docker-hub-username>/otec-frontend:latest

# Restart Azure App Services
az webapp restart --name otec-backend --resource-group <resource-group>
az webapp restart --name otec-frontend --resource-group <resource-group>
```

## Troubleshooting

### Build Failures
- Check Docker Hub credentials
- Verify Dockerfile syntax
- Check build logs in GitHub Actions

### Deployment Failures
- Verify Azure credentials
- Check App Service names match secrets
- Ensure App Services are configured for Docker
- Check Azure Portal logs

### Connection Issues
- Verify database firewall rules
- Check environment variables in App Service
- Review application logs in Azure Portal

## Security Notes

- Never commit secrets to the repository
- Use GitHub Secrets for all sensitive data
- Rotate tokens regularly
- Use Azure Key Vault for production secrets (recommended)

