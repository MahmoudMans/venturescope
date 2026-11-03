/**
 * A small ZIP writer. It stores the files without compression, so the code stays
 * short and every ZIP program can open the result. There is no ZIP64 support, so
 * one archive can hold at most 65,535 files and 4 GB.
 */

export type ZipEntry = {
  /** A relative path with forward slashes, for example "data/models/plan/model-backup.json". */
  path: string;

  data: Uint8Array;
};

export const ZIP_MAX_ENTRIES = 0xffff;

export const ZIP_MAX_BYTES = 0xffffffff;

const LOCAL_HEADER_BYTES = 30;

const CENTRAL_HEADER_BYTES = 46;

const END_RECORD_BYTES = 22;

/** Bit 11: the file names are written in UTF-8. */
const UTF8_NAMES_FLAG = 0x0800;

const ZIP_VERSION = 20;

const textEncoder = new TextEncoder();

const CRC_TABLE: Uint32Array = (() => {
  const table = new Uint32Array(256);

  for (let index = 0; index < 256; index += 1) {
    let value = index;

    for (let bit = 0; bit < 8; bit += 1) {
      value = (value & 1) === 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
    }

    table[index] = value >>> 0;
  }

  return table;
})();

/** The CRC-32 checksum that ZIP files use, as an unsigned number. */
export function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;

  for (let index = 0; index < bytes.length; index += 1) {
    crc = CRC_TABLE[(crc ^ bytes[index]) & 0xff] ^ (crc >>> 8);
  }

  return (crc ^ 0xffffffff) >>> 0;
}

/** The date and time in the two 16-bit numbers that ZIP files use. */
export function dosDateTime(date: Date): { date: number; time: number } {
  const year = Math.min(Math.max(date.getUTCFullYear(), 1980), 2107);

  return {
    date: ((year - 1980) << 9) | ((date.getUTCMonth() + 1) << 5) | date.getUTCDate(),

    time:
      (date.getUTCHours() << 11) |
      (date.getUTCMinutes() << 5) |
      Math.floor(date.getUTCSeconds() / 2),
  };
}

/** True for a plain relative path. A path that could leave the folder is refused. */
export function isSafeZipPath(path: string): boolean {
  if (path.length === 0 || path.length > 400) {
    return false;
  }

  if (path.startsWith("/") || path.includes("\\") || /[\u0000-\u001f\u007f]/.test(path)) {
    return false;
  }

  return path.split("/").every((part) => part !== "" && part !== "." && part !== "..");
}

/** Puts the files into one ZIP archive. Every path must be safe and unique. */
export function buildZip(entries: readonly ZipEntry[], modified: Date): Uint8Array {
  if (entries.length > ZIP_MAX_ENTRIES) {
    throw new Error("There are too many files for one ZIP archive.");
  }

  const stamp = dosDateTime(modified);

  const seen = new Set<string>();

  const items = entries.map((entry) => {
    if (isSafeZipPath(entry.path) === false) {
      throw new Error(`This path cannot be used in a ZIP archive: ${entry.path}`);
    }

    const key = entry.path.toLowerCase();

    if (seen.has(key)) {
      throw new Error(`This path is used twice in a ZIP archive: ${entry.path}`);
    }

    seen.add(key);

    return {
      name: textEncoder.encode(entry.path),

      data: entry.data,

      crc: crc32(entry.data),
    };
  });

  let localBytes = 0;

  let centralBytes = 0;

  for (const item of items) {
    localBytes += LOCAL_HEADER_BYTES + item.name.length + item.data.length;

    centralBytes += CENTRAL_HEADER_BYTES + item.name.length;
  }

  const total = localBytes + centralBytes + END_RECORD_BYTES;

  if (total > ZIP_MAX_BYTES) {
    throw new Error("The ZIP archive would be larger than 4 GB.");
  }

  const output = new Uint8Array(total);

  const view = new DataView(output.buffer);

  const offsets: number[] = [];

  let position = 0;

  for (const item of items) {
    offsets.push(position);

    view.setUint32(position, 0x04034b50, true);

    view.setUint16(position + 4, ZIP_VERSION, true);

    view.setUint16(position + 6, UTF8_NAMES_FLAG, true);

    view.setUint16(position + 8, 0, true);

    view.setUint16(position + 10, stamp.time, true);

    view.setUint16(position + 12, stamp.date, true);

    view.setUint32(position + 14, item.crc, true);

    view.setUint32(position + 18, item.data.length, true);

    view.setUint32(position + 22, item.data.length, true);

    view.setUint16(position + 26, item.name.length, true);

    view.setUint16(position + 28, 0, true);

    output.set(item.name, position + LOCAL_HEADER_BYTES);

    output.set(item.data, position + LOCAL_HEADER_BYTES + item.name.length);

    position += LOCAL_HEADER_BYTES + item.name.length + item.data.length;
  }

  const centralStart = position;

  items.forEach((item, index) => {
    view.setUint32(position, 0x02014b50, true);

    view.setUint16(position + 4, ZIP_VERSION, true);

    view.setUint16(position + 6, ZIP_VERSION, true);

    view.setUint16(position + 8, UTF8_NAMES_FLAG, true);

    view.setUint16(position + 10, 0, true);

    view.setUint16(position + 12, stamp.time, true);

    view.setUint16(position + 14, stamp.date, true);

    view.setUint32(position + 16, item.crc, true);

    view.setUint32(position + 20, item.data.length, true);

    view.setUint32(position + 24, item.data.length, true);

    view.setUint16(position + 28, item.name.length, true);

    view.setUint16(position + 30, 0, true);

    view.setUint16(position + 32, 0, true);

    view.setUint16(position + 34, 0, true);

    view.setUint16(position + 36, 0, true);

    view.setUint32(position + 38, 0, true);

    view.setUint32(position + 42, offsets[index], true);

    output.set(item.name, position + CENTRAL_HEADER_BYTES);

    position += CENTRAL_HEADER_BYTES + item.name.length;
  });

  view.setUint32(position, 0x06054b50, true);

  view.setUint16(position + 4, 0, true);

  view.setUint16(position + 6, 0, true);

  view.setUint16(position + 8, items.length, true);

  view.setUint16(position + 10, items.length, true);

  view.setUint32(position + 12, centralBytes, true);

  view.setUint32(position + 16, centralStart, true);

  view.setUint16(position + 20, 0, true);

  return output;
}
