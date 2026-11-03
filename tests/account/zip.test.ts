import { describe, expect, it } from "vitest";

import {
  ZIP_MAX_ENTRIES,
  buildZip,
  crc32,
  dosDateTime,
  isSafeZipPath,
  type ZipEntry,
} from "@/lib/account/zip";

const encoder = new TextEncoder();

/** Keeps a byte order mark instead of dropping it, so the tests can see it. */
const decoder = new TextDecoder("utf-8", { ignoreBOM: true });

const MODIFIED = new Date("2026-10-16T21:30:44Z");

function entry(path: string, text: string): ZipEntry {
  return { path, data: encoder.encode(text) };
}

type ReadFile = {
  name: string;
  flags: number;
  method: number;
  crc: number;
  localCrc: number;
  size: number;
  localSize: number;
  localCompressed: number;
  localFlags: number;
  localMethod: number;
  localTime: number;
  localDate: number;
  time: number;
  date: number;
  text: string;
};

/**
 * Reads a ZIP archive by the book (the end record, the central directory, then
 * each local header), without using any code from the writer.
 */
function readZip(bytes: Uint8Array): ReadFile[] {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

  const end = bytes.length - 22;

  expect(view.getUint32(end, true)).toBe(0x06054b50);

  expect(view.getUint16(end + 4, true)).toBe(0);

  expect(view.getUint16(end + 6, true)).toBe(0);

  const count = view.getUint16(end + 8, true);

  expect(view.getUint16(end + 10, true)).toBe(count);

  const centralSize = view.getUint32(end + 12, true);

  const centralOffset = view.getUint32(end + 16, true);

  expect(centralOffset + centralSize).toBe(end);

  expect(view.getUint16(end + 20, true)).toBe(0);

  const files: ReadFile[] = [];

  let cursor = centralOffset;

  for (let index = 0; index < count; index += 1) {
    expect(view.getUint32(cursor, true)).toBe(0x02014b50);

    const nameLength = view.getUint16(cursor + 28, true);

    const extraLength = view.getUint16(cursor + 30, true);

    const commentLength = view.getUint16(cursor + 32, true);

    const size = view.getUint32(cursor + 24, true);

    expect(view.getUint32(cursor + 20, true)).toBe(size);

    const localOffset = view.getUint32(cursor + 42, true);

    expect(view.getUint32(localOffset, true)).toBe(0x04034b50);

    const localNameLength = view.getUint16(localOffset + 26, true);

    const localExtraLength = view.getUint16(localOffset + 28, true);

    const dataStart = localOffset + 30 + localNameLength + localExtraLength;

    const localName = decoder.decode(
      bytes.subarray(localOffset + 30, localOffset + 30 + localNameLength),
    );

    const name = decoder.decode(bytes.subarray(cursor + 46, cursor + 46 + nameLength));

    expect(localName).toBe(name);

    files.push({
      name,
      flags: view.getUint16(cursor + 8, true),
      method: view.getUint16(cursor + 10, true),
      crc: view.getUint32(cursor + 16, true),
      localCrc: view.getUint32(localOffset + 14, true),
      size,
      localSize: view.getUint32(localOffset + 22, true),
      localCompressed: view.getUint32(localOffset + 18, true),
      localFlags: view.getUint16(localOffset + 6, true),
      localMethod: view.getUint16(localOffset + 8, true),
      localTime: view.getUint16(localOffset + 10, true),
      localDate: view.getUint16(localOffset + 12, true),
      time: view.getUint16(cursor + 12, true),
      date: view.getUint16(cursor + 14, true),
      text: decoder.decode(bytes.subarray(dataStart, dataStart + size)),
    });

    cursor += 46 + nameLength + extraLength + commentLength;
  }

  expect(cursor).toBe(end);

  return files;
}

describe("crc32", () => {
  it("gives the standard check values", () => {
    expect(crc32(new Uint8Array(0))).toBe(0);

    expect(crc32(encoder.encode("a"))).toBe(0xe8b7be43);

    expect(crc32(encoder.encode("123456789"))).toBe(0xcbf43926);

    expect(crc32(encoder.encode("The quick brown fox jumps over the lazy dog"))).toBe(0x414fa339);
  });

  it("works on long data and on every byte value", () => {
    expect(crc32(new Uint8Array(1000))).toBe(0x060b1780);

    expect(crc32(Uint8Array.from({ length: 256 }, (_, index) => index))).toBe(0x29058c73);
  });
});

describe("dosDateTime", () => {
  it("packs the date and the time into two 16-bit numbers", () => {
    expect(dosDateTime(MODIFIED)).toEqual({ date: 23888, time: 43990 });
  });

  it("uses UTC and never goes below the year 1980", () => {
    expect(dosDateTime(new Date("1970-01-01T00:00:00Z"))).toEqual({ date: 33, time: 0 });

    expect(dosDateTime(new Date("2026-10-16T23:59:58Z"))).toEqual({
      date: 23888,
      time: (23 << 11) | (59 << 5) | 29,
    });
  });
});

