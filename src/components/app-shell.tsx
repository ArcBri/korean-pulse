"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Clock3, Settings2 } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Today", icon: Clock3 },
  { href: "/library", label: "Library", icon: BookOpen },
  { href: "/settings", label: "Settings", icon: Settings2 },
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="app-shell relative min-h-dvh">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="atmosphere-orb atmosphere-orb-a" />
        <div className="atmosphere-orb atmosphere-orb-b" />
        <div className="ink-wash" />
      </div>

      <header className="relative z-10 border-b border-[color:var(--line)]/70 bg-[color:var(--surface)]/70 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/" className="group flex items-baseline gap-3">
            <span className="font-display text-3xl tracking-tight text-[color:var(--ink)] sm:text-4xl">
              Hangul Hour
            </span>
            <span className="hidden font-hangul text-lg text-[color:var(--accent)] transition group-hover:translate-x-0.5 sm:inline">
              한글 아워
            </span>
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {NAV.map(({ href, label, icon: Icon }) => {
              const active =
                href === "/" ? pathname === "/" : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm transition",
                    active
                      ? "bg-[color:var(--accent)] text-[color:var(--accent-ink)]"
                      : "text-[color:var(--muted)] hover:bg-[color:var(--surface-strong)] hover:text-[color:var(--ink)]",
                  )}
                >
                  <Icon className="size-4" />
                  {label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      <main className="relative z-10 mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6 sm:py-10">
        {children}
      </main>

      <nav className="relative z-10 border-t border-[color:var(--line)]/70 bg-[color:var(--surface)]/90 backdrop-blur-md md:hidden">
        <div className="mx-auto grid max-w-5xl grid-cols-3">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active =
              href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex flex-col items-center gap-1 px-2 py-3 text-xs",
                  active
                    ? "text-[color:var(--accent)]"
                    : "text-[color:var(--muted)]",
                )}
              >
                <Icon className="size-5" />
                {label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
