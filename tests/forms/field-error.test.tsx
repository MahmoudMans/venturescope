import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { FieldError } from "@/components/forms/field-error";
import { fieldErrorProps } from "@/lib/forms/field-errors";

describe("FieldError", () => {
  it("shows the message in a paragraph that the field can point to", () => {
    const markup = renderToStaticMarkup(
      <FieldError fieldId="startingCash" message="Must be 0 or more" />,
    );

    expect(markup.startsWith("<p ")).toBe(true);

    expect(markup).toContain('id="startingCash-error"');

    expect(markup).toContain(">Must be 0 or more</p>");
  });

  it("is red and small like the old messages", () => {
    const markup = renderToStaticMarkup(<FieldError fieldId="x" message="Wrong" />);

    expect(markup).toContain("text-sm");

    expect(markup).toContain("text-destructive");
  });

  it("shows nothing when there is no message", () => {
    expect(renderToStaticMarkup(<FieldError fieldId="x" />)).toBe("");

    expect(renderToStaticMarkup(<FieldError fieldId="x" message={undefined} />)).toBe("");

    expect(renderToStaticMarkup(<FieldError fieldId="x" message={null} />)).toBe("");

    expect(renderToStaticMarkup(<FieldError fieldId="x" message="" />)).toBe("");
  });

  it("adds the class of the caller and keeps the red text", () => {
    const markup = renderToStaticMarkup(
      <FieldError fieldId="x" message="Wrong" className="mt-3" />,
    );

    expect(markup).toContain("mt-3");

    expect(markup).toContain("text-destructive");
  });

  it("writes special characters of the message safely", () => {
    const markup = renderToStaticMarkup(<FieldError fieldId="x" message={'Use <b> & "quotes"'} />);

    expect(markup).not.toContain("<b>");

    expect(markup).toContain("Use &lt;b&gt; &amp; &quot;quotes&quot;");
  });

  it("has the id that fieldErrorProps points to, for ids with dashes and template ids", () => {
    for (const fieldId of ["settings-start-month", "rename-abc123", "fin-1-repayment-start"]) {
      const points = fieldErrorProps(fieldId, "Wrong")["aria-describedby"];

      const markup = renderToStaticMarkup(<FieldError fieldId={fieldId} message="Wrong" />);

      expect(markup).toContain(`id="${points}"`);
    }
  });

  it("does not use a live region, because the cursor moves to the field and reads the message", () => {
    const markup = renderToStaticMarkup(<FieldError fieldId="x" message="Wrong" />);

    expect(markup).not.toContain("role=");

    expect(markup).not.toContain("aria-live");
  });
});
