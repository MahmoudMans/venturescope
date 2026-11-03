import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(path, "utf8");

/** The text without spaces and line breaks. */
const squash = (text: string) => text.replace(/\s+/g, "");

const previewText = read("components/data-import/import-preview.tsx");

const preview = squash(previewText);

const helperText = read("lib/data-import/preview-list.ts");

const helper = squash(helperText);

const workbenchText = read("components/data-import/data-import-workbench.tsx");

const workbench = squash(workbenchText);

const readme = read("README.md");

function readmeSection(title: string): string {
  const start = readme.indexOf(`## ${title}\n`);

  if (start === -1) {
    return "";
  }

  const next = readme.indexOf("\n## ", start + 1);

  return readme.slice(start, next === -1 ? readme.length : next);
}

describe("the numbers and the words of the preview", () => {
  it("has the numbers of the fold and of a long value", () => {
    expect(helper).toContain("exportconstFIRST_PREVIEW_ROWS_SHOWN=2;");

    expect(helper).toContain("exportconstFEWEST_PREVIEW_ROWS_HIDDEN=1;");

    expect(helper).toContain("exportconstLONGEST_SHORT_VALUE=24;");
  });

  it("folds a preview only when the button hides at least one row", () => {
    expect(helper).toContain("returntotal>=FIRST_PREVIEW_ROWS_SHOWN+FEWEST_PREVIEW_ROWS_HIDDEN;");

    expect(helper).toContain(
      "if(isFolded(total)&&expanded===false){returnFIRST_PREVIEW_ROWS_SHOWN;}returntotal;",
    );
  });

  it("gives words for the button only when there is a fold, with 'row' for one", () => {
    expect(helper).toContain(
      'if(isFolded(total)===false){returnnull;}if(expanded){return"Showfewerrows";}consthidden=total-FIRST_PREVIEW_ROWS_SHOWN;return`Show${hidden}more${hidden===1?"row":"rows"}`;',
    );
  });

  it("names a row from 1, says empty for a blank value, and measures a long value", () => {
    expect(helper).toContain("return`Previewrow${index+1}`;");

    expect(helper).toContain('returnvalue===""?"(empty)":value;');

    expect(helper).toContain("returnvalue.length>LONGEST_SHORT_VALUE;");
  });

  it("uses only plain ASCII characters", () => {
    expect(/^[\x00-\x7f]*$/.test(helperText)).toBe(true);

    expect(/^[\x00-\x7f]*$/.test(previewText)).toBe(true);
  });
});

describe("the state of the preview", () => {
  it("is a client component with rows that start folded", () => {
    expect(previewText.startsWith('"use client";\n')).toBe(true);

    expect(preview).toContain("const[expanded,setExpanded]=useState(false);");

    expect(preview).toContain('import{useEffect,useRef,useState}from"react";');
  });

  it("starts short again when the file has new rows", () => {
    expect(preview).toContain("const[seen,setSeen]=useState(rows);");

    expect(preview).toContain("if(seen!==rows){setSeen(rows);setExpanded(false);}");
  });

  it("takes the rows and the words of the button from the helper", () => {
    expect(preview).toContain("constinView=rows.slice(0,previewRowsInView(rows.length,expanded));");

    expect(preview).toContain("consttoggle=describePreviewToggle(rows.length,expanded);");

    expect(preview).toContain(
      'import{describePreviewRow,describePreviewToggle,describePreviewValue,isLongPreviewValue,previewRowsInView,}from"@/lib/data-import/preview-list";',
    );
  });

  it("brings the button back into view when the rows are folded again", () => {
    expect(preview).toContain(
      'useEffect(()=>{if(expanded===false&&foldedByButton.current){foldedByButton.current=false;buttonBox.current?.scrollIntoView({block:"end"});}},[expanded]);',
    );

    expect(preview).toContain("constbuttonBox=useRef<HTMLDivElement>(null);");

    expect(preview).toContain("constfoldedByButton=useRef(false);");
  });
});

