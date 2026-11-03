import type { ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { PendingButton } from "@/components/forms/pending-button";

/** What the form around the button says. The test changes it to start and end the waiting. */
const formStatus = vi.hoisted(() => ({ pending: false }));

vi.mock("react-dom", () => ({
  useFormStatus: () => ({
    pending: formStatus.pending,
    data: null,
    method: null,
    action: null,
  }),
}));

function html(element: ReactElement, pending = false): string {
  formStatus.pending = pending;

  return renderToStaticMarkup(element);
}

describe("PendingButton when nothing is running", () => {
  it("is an ordinary submit button with its label", () => {
    const markup = html(<PendingButton>Save settings</PendingButton>);

    expect(markup.startsWith("<button")).toBe(true);

    expect(markup).toContain('type="submit"');

    expect(markup).toContain(">Save settings</button>");
  });

  it("can be pressed and shows no spinner", () => {
    const markup = html(<PendingButton>Save settings</PendingButton>);

    expect(markup).not.toContain("disabled");

    expect(markup).not.toContain('aria-busy="');

    expect(markup).not.toContain("<svg");
  });

  it("keeps the classes it is given and adds its busy look", () => {
    const markup = html(
      <PendingButton className="h-10 rounded-lg bg-foreground px-4">Save</PendingButton>,
    );

    expect(markup).toContain("h-10 rounded-lg bg-foreground px-4");

    expect(markup).toContain("aria-busy:opacity-60");

    expect(markup).toContain("aria-busy:cursor-progress");
  });

  it("does not change the layout of the button", () => {
    const markup = html(<PendingButton className="block w-full">Restore</PendingButton>);

    expect(markup).toContain("block w-full");

    expect(markup).not.toContain("inline-flex");

    expect(markup).not.toContain("flex ");
  });

  it("passes on other attributes", () => {
    const markup = html(
      <PendingButton name="decision" value="approve" aria-label="Approve this request">
        Approve
      </PendingButton>,
    );

    expect(markup).toContain('name="decision"');

    expect(markup).toContain('value="approve"');

    expect(markup).toContain('aria-label="Approve this request"');
  });

  it("stays a submit button, also when someone asks for another type", () => {
    const other = { type: "button" } as object;

    const markup = html(<PendingButton {...other}>Save</PendingButton>);

    expect(markup).toContain('type="submit"');

    expect(markup).not.toContain('type="button"');
  });
});

describe("PendingButton when the action is running", () => {
  it("is switched off and says that it is busy", () => {
    const markup = html(<PendingButton>Import actuals</PendingButton>, true);

    expect(markup).toContain('disabled=""');

    expect(markup).toContain('aria-busy="true"');
  });

  it("shows a hidden spinner that stops for reduced motion, and keeps the label", () => {
    const markup = html(<PendingButton>Import actuals</PendingButton>, true);

    expect(markup).toContain("<svg");

    expect(markup).toContain('aria-hidden="true"');

    expect(markup).toContain("animate-spin");

    expect(markup).toContain("motion-reduce:animate-none");

    expect(markup).toContain("Import actuals</button>");

    expect(markup.indexOf("<svg")).toBeLessThan(markup.indexOf("Import actuals"));
  });

  it("goes back to normal when the action is finished", () => {
    const running = html(<PendingButton>Close period</PendingButton>, true);

    const done = html(<PendingButton>Close period</PendingButton>, false);

    expect(running).toContain('aria-busy="true"');

    expect(done).not.toContain('aria-busy="');

    expect(done).not.toContain("disabled=");

    expect(done).not.toContain("<svg");
  });
});

describe("PendingButton that is switched off by the page", () => {
  it("stays switched off without a spinner when nothing is running", () => {
    const markup = html(<PendingButton disabled>Freeze baseline</PendingButton>);

    expect(markup).toContain('disabled=""');

    expect(markup).not.toContain('aria-busy="');

    expect(markup).not.toContain("<svg");
  });

  it("stays switched off when the page allows it, as long as the action is not running", () => {
    const markup = html(<PendingButton disabled={false}>Freeze baseline</PendingButton>);

    expect(markup).not.toContain("disabled=");
  });

  it("is switched off by the running action even when the page allows it", () => {
    const markup = html(<PendingButton disabled={false}>Freeze baseline</PendingButton>, true);

    expect(markup).toContain('disabled=""');
  });
});
