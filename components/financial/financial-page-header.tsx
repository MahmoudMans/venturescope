import {
  Badge,
} from "@/components/ui/badge";

type FinancialPageHeaderProps = {
  eyebrow?: string;

  title: string;

  description: string;

  scenarioName?: string;
};

export function FinancialPageHeader({
  eyebrow = "Analysis",
  title,
  description,
  scenarioName = "Base Case",
}: FinancialPageHeaderProps) {
  return (
    <section className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
      <div>
        <div className="text-sm font-medium text-muted-foreground">
          {eyebrow}
        </div>

        <h2 className="mt-2 text-3xl font-semibold tracking-tight">
          {title}
        </h2>

        <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
          {description}
        </p>
      </div>

      <Badge className="w-fit">
        {
          scenarioName
        }
      </Badge>
    </section>
  );
}
