import { BarChart3, Calculator, ShieldCheck } from "lucide-react";

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

function ForecastPreview() {
  return (
    <div
      aria-hidden="true"
      className="mt-12 max-w-md rounded-2xl bg-black/30 p-5 ring-1 ring-white/15 backdrop-blur"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-white/75">
            24-month forecast
          </div>

          <div className="mt-2 text-3xl font-semibold tracking-tight tabular-nums">18 mo</div>

          <div className="text-xs text-white/75">Projected cash runway</div>
        </div>

        <div className="rounded-full bg-emerald-400/15 px-2.5 py-1 text-[11px] font-medium text-emerald-200 ring-1 ring-emerald-300/25">
          On track
        </div>
      </div>

      <svg viewBox="0 0 280 90" className="mt-5 h-20 w-full" fill="none" role="presentation">
        <defs>
          <linearGradient id="auth-preview-line" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#a5b4fc" />

            <stop offset="1" stopColor="#5eead4" />
          </linearGradient>

          <linearGradient id="auth-preview-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#a5b4fc" stopOpacity="0.35" />

            <stop offset="1" stopColor="#a5b4fc" stopOpacity="0" />
          </linearGradient>
        </defs>

        <path
          d="M0 70 C30 66 50 72 80 58 C110 44 130 52 160 36 C190 20 220 28 250 14 L280 8 L280 90 L0 90 Z"
          fill="url(#auth-preview-fill)"
        />

        <path
          d="M0 70 C30 66 50 72 80 58 C110 44 130 52 160 36 C190 20 220 28 250 14 L280 8"
          stroke="url(#auth-preview-line)"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>

      <div className="mt-4 grid grid-cols-3 gap-2 text-center text-[11px]">
        <div className="rounded-lg bg-white/10 px-2 py-1.5 text-white/85">Upside</div>

        <div className="rounded-lg bg-white/20 px-2 py-1.5 font-medium text-white">Expected</div>

        <div className="rounded-lg bg-white/10 px-2 py-1.5 text-white/85">Downside</div>
      </div>
    </div>
  );
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="grid min-h-svh lg:grid-cols-[1fr_1fr]">
      <section className="bg-brand-panel relative hidden overflow-hidden p-12 text-white lg:flex lg:flex-col lg:gap-10">
        <div
          aria-hidden="true"
          className="surface-grid pointer-events-none absolute inset-0 [--foreground:white] [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]"
        />

        <div className="relative z-10">
          <VentureScopeLogo tone="inverse" />
        </div>

        <div className="relative z-10 my-auto max-w-xl">
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-white/60">
            Financial planning workspace
          </div>

          <h1 className="mt-5 text-5xl font-semibold tracking-[-0.04em]">
            Build the model before making the decision.
          </h1>

          <p className="mt-6 max-w-lg text-lg leading-8 text-white/75">
            Model operating assumptions, understand cash runway and compare alternative futures from
            one structured workspace.
          </p>

          <div className="mt-10 space-y-4">
            {features.map((feature) => {
              const Icon = feature.icon;

              return (
                <div key={feature.text} className="flex items-center gap-3 text-sm text-white/85">
                  <div className="flex size-8 items-center justify-center rounded-lg bg-white/10 ring-1 ring-white/15">
                    <Icon className="size-4" aria-hidden="true" />
                  </div>

                  {feature.text}
                </div>
              );
            })}
          </div>

          <ForecastPreview />
        </div>

        <div className="relative z-10 text-xs text-white/70">
          VentureScope · Financial Planning & Scenario Simulation
        </div>
      </section>

      <section className="surface-glow relative flex px-5 pb-10 pt-20 lg:py-12">
        <div className="absolute right-4 top-4">
          <ThemeToggle />
        </div>

        <div className="absolute left-5 top-5 lg:hidden">
          <VentureScopeLogo />
        </div>

        <div className="m-auto w-full max-w-md">{children}</div>
      </section>
    </main>
  );
}
