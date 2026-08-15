"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const NAV_LINKS = [
  { href: "/", label: "首页" },
  { href: "/scan", label: "墙面智扫" },
  { href: "/experience/qian-xuesen", label: "钱学森故事" },
  { href: "/experience/change5", label: "嫦娥五号故事" },
  { href: "/qa", label: "延伸问答" },
  { href: "/news", label: "新闻速递" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  // 路由变化后自动收起移动端菜单（含浏览器前进/后退）
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  if (pathname.startsWith("/experience/")) return null;

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md border-b border-[rgba(214,168,79,0.15)]"
      style={{ background: "rgba(8, 14, 26, 0.85)" }}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 h-16">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <span className="text-xl font-bold tracking-wider text-[#F7F2E8] group-hover:text-[#D6A84F] transition-colors duration-300">
            科学家精神文化墙
          </span>
        </Link>

        {/* Nav links (PC) */}
        <div className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-2 rounded-lg text-sm transition-all duration-300 ${
                  isActive
                    ? "bg-[rgba(195,40,40,0.2)] text-[#F7F2E8] border border-[rgba(195,40,40,0.3)]"
                    : "text-[#B9B1A2] hover:text-[#F7F2E8] hover:bg-[rgba(255,255,255,0.04)]"
                }`}
                style={{ transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)" }}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        {/* Mobile menu toggle */}
        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          aria-label={menuOpen ? "关闭菜单" : "打开菜单"}
          aria-expanded={menuOpen}
          aria-controls="mobile-nav"
          className="md:hidden flex h-10 w-10 items-center justify-center rounded-lg text-[#B9B1A2] hover:text-[#F7F2E8] hover:bg-[rgba(255,255,255,0.04)] transition-colors"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            {menuOpen ? (
              <path d="M6 6l12 12M18 6L6 18" />
            ) : (
              <path d="M3 12h18M3 6h18M3 18h18" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile dropdown menu */}
      {menuOpen && (
        <div
          id="mobile-nav"
          className="md:hidden border-t border-[rgba(214,168,79,0.15)] px-4 py-3"
          style={{ background: "rgba(8, 14, 26, 0.97)" }}
        >
          <div className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className={`block rounded-lg px-4 py-3 text-sm transition-colors ${
                    isActive
                      ? "bg-[rgba(195,40,40,0.2)] text-[#F7F2E8] border border-[rgba(195,40,40,0.3)]"
                      : "text-[#B9B1A2] hover:text-[#F7F2E8] hover:bg-[rgba(255,255,255,0.04)]"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </nav>
  );
}
