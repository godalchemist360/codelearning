// ======================================================
// next.config.ts — Next.js 框架的設定檔
// 負責：設定圖片來源、環境變數、路由規則等進階設定
// 目前是空的，之後部署到 Azure 時會用到
// ======================================================
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export", // 產生靜態檔案到 out 資料夾，方便部署到 Azure Static Web Apps
};

export default nextConfig;
