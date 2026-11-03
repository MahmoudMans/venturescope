import {
  ArrowLeft,
  Clock,
  Crown,
  FolderOpen,
  Link2,
  LogOut,
  Mail,
  Pencil,
  Share2,
  Trash2,
  TriangleAlert,
  UserMinus,
  UserPlus,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/app/page-header";
import { StatusNotice } from "@/components/app/status-notice";
import { NativeSelect } from "@/components/forms/native-select";
import { SubmitButton } from "@/components/forms/submit-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ConfirmAction } from "@/components/workspaces/confirm-action";
import { CopyLinkButton } from "@/components/workspaces/copy-link-button";
import { RenameWorkspaceForm } from "@/components/workspaces/rename-workspace-form";
import { TransferOwnershipForm } from "@/components/workspaces/transfer-ownership-form";
import { modelInitials } from "@/lib/app/navigation";
import { requireCurrentUserIdentity } from "@/lib/auth/current-user";
import { prisma } from "@/lib/db/prisma";
import { cn } from "@/lib/utils";
import { getWorkspacePermission } from "@/lib/workspaces/access";
import {
  describeInvitationTiming,
  describeRenewDialog,
  invitationStatus,
  sortInvitations,
} from "@/lib/workspaces/invitation-state";
import { formatCount, getWorkspaceNotice, workspaceRoleLabel } from "@/lib/workspaces/labels";
import { buildTransferOptions } from "@/lib/workspaces/manage";
import { canUnshareModel, joinedLabel, sharedByLabel } from "@/lib/workspaces/people";
import { hasWorkspacePermission } from "@/lib/workspaces/permissions";

import {
  assignProjectToWorkspaceAction,
  deleteWorkspaceAction,
  inviteWorkspaceMemberAction,
  removeProjectFromWorkspaceAction,
  removeWorkspaceMemberAction,
  revokeWorkspaceInvitationAction,
  updateWorkspaceMemberRoleAction,
} from "../actions";
import { renewWorkspaceInvitationAction } from "../invitation-actions";
import { leaveWorkspaceAction } from "../leave-action";

export const metadata: Metadata = {
  title: "Workspace",

  robots: {
    index: false,

    follow: false,
  },
};

function SectionHeading({
  icon: Icon,
  title,
  description,
  tone = "primary",
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  tone?: "primary" | "danger";
}) {
  return (
    <div className="flex items-start gap-4">
      <div
        aria-hidden="true"
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-xl",
          tone === "danger"
            ? "bg-destructive/10 text-destructive"
            : "bg-accent text-accent-foreground",
        )}
      >
        <Icon className="size-5" />
      </div>

      <div className="min-w-0 space-y-1">
        <h2
          className={cn(
            "font-heading text-lg font-medium leading-snug",
            tone === "danger" ? "text-destructive" : "text-foreground",
          )}
        >
          {title}
        </h2>

        <CardDescription>{description}</CardDescription>
      </div>
    </div>
  );
}

function Avatar({ name }: { name: string }) {
  return (
    <div
      aria-hidden="true"
      className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-semibold text-accent-foreground"
    >
      {modelInitials(name)}
    </div>
  );
}

const listClassName = "divide-y rounded-xl border";

const rowClassName = "flex flex-wrap items-center gap-3 p-3";

