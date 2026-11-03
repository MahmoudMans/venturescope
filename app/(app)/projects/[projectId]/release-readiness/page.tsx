import type {
  Metadata,
} from "next";

import {
  notFound,
} from "next/navigation";

import {
  ReleaseReadinessWorkspace,
} from "@/components/product-readiness/release-readiness-workspace";

import {
  requireCurrentUserIdentity,
} from "@/lib/auth/current-user";

import {
  getOwnedProject,
} from "@/lib/projects/project-access";


export const metadata: Metadata = {
  title:
    "Release Readiness",

  robots: {
    index:
      false,

    follow:
      false,
  },
};


export default async function ReleaseReadinessPage({
  params,
}: {
  params:
    Promise<{
      projectId:
        string;
    }>;
}) {
  const user =
    await requireCurrentUserIdentity();


  const {
    projectId,
  } =
    await params;


  const project =
    await getOwnedProject(
      user.id,
      projectId,
    );


  if (
    !project
  ) {
    notFound();
  }


  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-8 px-5 py-8 lg:px-8 lg:py-10">
      <header>
        <p className="text-sm font-medium text-muted-foreground">
          Final product evidence
        </p>

        <h1 className="mt-1 text-3xl font-semibold tracking-tight">
          Release Readiness
        </h1>

        <p className="mt-2 max-w-4xl text-sm leading-6 text-muted-foreground">
          Review the complete VentureScope capability map, enterprise governance controls, portfolio presentation storyboard, and final production-release expectations from one read-only product surface.
        </p>
      </header>

      <ReleaseReadinessWorkspace
        projectId={
          projectId
        }
        projectName={
          project.name
        }
        industry={
          project.industry ??
          ""
        }
        currency={
          project.currency
        }
        modelVersion={
          project.modelVersion
        }
      />
    </div>
  );
}
