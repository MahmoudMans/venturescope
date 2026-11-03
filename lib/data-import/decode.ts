/**
 * Reads the bytes of a file as text. A file is read as UTF-8 when it is valid UTF-8. Excel with
 * French or German settings saves "CSV (comma delimited)" in Windows-1252, where an accent is one
 * byte that is not valid UTF-8. Read as UTF-8, "Reduction" with an accent would show a broken
 * character. So a file that is not valid UTF-8 is read as Windows-1252. A text file that Excel calls
 * "Unicode Text" starts with a byte order mark and is read as UTF-16. For Arabic or other scripts,
 * save the file as "CSV UTF-8".
 */
export function decodeCsvBytes(bytes: Uint8Array): string {
  if (bytes.length >= 2 && bytes[0] === 0xff && bytes[1] === 0xfe) {
    return new TextDecoder("utf-16le").decode(bytes);
  }

  if (bytes.length >= 2 && bytes[0] === 0xfe && bytes[1] === 0xff) {
    return new TextDecoder("utf-16be").decode(bytes);
  }

  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    return new TextDecoder("windows-1252").decode(bytes);
  }
}
