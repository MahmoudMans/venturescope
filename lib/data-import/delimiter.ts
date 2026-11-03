/** The mark between the cells of one line of a file: a comma, a semicolon or a tab. */
export type CsvDelimiter = "," | ";" | "\t";

/**
 * Finds the mark between the cells by counting the marks on the first line (the header). A header
 * is made of plain words, so its count is exact. Excel with French, German or Arabic settings saves
 * a CSV file with semicolons, because the comma is the decimal mark there. Excel can also save a
 * text file with tabs. A mark inside quotes is not counted. When nothing is found, or two marks
 * have the same count, the comma wins, as before.
 */
export function detectCsvDelimiter(input: string): CsvDelimiter {
  const counts: Record<CsvDelimiter, number> = { ",": 0, ";": 0, "\t": 0 };

  let quoted = false;

  let started = false;

  for (const character of input.replace(/^\uFEFF/u, "")) {
    if (character === '"') {
      quoted = quoted === false;

      started = true;

      continue;
    }

    if (quoted) {
      continue;
    }

    if (character === "\n" || character === "\r") {
      if (started) {
        break;
      }

      counts[","] = 0;

      counts[";"] = 0;

      counts["\t"] = 0;

      continue;
    }

    if (character === "," || character === ";" || character === "\t") {
      counts[character] += 1;

      continue;
    }

    if (character.trim() !== "") {
      started = true;
    }
  }

  let best: CsvDelimiter = ",";

  for (const candidate of [";", "\t"] as const) {
    if (counts[candidate] > counts[best]) {
      best = candidate;
    }
  }

  return best;
}

/**
 * The mark that the first line of a file declares, like "sep=;", or null. Excel writes this line
 * when it saves a file that must be opened with the same mark, and it does not show it in the sheet.
 */
export function readDeclaredDelimiter(input: string): CsvDelimiter | null {
  const text = input.charCodeAt(0) === 0xfeff ? input.slice(1) : input;

  const match = /^sep=([,;\t])[ \t]*(?:\r\n|\r|\n|$)/i.exec(text);

  return match === null ? null : (match[1] as CsvDelimiter);
}

/**
 * The marks to try for a file, best first: the mark that a "sep=" line declares, the mark found by
 * counting the first line, and then the comma, the semicolon and the tab. Counting the first line is
 * wrong when a title line stands above the table, so the reader tries the next mark until it finds
 * the column titles.
 */
export function delimiterCandidates(input: string): CsvDelimiter[] {
  const list: CsvDelimiter[] = [];

  const order: (CsvDelimiter | null)[] = [
    readDeclaredDelimiter(input),
    detectCsvDelimiter(input),
    ",",
    ";",
    "\t",
  ];

  for (const candidate of order) {
    if (candidate !== null && list.includes(candidate) === false) {
      list.push(candidate);
    }
  }

  return list;
}

/**
 * A short sentence for the person who uploads a file that does not use commas, or null for a normal
 * comma file. It tells how the file was read, so no number is read in a way that is a surprise.
 */
export function describeDelimiter(delimiter: CsvDelimiter): string | null {
  if (delimiter === ";") {
    return "This file is separated by semicolons, so a comma in a number is read as a decimal comma: 1250,50 is read as 1250.50.";
  }

  if (delimiter === "\t") {
    return "This file is separated by tabs.";
  }

  return null;
}
