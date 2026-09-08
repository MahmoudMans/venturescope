import {
  render,
  screen,
} from "@testing-library/react";
import {
  Wallet,
} from "lucide-react";
import {
  describe,
  expect,
  it,
} from "vitest";

import {
  FinancialKpiCard,
} from "@/components/financial/financial-kpi-card";

describe(
  "FinancialKpiCard",
  () => {
    it(
      "renders its metric and supporting detail",
      () => {
        render(
          <FinancialKpiCard
            label="Ending cash"
            value="€1.2M"
            detail="Final forecast cash balance."
            icon={
              Wallet
            }
          />,
        );

        expect(
          screen.getByText(
            "Ending cash",
          ),
        ).toBeInTheDocument();

        expect(
          screen.getByText(
            "€1.2M",
          ),
        ).toBeInTheDocument();

        expect(
          screen.getByText(
            "Final forecast cash balance.",
          ),
        ).toBeInTheDocument();
      },
    );
  },
);