export default async function WorkspacePage({
  params,
  searchParams,
}: {
  params: Promise<{
    workspaceId: string;
  }>;

  searchParams: Promise<{
    invite?: string;

    status?: string | string[];
  }>;
}) {
  const user = await requireCurrentUserIdentity();

  const { workspaceId } = await params;

  const permission = await getWorkspacePermission(workspaceId, user.id);

  if (permission === null) {
    notFound();
  }

  const workspace = await prisma.workspace.findUnique({
    where: {
      id: workspaceId,
    },

    include: {
      owner: {
        select: {
          id: true,

          email: true,

          name: true,
        },
      },

      members: {
        include: {
          user: {
            select: {
              email: true,

              name: true,
            },
          },
        },

        orderBy: {
          createdAt: "asc",
        },
      },

      invitations: {
        where: {
          acceptedAt: null,
        },

        orderBy: {
          createdAt: "desc",
        },

        take: 50,
      },

      projects: {
        select: {
          id: true,

          name: true,

          userId: true,

          user: {
            select: {
              email: true,

              name: true,
            },
          },
        },

        orderBy: {
          updatedAt: "desc",
        },
      },
    },
  });

  if (workspace === null) {
    notFound();
  }

  const ownedProjects = await prisma.project.findMany({
    where: {
      userId: user.id,

      OR: [
        {
          workspaceId: null,
        },

        {
          workspaceId: {
            not: workspaceId,
          },
        },
      ],
    },

    select: {
      id: true,

      name: true,
    },

    orderBy: {
      updatedAt: "desc",
    },
  });

  const { invite, status } = await searchParams;

  const notice = getWorkspaceNotice(status);

  const isOwner = permission === "OWNER";

  const canShare = hasWorkspacePermission(permission, "EDITOR");

  const ownerName = workspace.owner.name ?? workspace.owner.email;

  const transferOptions = buildTransferOptions(workspace.members);

  const now = new Date();

  const invitations = sortInvitations(workspace.invitations, now);

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 px-5 py-8 lg:px-8 lg:py-10">
      <div className="space-y-5">
        <Link
          href="/workspaces"
          className="touch-reach inline-flex items-center gap-1.5 rounded-md text-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Workspaces
        </Link>

        <PageHeader
          eyebrow={`${workspaceRoleLabel(permission)} access`}
          title={workspace.name}
          description={`Owned by ${ownerName} · ${formatCount(
            workspace.projects.length,
            "shared model",
          )} · ${formatCount(workspace.members.length + 1, "person", "people")}`}
        />
      </div>

      {notice ? <StatusNotice tone={notice.tone}>{notice.message}</StatusNotice> : null}

      {permission === "VIEWER" ? (
        <StatusNotice tone="info">
          You have view-only access. You can open the shared models but not change them. Ask the
          workspace owner if you need to edit.
        </StatusNotice>
      ) : null}

      {isOwner && invite ? (
        <Card className="border-success/30 bg-success/5 ring-success/20 [--card-spacing:--spacing(6)]">
          <CardHeader>
            <SectionHeading
              icon={Link2}
              title="Invitation link created"
              description="Share this one-time link securely with the invited person. It is shown only now: copy it before you leave this page. Any earlier link for the same email address no longer works."
            />
          </CardHeader>

          <CardContent className="space-y-4">
            <code className="block break-all rounded-lg border bg-background px-3 py-2.5 text-sm">
              {`/invite/${invite}`}
            </code>

            <CopyLinkButton path={`/invite/${invite}`} />
          </CardContent>
        </Card>
      ) : null}

      {isOwner ? (
        <Card className="[--card-spacing:--spacing(6)]">
          <CardHeader>
            <SectionHeading
              icon={UserPlus}
              title="Invite a collaborator"
              description="Create a one-time link for someone with a VentureScope account. They sign in with the email address you enter to accept it."
            />
          </CardHeader>

          <CardContent>
            <form
              action={inviteWorkspaceMemberAction}
              className="grid gap-4 sm:grid-cols-[1fr_11rem_auto] sm:items-end"
            >
              <input type="hidden" name="workspaceId" value={workspace.id} />

              <div className="space-y-2">
                <Label htmlFor="invite-email">Email address</Label>

                <Input
                  id="invite-email"
                  required
                  type="email"
                  name="email"
                  maxLength={254}
                  autoComplete="off"
                  placeholder="collaborator@example.com"
                  className="h-10"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="invite-role">Role</Label>

                <NativeSelect id="invite-role" name="role" defaultValue="EDITOR">
                  <option value="EDITOR">Editor</option>

                  <option value="VIEWER">Viewer</option>
                </NativeSelect>
              </div>

              <SubmitButton size="lg" pendingLabel="Creating...">
                Create invite
              </SubmitButton>
            </form>
          </CardContent>
        </Card>
      ) : null}

      <Card className="[--card-spacing:--spacing(6)]">
        <CardHeader>
          <SectionHeading
            icon={FolderOpen}
            title="Projects"
            description="Financial models that everyone in this workspace can open. The person who owns a model can add or remove it. The owner of the workspace can also take any model out."
          />
        </CardHeader>

        <CardContent className="space-y-5">
          {workspace.projects.length > 0 ? (
            <ul className={listClassName}>
              {workspace.projects.map((project) => {
                const isMine = project.userId === user.id;

                const canTakeOut = canUnshareModel({
                  userId: user.id,
                  modelOwnerId: project.userId,
                  workspaceOwnerId: workspace.owner.id,
                });

                return (
                  <li key={project.id} className={rowClassName}>
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/projects/${project.id}/overview`}
                        className="touch-reach block break-words text-sm font-medium hover:underline"
                      >
                        {project.name}
                      </Link>

                      {isMine ? null : (
                        <p className="break-words text-xs text-muted-foreground">
                          {sharedByLabel(project.user)}
                        </p>
                      )}
                    </div>

                    {isMine ? <Badge variant="secondary">Yours</Badge> : null}

                    {canTakeOut ? (
                      <ConfirmAction
                        action={removeProjectFromWorkspaceAction}
                        fields={{ projectId: project.id }}
                        title="Remove this model from the workspace?"
                        description={
                          isMine
                            ? `${project.name} becomes private again. Collaborators lose access to it, but the model itself is not deleted. You can share it again later.`
                            : `${project.name} becomes private again for the person who owns it. Collaborators lose access to it, but the model itself is not deleted. Its owner can share it again later.`
                        }
                        confirmLabel="Remove from workspace"
                        triggerVariant="ghost"
                      >
                        Remove
                        <span className="sr-only"> {project.name} from workspace</span>
                      </ConfirmAction>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed p-8 text-center">
              <FolderOpen className="size-7 text-muted-foreground" aria-hidden="true" />

              <p className="text-sm text-muted-foreground">
                No projects have been shared with this workspace.
              </p>
            </div>
          )}

          {canShare && ownedProjects.length > 0 ? (
            <form
              action={assignProjectToWorkspaceAction}
              className="flex flex-col gap-3 border-t pt-5 sm:flex-row sm:items-end"
            >
              <input type="hidden" name="workspaceId" value={workspace.id} />

              <div className="flex-1 space-y-2">
                <Label htmlFor="share-project">Share one of your models</Label>

                <NativeSelect id="share-project" required name="projectId">
                  {ownedProjects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </NativeSelect>
              </div>

              <SubmitButton variant="outline" size="lg" pendingLabel="Sharing...">
                <Share2 className="size-4" aria-hidden="true" />
                Share project
              </SubmitButton>
            </form>
          ) : null}
        </CardContent>
      </Card>

      <Card className="[--card-spacing:--spacing(6)]">
        <CardHeader>
          <SectionHeading
            icon={Users}
            title="Collaborators"
            description={
              isOwner
                ? "Change what each person can do, or remove their access."
                : "People who can open the models shared in this workspace."
            }
          />
        </CardHeader>

        <CardContent>
          <ul className={listClassName}>
            <li className={rowClassName}>
              <Avatar name={ownerName} />

              <div className="min-w-0 flex-1">
                <p className="break-words text-sm font-medium">{ownerName}</p>

                <p className="break-all text-xs text-muted-foreground">{workspace.owner.email}</p>
              </div>

              <Badge>Owner</Badge>
            </li>

            {workspace.members.map((member) => {
              const name = member.user.name ?? member.user.email;

              return (
                <li key={member.id} className={rowClassName}>
                  <Avatar name={name} />

                  <div className="min-w-0 flex-1">
                    <p className="break-words text-sm font-medium">{name}</p>

                    <p className="break-words text-xs text-muted-foreground">
                      {`${member.user.email} \u00b7 ${joinedLabel(member.createdAt)}`}
                    </p>
                  </div>

                  {isOwner ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <form action={updateWorkspaceMemberRoleAction} className="flex gap-2">
                        <input type="hidden" name="workspaceId" value={workspace.id} />

                        <input type="hidden" name="memberId" value={member.id} />

                        <Label htmlFor={`role-${member.id}`} className="sr-only">
                          Role for {name}
                        </Label>

                        <NativeSelect
                          id={`role-${member.id}`}
                          name="role"
                          defaultValue={member.role}
                          className="h-9 w-28"
                        >
                          <option value="EDITOR">Editor</option>

                          <option value="VIEWER">Viewer</option>
                        </NativeSelect>

                        <SubmitButton variant="outline" pendingLabel="Saving...">
                          Save
                        </SubmitButton>
                      </form>

                      <ConfirmAction
                        action={removeWorkspaceMemberAction}
                        fields={{ workspaceId: workspace.id, memberId: member.id }}
                        title={`Remove ${name}?`}
                        description="They lose access to this workspace. The models they shared become private again, and none of them is deleted. You can invite them again later."
                        confirmLabel="Remove collaborator"
                        triggerVariant="ghost"
                        triggerClassName="text-destructive hover:text-destructive"
                      >
                        <UserMinus className="size-4" aria-hidden="true" />
                        Remove
                        <span className="sr-only"> {name}</span>
                      </ConfirmAction>
                    </div>
                  ) : (
                    <Badge variant="secondary">{workspaceRoleLabel(member.role)}</Badge>
                  )}
                </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>

      {isOwner ? (
        <Card className="[--card-spacing:--spacing(6)]">
          <CardHeader>
            <SectionHeading
              icon={Mail}
              title="Pending invitations"
              description="Links that have been created but not accepted yet. A link works for 7 days. If it was lost or has expired, create a new link. Revoke a link to stop it from working."
            />
          </CardHeader>

          <CardContent>
            {invitations.length > 0 ? (
              <ul className={listClassName}>
                {invitations.map((invitation) => {
                  const status = invitationStatus(invitation.expiresAt, now);

                  const renewDialog = describeRenewDialog(invitation.emailNormalized, status);

                  return (
                    <li key={invitation.id} className={rowClassName}>
                      <div className="min-w-0 flex-1">
                        <p className="break-all text-sm font-medium">{invitation.emailNormalized}</p>

                        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Clock className="size-3" aria-hidden="true" />
                          {describeInvitationTiming(invitation.expiresAt, now)}
                        </p>
                      </div>

                      {status === "expired" ? <Badge variant="warning">Expired</Badge> : null}

                      <Badge variant="secondary">{workspaceRoleLabel(invitation.role)}</Badge>

                      <ConfirmAction
                        action={renewWorkspaceInvitationAction}
                        fields={{ workspaceId: workspace.id, invitationId: invitation.id }}
                        title={renewDialog.title}
                        description={renewDialog.description}
                        confirmLabel="Create new link"
                        confirmVariant="default"
                      >
                        <Link2 className="size-3.5" aria-hidden="true" />
                        New link
                        <span className="sr-only"> for {invitation.emailNormalized}</span>
                      </ConfirmAction>

                      <ConfirmAction
                        action={revokeWorkspaceInvitationAction}
                        fields={{ workspaceId: workspace.id, invitationId: invitation.id }}
                        title="Revoke this invitation?"
                        description={
                          status === "pending"
                            ? `The link for ${invitation.emailNormalized} stops working immediately. You can create a new invitation at any time.`
                            : `The expired link for ${invitation.emailNormalized} is removed from this list. You can create a new invitation at any time.`
                        }
                        confirmLabel="Revoke invitation"
                        triggerVariant="ghost"
                        triggerClassName="text-destructive hover:text-destructive"
                      >
                        Revoke
                        <span className="sr-only">
                          {" "}
                          invitation for {invitation.emailNormalized}
                        </span>
                      </ConfirmAction>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                No pending invitations.
              </p>
            )}
          </CardContent>
        </Card>
      ) : null}

      {isOwner ? (
        <Card id="rename" className="[--card-spacing:--spacing(6)]">
          <CardHeader>
            <SectionHeading
              icon={Pencil}
              title="Workspace name"
              description="Everyone in the workspace sees the new name straight away, in the Workspaces list and on the shared models."
            />
          </CardHeader>

          <CardContent>
            <RenameWorkspaceForm workspaceId={workspace.id} currentName={workspace.name} />
          </CardContent>
        </Card>
      ) : null}

      {isOwner ? (
        <Card id="transfer" className="[--card-spacing:--spacing(6)]">
          <CardHeader>
            <SectionHeading
              icon={Crown}
              title="Transfer ownership"
              description="Give this workspace to one of its collaborators. You stay in the workspace as an editor."
            />
          </CardHeader>

          <CardContent>
            {transferOptions.length > 0 ? (
              <TransferOwnershipForm workspaceId={workspace.id} options={transferOptions} />
            ) : (
              <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                Nobody else has joined this workspace. Invite a collaborator first. After they
                accept, you can give the workspace to them.
              </p>
            )}
          </CardContent>
        </Card>
      ) : null}

      {isOwner ? (
        <Card className="border-destructive/40 bg-destructive/5 ring-destructive/20 [--card-spacing:--spacing(6)]">
          <CardHeader>
            <SectionHeading
              tone="danger"
              icon={TriangleAlert}
              title="Delete workspace"
              description="Projects are returned to their personal owners; the financial models themselves are not deleted. Collaborators lose access to the shared models. To keep the workspace for the others, transfer ownership instead."
            />
          </CardHeader>

          <CardContent>
            <ConfirmAction
              action={deleteWorkspaceAction}
              fields={{ workspaceId: workspace.id }}
              title="Delete this workspace?"
              description={`${workspace.name} is removed for everyone. Projects return to their personal owners and no financial model is deleted.`}
              confirmLabel="Delete workspace"
              triggerVariant="destructive"
              triggerSize="lg"
            >
              <Trash2 className="size-4" aria-hidden="true" />
              Delete workspace
            </ConfirmAction>
          </CardContent>
        </Card>
      ) : null}

      {isOwner === false ? (
        <Card className="[--card-spacing:--spacing(6)]">
          <CardHeader>
            <SectionHeading
              icon={LogOut}
              title="Leave workspace"
              description="You will lose access to the models shared here. Models you shared in this workspace become private again."
            />
          </CardHeader>

          <CardContent>
            <ConfirmAction
              action={leaveWorkspaceAction}
              fields={{ workspaceId: workspace.id }}
              title="Leave this workspace?"
              description={`You lose access to everything shared in ${workspace.name}. The models you shared there become private again. The owner can invite you back.`}
              confirmLabel="Leave workspace"
              triggerVariant="outline"
              triggerSize="lg"
            >
              <LogOut className="size-4" aria-hidden="true" />
              Leave workspace
            </ConfirmAction>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
