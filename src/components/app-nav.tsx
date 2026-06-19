"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { ChevronDown, Menu, User, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type NavLink = { href: string; label: string };

type NavGroup = {
  label: string;
  items: NavLink[];
};

type NavEntry = NavLink | NavGroup;

function isNavGroup(entry: NavEntry): entry is NavGroup {
  return "items" in entry;
}

const navEntries: NavEntry[] = [
  { href: "/dashboard", label: "Dashboard" },
  {
    label: "Inventory",
    items: [
      { href: "/inventory", label: "Inventory" },
      { href: "/card-prices", label: "Price list" },
    ],
  },
  {
    label: "Finance",
    items: [
      { href: "/transactions", label: "Transactions" },
      { href: "/business-expenses", label: "Expenses" },
      { href: "/capital", label: "Capital" },
    ],
  },
  { href: "/quick-add", label: "Quick add" },
  { href: "/case-crack", label: "Case crack" },
  { href: "/members", label: "Members" },
  { href: "/profile", label: "Profile" },
];

function isPathActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function groupIsActive(pathname: string, group: NavGroup) {
  return group.items.some((item) => isPathActive(pathname, item.href));
}

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
    await fetch("/api/auth/sign-out", { method: "POST", credentials: "include" });
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  function linkClass(href: string, compact = false) {
    const active = isPathActive(pathname, href);
    return cn(
      "block rounded-md font-medium transition-colors",
      compact ? "px-3 py-2 text-sm" : "px-3 py-2.5 text-sm",
      active
        ? "bg-brand text-white shadow-sm shadow-brand/20"
        : "text-muted hover:bg-surface-elevated hover:text-foreground"
    );
  }

  function triggerClass(active: boolean) {
    return cn(
      "inline-flex items-center gap-1 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
      active
        ? "bg-brand text-white shadow-sm shadow-brand/20"
        : "text-muted hover:bg-surface-elevated hover:text-foreground"
    );
  }

  const profileActive = isPathActive(pathname, "/profile");

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
            {navEntries.map((entry) =>
              isNavGroup(entry) ? (
                <NavDropdown
                  key={entry.label}
                  group={entry}
                  pathname={pathname}
                  triggerClass={triggerClass(groupIsActive(pathname, entry))}
                />
              ) : (
                <Link
                  key={entry.href}
                  href={entry.href}
                  prefetch={true}
                  className={linkClass(entry.href)}
                >
                  {entry.label}
                </Link>
              )
            )}
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
              {navEntries.map((entry) =>
                isNavGroup(entry) ? (
                  <li key={entry.label}>
                    <p className="px-3 pb-1 pt-2 text-xs font-semibold uppercase tracking-wide text-muted">
                      {entry.label}
                    </p>
                    <ul className="space-y-1">
                      {entry.items.map((item) => (
                        <li key={item.href}>
                          <Link href={item.href} prefetch={true} className={linkClass(item.href, true)}>
                            {item.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </li>
                ) : (
                  <li key={entry.href}>
                    <Link href={entry.href} prefetch={true} className={linkClass(entry.href)}>
                      {entry.label}
                    </Link>
                  </li>
                )
              )}
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

function NavDropdown({
  group,
  pathname,
  triggerClass,
}: {
  group: NavGroup;
  pathname: string;
  triggerClass: string;
}) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger className={triggerClass} aria-label={`${group.label} menu`}>
        {group.label}
        <ChevronDown className="h-4 w-4 opacity-80" aria-hidden />
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="z-50 min-w-[11rem] rounded-lg border border-border bg-surface p-1 shadow-lg"
          sideOffset={6}
          align="start"
        >
          {group.items.map((item) => {
            const active = isPathActive(pathname, item.href);
            return (
              <DropdownMenu.Item key={item.href} asChild>
                <Link
                  href={item.href}
                  prefetch={true}
                  className={cn(
                    "block cursor-pointer select-none rounded-md px-3 py-2 text-sm outline-none",
                    active
                      ? "bg-brand text-white"
                      : "text-foreground hover:bg-surface-elevated focus:bg-surface-elevated"
                  )}
                >
                  {item.label}
                </Link>
              </DropdownMenu.Item>
            );
          })}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
