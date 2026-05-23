"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/inventory", label: "Inventory" },
  { href: "/transactions", label: "Transactions" },
  { href: "/quick-add", label: "Quick add" },
  { href: "/import", label: "Import" },
];

export function AppNav({ workspaceName }: { workspaceName: string }) {
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

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex h-16 items-center justify-between gap-3">
          <Link href="/dashboard" className="flex min-w-0 items-center gap-3">
            <Image
              src="/logo.png"
              alt="Three Hats logo"
              width={40}
              height={40}
              className="shrink-0 rounded-lg ring-1 ring-brand/30"
            />
            <div className="min-w-0">
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

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={signOut}
              className="hidden sm:inline-flex"
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
            <ul className="space-y-1">
              {links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className={linkClass(link.href)}>
                    {link.label}
                  </Link>
                </li>
              ))}
              <li className="pt-2 sm:hidden">
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
