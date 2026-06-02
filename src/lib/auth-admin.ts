import { AuthError } from "@/lib/auth";

export function requireAdmin(role: string) {
  if (role !== "admin") {
    throw new AuthError("Admin access required");
  }
}
