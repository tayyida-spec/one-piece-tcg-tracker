import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/supabase/session";

export default async function HomePage() {
  const user = await getSessionUser();

  redirect(user ? "/dashboard" : "/login");
}
