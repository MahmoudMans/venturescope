import { describe, expect, it } from "vitest";

import { decodeCsvBytes } from "@/lib/data-import/decode";

const bytes = (...values: number[]) => new Uint8Array(values);

const E_ACUTE = String.fromCharCode(0xe9);

const EURO = String.fromCharCode(0x20ac);

const REPLACEMENT = String.fromCharCode(0xfffd);

describe("decodeCsvBytes", () => {
  it("reads plain text", () => {
    expect(decodeCsvBytes(new TextEncoder().encode("period,revenue\n2027-01,5"))).toBe(
      "period,revenue\n2027-01,5",
    );

    expect(decodeCsvBytes(bytes())).toBe("");
  });

  it("reads a file that is valid UTF-8, with accents and the euro sign", () => {
    const text = `R${E_ACUTE}duction ${EURO}`;

    expect(decodeCsvBytes(new TextEncoder().encode(text))).toBe(text);
  });

  it("removes the byte order mark of a UTF-8 file", () => {
    expect(decodeCsvBytes(bytes(0xef, 0xbb, 0xbf, 0x61, 0x2c, 0x62))).toBe("a,b");
  });

  it("reads a file from Excel with French settings (Windows-1252) with its accents", () => {
    const file = bytes(0x52, 0xe9, 0x64, 0x75, 0x63, 0x74, 0x69, 0x6f, 0x6e);

    expect(decodeCsvBytes(file)).toBe(`R${E_ACUTE}duction`);
  });

  it("never gives a broken character for a file that is not UTF-8", () => {
    for (const file of [bytes(0xe9), bytes(0xe2, 0x82), bytes(0x61, 0xff, 0x62), bytes(0xc3)]) {
      expect(decodeCsvBytes(file).includes(REPLACEMENT), JSON.stringify(Array.from(file))).toBe(
        false,
      );
    }
  });

  it("does not take a file for UTF-16 when only its first byte is the one of a byte order mark", () => {
    expect(decodeCsvBytes(bytes(0xff, 0x61))).toBe(`${String.fromCharCode(0xff)}a`);

    expect(decodeCsvBytes(bytes(0xfe, 0x61))).toBe(`${String.fromCharCode(0xfe)}a`);
  });

  it("reads Unicode Text of Excel (UTF-16 with tabs) and removes the byte order mark", () => {
    const file = bytes(0xff, 0xfe, 0x61, 0x00, 0x09, 0x00, 0x62, 0x00, 0xe9, 0x00);

    expect(decodeCsvBytes(file)).toBe(`a\tb${E_ACUTE}`);
  });

  it("reads a UTF-16 file that has only the byte order mark", () => {
    expect(decodeCsvBytes(bytes(0xff, 0xfe))).toBe("");

    expect(decodeCsvBytes(bytes(0xfe, 0xff))).toBe("");
  });

  it("reads UTF-16 that starts with the other byte order", () => {
    expect(decodeCsvBytes(bytes(0xfe, 0xff, 0x00, 0x61, 0x00, 0xe9))).toBe(`a${E_ACUTE}`);
  });
});
