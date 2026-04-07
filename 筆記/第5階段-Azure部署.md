# 第 5 階段：Azure 雲端部署

## 為什麼需要部署？

目前專案只能在你自己的電腦上運作（localhost），別人連不進來。
部署到 Azure 後，專案會有真實的網址，任何人都能使用。

---

## Azure 架構

```
[使用者瀏覽器]
      ↓
[Azure Static Web Apps]              ← 前端（Next.js）
https://jolly-water-034d40200.6.azurestaticapps.net
      ↓ fetch（HTTPS）
[Azure App Service]                  ← 後端（C# .NET）
https://bookmark-api-app.azurewebsites.net
      ↓
[Azure Database for PostgreSQL]      ← 資料庫
bookmark-db-server.postgres.database.azure.com
```

---

## 重要概念

### 資源群組（Resource Group）
把相關的 Azure 資源放在同一個容器，方便統一管理和刪除。
```bash
az group create --name bookmark-app-rg --location eastasia
# 建立一個叫 bookmark-app-rg 的資源群組，放在東亞（香港）
```

### App Service Plan
定義後端伺服器的**硬體規格**（CPU、記憶體大小），
App Service 會在這個規格上執行你的程式。
```bash
az appservice plan create --name bookmark-plan --sku B1 --is-linux
# B1 = 最小的付費規格，--is-linux = 用 Linux 系統（.NET 在 Linux 上執行較省費用）
```

### 環境變數
敏感資訊（資料庫密碼）不能寫死在程式碼裡，
透過環境變數在部署時注入，讓本機和雲端可以用不同的設定：
```bash
az webapp config appsettings set ... --settings "ConnectionStrings__DefaultConnection=..."
# 設定後端的環境變數，覆蓋 appsettings.json 裡的設定
```
程式碼讀取時：`builder.Configuration.GetConnectionString("DefaultConnection")`
本機從 `appsettings.json` 讀，Azure 從環境變數讀，程式碼不需要改。

---

## 完整部署步驟

### 第一步：準備工作
```bash
# 安裝 Azure CLI 工具
# （從官網下載安裝）

# 登入 Azure 帳號
az login --use-device-code

# 建立資源群組（所有資源的容器）
az group create --name bookmark-app-rg --location eastasia
```

---

### 第二步：部署資料庫

```bash
# 1. 註冊 PostgreSQL 服務（新帳號需要先做這步）
az provider register --namespace Microsoft.DBforPostgreSQL

# 2. 建立 PostgreSQL 伺服器
az postgres flexible-server create \
  --resource-group bookmark-app-rg \
  --name bookmark-db-server \       # 伺服器名稱（全球唯一）
  --location eastasia \
  --admin-user pgadmin \            # 資料庫帳號
  --admin-password Bookmark@12345 \ # 資料庫密碼
  --sku-name Standard_B1ms \        # 最小規格
  --version 17                      # PostgreSQL 版本

# 3. 在伺服器裡建立資料庫
az postgres flexible-server db create \
  --resource-group bookmark-app-rg \
  --server-name bookmark-db-server \
  --database-name bookmarks_db

# 4. 開放 Azure 服務之間的連線（讓 App Service 能連資料庫）
az postgres flexible-server firewall-rule create \
  --resource-group bookmark-app-rg \
  --name bookmark-db-server \
  --rule-name AllowAzureServices \
  --start-ip-address 0.0.0.0 \
  --end-ip-address 0.0.0.0

# 5. 執行 Migration（在 Azure 資料庫建立資料表）
dotnet ef database update \
  --connection "Host=bookmark-db-server.postgres.database.azure.com;..."
```

---

### 第三步：部署後端

```bash
# 1. 打包後端（編譯成可執行的格式）
dotnet publish -c Release -o ./publish
# -c Release = 正式版本模式（比 Debug 更精簡）
# -o ./publish = 輸出到 publish 資料夾

# 2. 把 publish 資料夾手動壓縮成 publish.zip

# 3. 建立 App Service Plan（伺服器規格）
az appservice plan create \
  --name bookmark-plan \
  --resource-group bookmark-app-rg \
  --sku B1 \        # 規格
  --is-linux        # 用 Linux 系統

# 4. 建立 App Service（執行後端的容器）
az webapp create \
  --name bookmark-api-app \         # 會變成網址的一部分
  --resource-group bookmark-app-rg \
  --plan bookmark-plan \
  --runtime "DOTNETCORE:10.0"       # 指定 .NET 版本

# 5. 上傳後端程式
az webapp deploy \
  --name bookmark-api-app \
  --resource-group bookmark-app-rg \
  --src-path "c:\code learning\backend\publish.zip" \
  --type zip

# 6. 設定資料庫連線字串（環境變數）
az webapp config appsettings set \
  --name bookmark-api-app \
  --resource-group bookmark-app-rg \
  --settings "ConnectionStrings__DefaultConnection=Host=bookmark-db-server.postgres.database.azure.com;..."
```

後端網址：`https://bookmark-api-app.azurewebsites.net`

---

### 第四步：部署前端

```bash
# 1. 修改 next.config.ts，加入 output: "export"
#    讓 Next.js 產生靜態檔案（out 資料夾）

# 2. 修改 page.tsx 的 API_URL，改指向 Azure 後端網址

# 3. 更新後端 CORS，允許前端的 Azure 網址

# 4. 重新打包前端
npm run build
# 產生 out 資料夾

# 5. 建立 Azure Static Web Apps
az staticwebapp create \
  --name bookmark-frontend \
  --resource-group bookmark-app-rg \
  --location eastasia

# 6. 安裝部署工具
npm install -g @azure/static-web-apps-cli

# 7. 取得部署金鑰
$token = az staticwebapp secrets list \
  --name bookmark-frontend \
  --resource-group bookmark-app-rg \
  --query "properties.apiKey" -o tsv

# 8. 上傳前端
swa deploy ./out --deployment-token $token --env production
```

前端網址：`https://jolly-water-034d40200.6.azurestaticapps.net`

---

## 部署後修改程式碼的流程

每次修改程式碼後，需要重新部署：

### 後端有修改：
```bash
dotnet publish -c Release -o ./publish
# 手動壓縮 publish 資料夾成 publish.zip
az webapp deploy --name bookmark-api-app --resource-group bookmark-app-rg --src-path "..." --type zip
```

### 前端有修改：
```bash
npm run build
swa deploy ./out --deployment-token $token --env production
```

---

## 目前的網址

| 服務 | 網址 |
|------|------|
| 前端 | https://jolly-water-034d40200.6.azurestaticapps.net |
| 後端 API | https://bookmark-api-app.azurewebsites.net/api/bookmarks |
| 資料庫 | bookmark-db-server.postgres.database.azure.com |

---

## 學習完記得刪除資源

Azure 服務按用量計費，學習完後刪除資源群組，避免免費點數耗盡後被收費：

```bash
az group delete --name bookmark-app-rg --yes
# 這行會刪除 bookmark-app-rg 裡的所有資源（資料庫、後端、前端）
# 執行前確認你已經不需要這些資源
```