describe("the blocks of the preview", () => {
  it("are a list below the wide screen, one block for each row that is in view", () => {
    expect(preview).toContain('<uldata-slot="import-preview-list"className="divide-yxl:hidden">');

    expect(previewText.split("inView.map(").length - 1).toBe(1);

    expect(preview).toContain('<likey={index}className="@containerspace-y-2px-3py-3">');
  });

  it("name the row and give the name of every column above its value", () => {
    expect(preview).toContain('<pclassName="text-xsfont-medium">{describePreviewRow(index)}</p>');

    expect(preview).toContain('<dtclassName="break-wordstext-muted-foreground">{header}</dt>');

    expect(preview).toContain("{describePreviewValue(value)}");

    expect(preview).toContain('constvalue=row[header]??"";');
  });

  it("have 2, 3 or 4 columns by the width of the block, and a long value has a whole line", () => {
    expect(preview).toContain(
      '<dlclassName="gridgrid-cols-2gap-x-3gap-y-2text-xs@sm:grid-cols-3@lg:grid-cols-4">',
    );

    expect(preview).toContain(
      'className={isLongPreviewValue(value)?"col-span-2min-w-0":"min-w-0"}',
    );
  });

  it("let a long value or a long name break, and show an empty value in a quiet color", () => {
    expect(preview).toContain(
      'className={value===""?"break-wordstext-muted-foreground":"break-words"}',
    );
  });

  it("have a key for each row and each value", () => {
    expect(preview).toContain("<divkey={header}");

    expect(previewText.split("key={header}").length - 1).toBe(3);

    expect(previewText.split("key={index}").length - 1).toBe(2);
  });
});

describe("the button under the blocks", () => {
  it("is shown only when there is a fold, and only below the wide screen", () => {
    expect(preview).toContain("{toggle===null?null:(");

    expect(preview).toContain(
      '<divref={buttonBox}data-slot="import-preview-toggle"className="border-tp-3xl:hidden">',
    );
  });

  it("is a full-width button that does not send a form", () => {
    expect(preview).toContain(
      '<Buttontype="button"variant="outline"size="lg"className="w-full"onClick={()=>{foldedByButton.current=expanded;setExpanded(expanded===false);}}>',
    );
  });

  it("has an arrow that points up when the rows are open, and the words from the helper", () => {
    expect(preview).toContain(
      '<ChevronDownaria-hidden="true"className={expanded?"rotate-180":undefined}/>{toggle}',
    );

    expect(preview).toContain('import{ChevronDown}from"lucide-react";');

    expect(preview).toContain('import{Button}from"@/components/ui/button";');
  });
});

describe("the table of the preview", () => {
  it("is in the box that scrolls with the keyboard, from the wide screen, with every row", () => {
    expect(preview).toContain(
      '<divdata-slot="import-preview-table-box"className="hiddenxl:block"><ScrollRegionlabel="Preview">',
    );

    expect(preview).toContain(
      '<tabledata-slot="import-preview-table"className="w-fullmin-w-[900px]text-xs">',
    );

    expect(preview).toContain("{rows.map((row,index)=>(");
  });

  it("has the same header and cells as before", () => {
    expect(preview).toContain('<thkey={header}className="px-3py-2text-left">');

    expect(preview).toContain('<trclassName="border-bbg-muted/30">');

    expect(preview).toContain('<tdkey={header}className="max-w-xsbreak-wordspx-3py-2">');

    expect(preview).toContain('{row[header]??""}');
  });

  it("comes after the blocks and their button", () => {
    expect(preview.indexOf("</ul>")).toBeGreaterThan(-1);

    expect(preview.indexOf("</ul>")).toBeLessThan(preview.indexOf("<ScrollRegion"));

    expect(preview.indexOf("import-preview-toggle")).toBeLessThan(preview.indexOf("<ScrollRegion"));
  });

  it("switches at the same width as the list of problems", () => {
    expect(previewText.split("xl:hidden").length - 1).toBe(2);

    expect(previewText.split("xl:block").length - 1).toBe(1);

    expect(previewText).not.toContain("md:hidden");
  });
});

