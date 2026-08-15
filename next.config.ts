import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  // 允许通过内网 IP 访问 dev 专用资源（HMR、按需加载的 chunk）。
  // 不加的话，dev 模式会拦截来自非 localhost 主机的跨域请求，
  // 导致用 IP 打开时页面能显示但按钮点击无反应。
  allowedDevOrigins: ["115.190.90.101", "9.133.5.81", "192.168.28.228"],
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
