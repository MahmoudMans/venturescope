import {
  BarChart3,
  Calculator,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";

import { VentureScopeLogo } from "@/components/brand/venturescope-logo";
import { ThemeToggle } from "@/components/theme/theme-toggle";

const features = [
  {
    icon: Calculator,
    text: "Multi-year financial forecasts",
  },
  {
    icon: BarChart3,
    text: "Base, Bull and Bear scenarios",
  },
  {
    icon: ShieldCheck,
    text: "Private financial workspaces",
  },
];

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="grid min-h-svh lg:grid-cols-[1fr_1fr]">
      <section className="relative hidden overflow-hidden border-r bg-foreground p-12 text-background lg:flex lg:flex-col">
        <div className="absolute inset-0 bg-background/5" />

        <div className="relative z-10">
          <Link href="/">
            <VentureScopeLogo
              href=""
              className="[&_div:first-child]:bg-background [&_div:first-child]:text-foreground [&_span]:text-background [&_span:last-child]:text-background/60"
            />
          </Link>
        </div>

        <div className="relative z-10 my-auto max-w-xl">
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-background/50">
            Financial planning workspace
          </div>

          <h1 className="mt-5 text-5xl font-semibold tracking-[-0.04em]">
            Build the model before making the decision.
          </h1>

          <p className="mt-6 max-w-lg text-lg leading-8 text-background/65">
            Model operating assumptions, understand
            cash runway and compare alternative futures
            from one structured workspace.
          </p>

          <div className="mt-10 space-y-4">
            {features.map((feature) => {
              const Icon = feature.icon;

              return (
                <div
                  key={feature.text}
                  className="flex items-center gap-3 text-sm text-background/80"
                >
                  <div className="flex size-8 items-center justify-center rounded-lg bg-background/10">
                    <Icon
                      className="size-4"
                      aria-hidden="true"
                    />
                  </div>

                  {feature.text}
                </div>
              );
            })}
          </div>
        </div>

        <div className="relative z-10 text-xs text-background/40">
          VentureScope · Financial Planning & Scenario Simulation
        </div>
      </section>

      <section className="relative flex items-center justify-center px-5 py-12">
        <div className="absolute right-4 top-4">
          <ThemeToggle />
        </div>

        <div className="absolute left-5 top-5 lg:hidden">
          <VentureScopeLogo />
        </div>

        <div className="w-full max-w-md">
          {children}
        </div>
      </section>
    </main>
  );
}