describe("the import screen", () => {
  it("shows the preview once, with the headers and the rows of the result", () => {
    expect(workbenchText.split("<ImportPreview").length - 1).toBe(1);

    expect(workbench).toContain(
      "<ImportPreviewheaders={validation.result.headers}rows={validation.result.preview}/>",
    );

    expect(workbench).toContain(
      'import{ImportPreview,}from"@/components/data-import/import-preview";',
    );
  });

  it("keeps the title of the section and its words about the first eight rows", () => {
    expect(workbench).toContain('<h3className="font-semibold">Preview</h3>');

    expect(workbenchText).toContain("First eight rows only.");
  });

  it("no longer has its own table of the preview", () => {
    expect(workbenchText).not.toContain("min-w-[900px]");

    expect(workbenchText).not.toContain('<ScrollRegion label="Preview">');
  });

  it("puts the preview between the list of problems and the form that applies the import", () => {
    expect(workbenchText.indexOf("<ImportIssueList")).toBeLessThan(
      workbenchText.indexOf("<ImportPreview"),
    );

    expect(workbenchText.indexOf("<ImportPreview")).toBeLessThan(
      workbenchText.indexOf("Apply validated import"),
    );
  });
});

describe("the README", () => {
  const section = readmeSection("Preview rows you can read on a phone");

  it("explains the problem, the blocks, the fold, the table and the limits", () => {
    for (const piece of [
      "The Preview in the Data Import Center (the first 8 rows of the file) was a table 900px wide",
      "236px (a 320px phone), 276px (360px) or 306px (390px)",
      "74%, 69% and 66% of it was hidden",
      "Only 3 of the 10 columns of an Actuals file were in view",
      "1 or 2 of the 5 columns of a KPI file",
      "2 or 3 of the 9 columns of a variance file",
      "At 768px it hid 25%, and at 1024px",
      "it hid 52%",
      "The same table fits from 1536px",
      "**Blocks below 1280px:**",
      "`components/data-import/import-preview.tsx` shows each row as a block",
      '"Preview row 1"',
      "A value of more than 24 characters has a whole line",
      'says "(empty)"',
      "does not match the row numbers of the problems",
      "**Columns by the width of the block:**",
      "2 columns on a phone, 3 columns when the block is 384px wide and 4 columns from 512px",
      "(a container query)",
      "At 768px the Preview is 465px tall with 2 rows (4 columns), and 545px at 1024px",
      "**First 2 rows, then a button:**",
      "a block is about 240px of page on a phone",
      '"Show 6 more rows"',
      '"Show fewer rows"',
      "629px tall on a 320px, 360px or 390px phone",
      "(2075px with all 8 rows)",
      "A preview of 2 rows or fewer is shown whole",
      "`FIRST_PREVIEW_ROWS_SHOWN` and `FEWEST_PREVIEW_ROWS_HIDDEN`",
      "**Like the list of problems:**",
      "44px tall on a touch screen",
      "the page is scrolled back to the button when the rows are folded",
      "a new file starts with 2 rows again",
      "the box that is hidden has `display: none`",
      "**Table from 1280px:**",
      '(`ScrollRegion`, named "Preview")',
      "688px wide at 1280px, 774px at 1366px and 848px at 1440px",
      "hides 24%, 14% and 6% there, as before",
      "It hides nothing from 1536px",
      "**The problems table fits:**",
      "688px wide at 1280px in the real layout",
      "the import history was still a wide table when this was written",
      "320px, 360px, 390px, 768px, 1024px, 1280px, 1366px, 1440px, 1536px and 1920px",
      "the migration count stays at 17",
    ]) {
      expect(squash(section).toLowerCase(), piece).toContain(squash(piece).toLowerCase());
    }
  });

  it("names its two test files", () => {
    for (const name of [
      "tests/data-import/preview-list.test.ts",
      "tests/data-import/preview-list-source.test.ts",
    ]) {
      expect(section, name).toContain(`\`${name}\``);
    }
  });

  it("comes after the section about ten problems first and before the download section", () => {
    const before = readme.indexOf("## Ten problems first on a phone");

    const here = readme.indexOf("## Preview rows you can read on a phone");

    const download = readme.indexOf("## Download your data");

    expect(before).toBeGreaterThan(-1);

    expect(here).toBeGreaterThan(before);

    expect(download).toBeGreaterThan(here);
  });
});
