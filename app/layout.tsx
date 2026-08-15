import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "科学家精神文化长廊数字化扫描与交互平台",
  description:
    "以文化墙拍照识别为入口，进入科学家精神故事沉浸体验",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                var origWarn = console.warn;
                console.warn = function() {
                  var msg = arguments[0];
                  if (typeof msg === 'string' && msg.indexOf('THREE.Clock') !== -1) return;
                  return origWarn.apply(console, arguments);
                };
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-screen text-[#F7F2E8] antialiased">
        <Navbar />
        <main style={{ position: "relative", zIndex: 1 }}>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
