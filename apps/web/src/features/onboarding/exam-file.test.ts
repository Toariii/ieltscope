import { describe, expect, it } from "vitest";

import { inspectExamPdf } from "./exam-file";

function pdfFile(body = "%PDF-1.7\n%%EOF", type = "application/pdf") {
  const bytes = new TextEncoder().encode(body);
  const file = new File([bytes], "score.pdf", { type });
  Object.defineProperty(file, "arrayBuffer", {
    value: async () => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
  });
  return file;
}

describe("exam PDF intake", () => {
  it("accepts a PDF under 10 MB and returns a stable hash", async () => {
    const result = await inspectExamPdf(pdfFile());

    expect(result.byteSize).toBeGreaterThan(0);
    expect(result.sha256).toMatch(/^[a-f0-9]{64}$/);
    expect(Array.from(result.bytes.slice(0, 5))).toEqual(
      Array.from(new TextEncoder().encode("%PDF-")),
    );
  });

  it("rejects a PDF declaration with the wrong MIME", async () => {
    await expect(inspectExamPdf(pdfFile("%PDF-1.7", "text/plain"))).rejects.toThrow(
      "只支持 PDF 文件",
    );
  });

  it("rejects a fake PDF body", async () => {
    await expect(inspectExamPdf(pdfFile("not a pdf"))).rejects.toThrow("不是有效 PDF");
  });

  it("rejects files larger than 10 MB before reading the body", async () => {
    const oversized = new File([new Uint8Array(10 * 1024 * 1024 + 1)], "large.pdf", {
      type: "application/pdf",
    });

    await expect(inspectExamPdf(oversized)).rejects.toThrow("不得超过 10 MB");
  });
});