describe("isSafeZipPath", () => {
  it("accepts plain relative paths", () => {
    expect(isSafeZipPath("data/models/plan/model-backup.json")).toBe(true);

    expect(isSafeZipPath("README.txt")).toBe(true);
  });

  it("refuses paths that could leave the folder or confuse a ZIP program", () => {
    for (const path of [
      "",
      "/etc/passwd",
      "../secret.txt",
      "data/../../secret.txt",
      "data/./file.txt",
      "data//file.txt",
      "data/",
      "data\\file.txt",
      "data/file\u0000.txt",
      "x".repeat(401),
    ]) {
      expect(isSafeZipPath(path)).toBe(false);
    }
  });
});

describe("buildZip", () => {
  it("writes an archive that a ZIP reader can open", () => {
    const zip = buildZip(
      [entry("data/a.txt", "Hello"), entry("data/models/b.csv", "x,y\n1,2\n")],
      MODIFIED,
    );

    const files = readZip(zip);

    expect(files.map((file) => file.name)).toEqual(["data/a.txt", "data/models/b.csv"]);

    expect(files.map((file) => file.text)).toEqual(["Hello", "x,y\n1,2\n"]);
  });

  it("stores each file without compression and with the right checksum", () => {
    const files = readZip(buildZip([entry("a.txt", "123456789"), entry("b.txt", "")], MODIFIED));

    expect(files[0].method).toBe(0);

    expect(files[0].crc).toBe(0xcbf43926);

    expect(files[0].localCrc).toBe(0xcbf43926);

    expect(files[0].size).toBe(9);

    expect(files[0].localSize).toBe(9);

    expect(files[0].localCompressed).toBe(9);

    expect(files[0].localMethod).toBe(0);

    expect(files[1].crc).toBe(0);

    expect(files[1].size).toBe(0);
  });

  it("marks the names as UTF-8 and keeps accents and other letters", () => {
    const files = readZip(buildZip([entry("data/caf\u00e9/\u6a21\u578b.txt", "ok")], MODIFIED));

    expect(files[0].name).toBe("data/caf\u00e9/\u6a21\u578b.txt");

    expect(files[0].flags & 0x0800).toBe(0x0800);

    expect(files[0].localFlags & 0x0800).toBe(0x0800);
  });

  it("keeps the bytes of text that is not ASCII", () => {
    const files = readZip(buildZip([entry("a.txt", "\ufeffna\u00efve \u20ac100")], MODIFIED));

    expect(files[0].text).toBe("\ufeffna\u00efve \u20ac100");
  });

  it("writes the modification time of every file", () => {
    const files = readZip(buildZip([entry("a.txt", "1"), entry("b.txt", "2")], MODIFIED));

    for (const file of files) {
      expect(file.date).toBe(23888);

      expect(file.time).toBe(43990);

      expect(file.localDate).toBe(23888);

      expect(file.localTime).toBe(43990);
    }
  });

  it("can hold an archive without files", () => {
    const zip = buildZip([], MODIFIED);

    expect(zip.length).toBe(22);

    expect(readZip(zip)).toEqual([]);
  });

  it("gives the same bytes for the same input", () => {
    const entries = [entry("a.txt", "one"), entry("b/c.txt", "two")];

    expect(Array.from(buildZip(entries, MODIFIED))).toEqual(
      Array.from(buildZip(entries, MODIFIED)),
    );
  });

  it("handles a file that is larger than one chunk of a typical buffer", () => {
    const big = "line of text\n".repeat(20_000);

    const files = readZip(buildZip([entry("big.txt", big)], MODIFIED));

    expect(files[0].size).toBe(big.length);

    expect(files[0].text).toBe(big);
  });

  it("refuses an unsafe path", () => {
    expect(() => buildZip([entry("../outside.txt", "x")], MODIFIED)).toThrow(
      "This path cannot be used",
    );

    expect(() => buildZip([entry("/absolute.txt", "x")], MODIFIED)).toThrow(
      "This path cannot be used",
    );
  });

  it("refuses the same path twice, even when only the letter case differs", () => {
    expect(() => buildZip([entry("a.txt", "1"), entry("a.txt", "2")], MODIFIED)).toThrow(
      "used twice",
    );

    expect(() => buildZip([entry("Plan/a.txt", "1"), entry("plan/A.txt", "2")], MODIFIED)).toThrow(
      "used twice",
    );
  });

  it("accepts exactly as many files as the format can count", () => {
    const entries = Array.from({ length: ZIP_MAX_ENTRIES }, (_, index) =>
      entry(`f${index}.txt`, ""),
    );

    const view = (zip: Uint8Array) => new DataView(zip.buffer, zip.byteOffset, zip.byteLength);

    const zip = buildZip(entries, MODIFIED);

    expect(view(zip).getUint16(zip.length - 22 + 10, true)).toBe(ZIP_MAX_ENTRIES);
  });

  it("refuses more files than the format can count", () => {
    const entries = Array.from({ length: ZIP_MAX_ENTRIES + 1 }, (_, index) =>
      entry(`f${index}.txt`, ""),
    );

    expect(() => buildZip(entries, MODIFIED)).toThrow("too many files");
  });
});
