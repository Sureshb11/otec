# Required Secrets for CI/CD Setup

This document lists all the keys and credentials you need to obtain from Docker Hub and Azure App Service.

## 🔐 Docker Hub Secrets

### 1. DOCKER_HUB_USERNAME
**What it is:** Your Docker Hub username  
**Where to find it:**
- Your Docker Hub username (e.g., `sureshb11` or `yourusername`)
- Visible in the top-right corner when logged into https://hub.docker.com

**Example:** `sureshb11`

---

### 2. DOCKER_HUB_TOKEN
**What it is:** Docker Hub Access Token (password alternative)  
**How to create:**
1. Go to https://hub.docker.com
2. Click on your profile → **Account Settings**
3. Navigate to **Security** → **New Access Token**
4. Give it a description (e.g., "GitHub Actions CI/CD")
5. Set permissions: **Read & Write** (or **Read, Write & Delete**)
6. Click **Generate**
7. **Copy the token immediately** (you won't see it again!)

**Example:** `dckr_pat_xxxxxxxxxxxxxxxxxxxxxxxxxxxx`

**Note:** This is more secure than using your Docker Hub password.

---

## ☁️ Azure App Service Secrets

### 3. AZURE_WEBAPP_NAME_BACKEND
**What it is:** Name of your Azure App Service for the backend  
**How to find/create:**
1. Go to Azure Portal: https://portal.azure.com
2. Navigate to **App Services**
3. Create a new App Service (if not exists):
   - Click **+ Create** → **Web App**
   - Name: `otec-backend` (or your preferred name)
   - Note: App Service names must be globally unique
4. Copy the exact name from the App Service overview page

**Example:** `otec-backend` or `otec-backend-prod`

---

### 4. AZURE_WEBAPP_NAME_FRONTEND
**What it is:** Name of your Azure App Service for the frontend  
**How to find/create:**
1. Go to Azure Portal: https://portal.azure.com
2. Navigate to **App Services**
3. Create a new App Service (if not exists):
   - Click **+ Create** → **Web App**
   - Name: `otec-frontend` (or your preferred name)
4. Copy the exact name from the App Service overview page

**Example:** `otec-frontend` or `otec-frontend-prod`

---

### 5. AZURE_RESOURCE_GROUP
**What it is:** Azure Resource Group name where your App Services are located  
**How to find:**
1. Go to Azure Portal: https://portal.azure.com
2. Navigate to **Resource Groups**
3. Find the resource group containing your App Services
4. Copy the exact name

**Example:** `otec-rg` or `resource-group-1`

**Note:** If you haven't created a resource group yet:
- Create one: **Resource Groups** → **+ Create**
- Name it (e.g., `otec-rg`)
- Select your subscription and region

---

### 6. AZURE_CREDENTIALS
**What it is:** Azure Service Principal JSON (for GitHub Actions authentication)  
**How to create:**

#### Option A: Using Azure CLI (Recommended)
```bash
# Install Azure CLI if not installed: https://aka.ms/installazurecliwindows

# Login to Azure
az login

# Create Service Principal (replace with your values)
az ad sp create-for-rbac \
  --name "github-actions-otec" \
  --role contributor \
  --scopes /subscriptions/<YOUR-SUBSCRIPTION-ID>/resourceGroups/<YOUR-RESOURCE-GROUP> \
  --sdk-auth
```

**Output will look like:**
```json
{
  "clientId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "clientSecret": "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "subscriptionId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "tenantId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "activeDirectoryEndpointUrl": "https://login.microsoftonline.com",
  "resourceManagerEndpointUrl": "https://management.azure.com/",
  "activeDirectoryGraphResourceId": "https://graph.windows.net/",
  "sqlManagementEndpointUrl": "https://management.core.windows.net:8443/",
  "galleryEndpointUrl": "https://gallery.azure.com/",
  "managementEndpointUrl": "https://management.core.windows.net/"
}
```

**Copy the ENTIRE JSON object** - this is your `AZURE_CREDENTIALS` secret.

#### Option B: Using Azure Portal
1. Go to Azure Portal → **Azure Active Directory**
2. Navigate to **App registrations** → **New registration**
3. Name: `github-actions-otec`
4. Click **Register**
5. Go to **Certificates & secrets** → **New client secret**
6. Description: `GitHub Actions`
7. Expires: Choose duration (e.g., 24 months)
8. Click **Add** and **copy the secret value**
9. Go to **Subscriptions** → Select your subscription
10. Go to **Access control (IAM)** → **Add** → **Add role assignment**
11. Role: **Contributor**
12. Assign access to: **User, group, or service principal**
13. Select: `github-actions-otec`
14. Create the JSON manually:
```json
{
  "clientId": "<Application (client) ID from App registration>",
  "clientSecret": "<Secret value you copied>",
  "subscriptionId": "<Your subscription ID>",
  "tenantId": "<Directory (tenant) ID from App registration>",
  "activeDirectoryEndpointUrl": "https://login.microsoftonline.com",
  "resourceManagerEndpointUrl": "https://management.azure.com/",
  "activeDirectoryGraphResourceId": "https://graph.windows.net/",
  "sqlManagementEndpointUrl": "https://management.core.windows.net:8443/",
  "galleryEndpointUrl": "https://gallery.azure.com/",
  "managementEndpointUrl": "https://management.core.windows.net/"
}
```

---

### 7. VITE_API_BASE_URL (Optional)
**What it is:** Frontend API base URL (for building frontend with correct API endpoint)  
**Default:** `https://otec-backend.azurewebsites.net/api`  
**How to determine:**
- Your backend App Service URL + `/api`
- Format: `https://<your-backend-app-service-name>.azurewebsites.net/api`

**Example:** `https://otec-backend.azurewebsites.net/api`

**Note:** This is optional. If not set, the workflow will use the default value.

---

## 📋 Quick Checklist

### Docker Hub:
- [ ] Docker Hub username
- [ ] Docker Hub access token (created)

### Azure:
- [ ] Backend App Service name
- [ ] Frontend App Service name
- [ ] Resource Group name
- [ ] Azure Service Principal JSON (AZURE_CREDENTIALS)
- [ ] (Optional) Frontend API URL

---

## 🔒 How to Add Secrets to GitHub

1. Go to your GitHub repository: https://github.com/Sureshb11/otec
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add each secret one by one:
   - Name: `DOCKER_HUB_USERNAME`
   - Value: `your-docker-username`
   - Click **Add secret**
5. Repeat for all secrets listed above

---

## ⚠️ Security Notes

1. **Never commit secrets to your repository**
2. **Never share secrets publicly**
3. **Rotate tokens regularly** (especially Docker Hub tokens)
4. **Use least privilege** for Azure Service Principal (Contributor role is sufficient)
5. **Store secrets only in GitHub Secrets** (not in code or config files)

---

## 🧪 Testing Your Setup

After adding all secrets, you can test by:

1. Making a small change to your code
2. Committing and pushing to `main` branch
3. Go to **Actions** tab in GitHub to see the workflow run
4. Check if:
   - Docker images are built successfully
   - Images are pushed to Docker Hub
   - Deployment to Azure App Service succeeds

---

## 📞 Need Help?

If you encounter issues:

1. **Docker Hub:** Check token permissions (needs Read & Write)
2. **Azure:** Verify Service Principal has Contributor role on Resource Group
3. **GitHub Actions:** Check workflow logs in the Actions tab for detailed error messages

