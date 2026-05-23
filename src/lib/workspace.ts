import { prisma } from "@/lib/prisma";

const DEFAULT_WORKSPACE_NAME = "Three Hats";

export async function getWorkspaceForUser(userId: string) {
  const membership = await prisma.workspaceMember.findFirst({
    where: { userId },
    include: { workspace: true },
    orderBy: { createdAt: "asc" },
  });
  return membership;
}

export async function ensureWorkspaceForUser(userId: string, displayName?: string) {
  const existing = await getWorkspaceForUser(userId);
  if (existing) return existing;

  const inviteCode = process.env.WORKSPACE_INVITE_CODE ?? "three-hats-2026";

  const existingWorkspace = await prisma.workspace.findUnique({
    where: { inviteCode },
  });

  if (existingWorkspace) {
    const member = await prisma.workspaceMember.create({
      data: {
        workspaceId: existingWorkspace.id,
        userId,
        role: "member",
        displayName: displayName ?? null,
      },
      include: { workspace: true },
    });
    return member;
  }

  try {
    const workspace = await prisma.workspace.create({
      data: {
        name: DEFAULT_WORKSPACE_NAME,
        inviteCode,
        members: {
          create: {
            userId,
            role: "admin",
            displayName: displayName ?? null,
          },
        },
      },
      include: { members: true },
    });

    const member = workspace.members[0];
    return { ...member, workspace };
  } catch (e) {
    const code =
      e && typeof e === "object" && "code" in e ? (e as { code: string }).code : null;
    if (code !== "P2002") throw e;

    const workspace = await prisma.workspace.findUniqueOrThrow({
      where: { inviteCode },
    });

    const member = await prisma.workspaceMember.create({
      data: {
        workspaceId: workspace.id,
        userId,
        role: "member",
        displayName: displayName ?? null,
      },
      include: { workspace: true },
    });
    return member;
  }
}

export async function joinWorkspaceByInviteCode(
  userId: string,
  code: string,
  displayName?: string
) {
  const workspace = await prisma.workspace.findUnique({
    where: { inviteCode: code.trim() },
  });

  if (!workspace) {
    throw new Error("Invalid invite code");
  }

  const existing = await prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: {
        workspaceId: workspace.id,
        userId,
      },
    },
  });

  if (existing) {
    return { ...existing, workspace };
  }

  return prisma.workspaceMember.create({
    data: {
      workspaceId: workspace.id,
      userId,
      role: "member",
      displayName: displayName ?? null,
    },
    include: { workspace: true },
  });
}
