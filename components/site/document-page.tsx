import { PrintButton } from "@/components/app/print-button";
import { ContactNote } from "@/components/site/contact-note";
import type { DocumentSection } from "@/lib/site/document";
import { INFO_PAGES_UPDATED, INFO_PAGES_UPDATED_ISO } from "@/lib/site/public-pages";

/**
 * A long text page with a table of contents, used for the Privacy notice and the Terms.
 * The last section is always "Contact".
 */
export function DocumentPage({
  eyebrow,
  title,
  intro,
  sections,
  supportEmail,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  sections: readonly DocumentSection[];
  supportEmail: string | null;
}) {
  const contents = [
    ...sections.map((section) => ({ id: section.id, title: section.title })),
    { id: "contact", title: "Contact" },
  ];

  return (
    <div className="mx-auto max-w-5xl px-5 py-14 lg:px-8 lg:py-20">
      <header className="max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">{eyebrow}</p>

        <h1 className="mt-3 text-4xl font-semibold tracking-tight">{title}</h1>

        <p className="mt-4 text-base leading-7 text-muted-foreground">{intro}</p>

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-3">
          <p className="text-sm text-muted-foreground">
            Last updated <time dateTime={INFO_PAGES_UPDATED_ISO}>{INFO_PAGES_UPDATED}</time>
          </p>

          <PrintButton />
        </div>
      </header>

      <div className="mt-12 grid gap-10 lg:grid-cols-[14rem_minmax(0,1fr)] print:block">
        <nav aria-label="On this page" className="lg:sticky lg:top-24 lg:self-start print:hidden">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            On this page
          </p>

          <ol className="mt-3 space-y-1.5 border-l pl-4 text-sm">
            {contents.map((item) => (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  className="touch-target inline-flex items-center text-muted-foreground transition-colors hover:text-foreground"
                >
                  {item.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <article className="space-y-10">
          {sections.map((section) => (
            <section
              key={section.id}
              id={section.id}
              aria-labelledby={`${section.id}-title`}
            >
              <h2 id={`${section.id}-title`} className="text-xl font-semibold tracking-tight">
                {section.title}
              </h2>

              {section.paragraphs?.map((paragraph, index) => (
                <p key={`paragraph-${index}`} className="mt-3 leading-7 text-muted-foreground">
                  {paragraph}
                </p>
              ))}

              {section.bullets ? (
                <ul className="mt-3 list-disc space-y-2 pl-5 leading-7 text-muted-foreground marker:text-foreground/40">
                  {section.bullets.map((bullet, index) => (
                    <li key={`bullet-${index}`}>{bullet}</li>
                  ))}
                </ul>
              ) : null}
            </section>
          ))}

          <section id="contact" aria-labelledby="contact-title">
            <h2 id="contact-title" className="text-xl font-semibold tracking-tight">
              Contact
            </h2>

            <ContactNote email={supportEmail} className="mt-3" />
          </section>
        </article>
      </div>
    </div>
  );
}
