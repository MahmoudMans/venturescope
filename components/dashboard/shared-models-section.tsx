import { ArrowRight, TrendingUp } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { modelOverviewHref } from "@/lib/app/navigation";
import type { SharedModel } from "@/lib/dashboard/shared-models";
import { formatProjectUpdatedAt } from "@/lib/projects/project-dates";
import { formatCount, workspaceRoleLabel } from "@/lib/workspaces/labels";
import type { WorkspacePermission } from "@/lib/workspaces/permissions";

const roleBadge: Record<WorkspacePermission, "info" | "secondary" | "outline"> = {
  OWNER: "info",

  EDITOR: "secondary",

  VIEWER: "outline",
};

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">{label}</dt>

      <dd className="mt-1 break-words text-sm font-medium">{children}</dd>
    </div>
  );
}

/** Models other people own that are shared with the signed-in person. */
export function SharedModelsSection({ models }: { models: SharedModel[] }) {
  if (models.length === 0) {
    return null;
  }

  return (
    <section id="shared" aria-labelledby="shared-heading">
      <div className="mb-5">
        <h2 id="shared-heading" className="text-xl font-semibold tracking-tight">
          Shared with you
        </h2>

        <p className="mt-1 text-sm text-muted-foreground">
          {formatCount(models.length, "model")} from the workspaces you belong to
        </p>
      </div>

      <ul className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {models.map((model) => {
          const href = modelOverviewHref(model.id);

          return (
            <li key={model.id}>
              <Card className="h-full border-border/70 transition-shadow hover:shadow-md">
                <CardContent className="flex h-full flex-col gap-4">
                  <div className="flex items-start gap-3">
                    <div
                      aria-hidden="true"
                      className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand-gradient text-white"
                    >
                      <TrendingUp className="size-4" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <Link
                        href={href}
                        className="touch-reach block break-words font-semibold tracking-tight hover:underline"
                      >
                        {model.name}
                      </Link>

                      <p className="mt-1 break-words text-xs text-muted-foreground">
                        {model.industry?.trim() || "Industry not specified"}
                      </p>
                    </div>

                    <Badge variant={roleBadge[model.role]}>{workspaceRoleLabel(model.role)}</Badge>
                  </div>

                  <dl className="grid grid-cols-2 gap-3 rounded-xl bg-accent/50 p-3">
                    <Fact label="Workspace">
                      <Link
                        href={`/workspaces/${model.workspaceId}`}
                        className="touch-reach inline-block hover:underline"
                      >
                        {model.workspaceName}
                      </Link>
                    </Fact>

                    <Fact label="Owner">{model.ownerName}</Fact>

                    <Fact label="Forecast">
                      {model.horizonMonths} months, {model.currency}
                    </Fact>

                    <Fact label="Updated">{formatProjectUpdatedAt(model.updatedAt)}</Fact>
                  </dl>

                  <Button asChild variant="outline" className="mt-auto w-full">
                    <Link href={href}>
                      Open shared model
                      <span className="sr-only">: {model.name}</span>
                      <ArrowRight className="size-4" aria-hidden="true" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
