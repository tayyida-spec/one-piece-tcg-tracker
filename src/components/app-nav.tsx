"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, User, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/inventory", label: "Inventory" },
  { href: "/transactions", label: "Transactions" },
  { href: "/quick-add", label: "Quick add" },
  { href: "/import", label: "Import" },
  { href: "/profile", label: "Profile" },
];

export function AppNav({
  workspaceName,
  userName,
}: {
  workspaceName: string;
  userName: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  function linkClass(href: string) {
    const active = pathname === href || pathname.startsWith(`${href}/`);
    return cn(
      "block rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
      active
        ? "bg-brand text-white shadow-sm shadow-brand/20"
        : "text-muted hover:bg-surface-elevated hover:text-foreground"
    );
  }

  const profileActive = pathname === "/profile" || pathname.startsWith("/profile/");

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex h-16 items-center justify-between gap-2">
          <Link href="/dashboard" className="flex min-w-0 shrink items-center gap-3">
            <Image
              src="/logo.png"
              alt="Three Hats logo"
              width={40}
              height={40}
              className="shrink-0 rounded-lg ring-1 ring-brand/30"
            />
            <div className="hidden min-w-0 sm:block">
              <p className="truncate text-xs font-medium uppercase tracking-wide text-brand">
                One Piece TCG
              </p>
              <p className="truncate font-display text-base font-semibold text-foreground">
                {workspaceName}
              </p>
            </div>
          </Link>

          <nav className="hidden items-center gap-1 lg:flex" aria-label="Main">
            {links.map((link) => (
              <Link key={link.href} href={link.href} className={linkClass(link.href)}>
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex shrink-0 items-center gap-2">
            <Link
              href="/profile"
              className={cn(
                "hidden max-w-[160px] items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition-colors sm:inline-flex",
                profileActive
                  ? "border-brand/50 bg-brand-dim text-brand"
                  : "border-border text-foreground hover:border-brand/40 hover:bg-surface-elevated"
              )}
              title="Your profile"
            >
              <User className="h-4 w-4 shrink-0 text-brand" aria-hidden />
              <span className="truncate">{userName}</span>
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={signOut}
              className="hidden md:inline-flex"
            >
              Sign out
            </Button>
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-border text-foreground hover:bg-surface-elevated lg:hidden"
              aria-expanded={menuOpen}
              aria-controls="mobile-nav"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              onClick={() => setMenuOpen((o) => !o)}
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {menuOpen ? (
          <nav
            id="mobile-nav"
            className="border-t border-border pb-4 pt-2 lg:hidden"
            aria-label="Mobile"
          >
            <div className="mb-3 flex items-center gap-2 rounded-md border border-border bg-surface-elevated px-3 py-2 sm:hidden">
              <User className="h-4 w-4 text-brand" aria-hidden />
              <span className="truncate text-sm font-medium text-foreground">{userName}</span>
            </div>
            <ul className="space-y-1">
              {links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className={linkClass(link.href)}>
                    {link.label}
                  </Link>
                </li>
              ))}
              <li className="pt-2 md:hidden">
                <Button variant="outline" size="sm" className="w-full" onClick={signOut}>
                  Sign out
                </Button>
              </li>
            </ul>
          </nav>
        ) : null}
      </div>
    </header>
  );
}
