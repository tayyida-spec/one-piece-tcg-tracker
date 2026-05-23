import { redirect } from "next/navigation";

export default function InvitePage() {
  const code = process.env.WORKSPACE_INVITE_CODE ?? "three-hats-2026";
  redirect(`/join?code=${encodeURIComponent(code)}`);
}
