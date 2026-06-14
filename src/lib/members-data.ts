import { prisma } from "@/lib/prisma";

import { createAdminClient } from "@/lib/supabase/admin";



export type MemberRow = {

  id: string;

  userId: string;

  displayName: string | null;

  role: string;

  email: string | null;

  joinedAt: string;

  isCurrentUser: boolean;

};



export async function loadWorkspaceMembers(

  workspaceId: string,

  currentUserId: string

): Promise<MemberRow[]> {

  const members = await prisma.workspaceMember.findMany({

    where: { workspaceId },

    orderBy: [{ role: "asc" }, { createdAt: "asc" }],

  });



  const emailByUserId = new Map<string, string>();

  const admin = createAdminClient();

  if (admin) {

    await Promise.all(

      members.map(async (m) => {

        try {

          const { data } = await admin.auth.admin.getUserById(m.userId);

          if (data.user?.email) emailByUserId.set(m.userId, data.user.email);

        } catch {

          /* ignore per-user lookup failures */

        }

      })

    );

  }



  return members.map((m) => ({

    id: m.id,

    userId: m.userId,

    displayName: m.displayName,

    role: m.role,

    email: emailByUserId.get(m.userId) ?? null,

    joinedAt: m.createdAt.toISOString(),

    isCurrentUser: m.userId === currentUserId,

  }));

}

