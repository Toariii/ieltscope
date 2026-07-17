import { createHash } from "node:crypto";

export const maximumExamPdfBytes = 10 * 1024 * 1024;

export type InspectedExamPdf = {
  bytes: Uint8Array;
  byteSize: number;
  sha256: string;
};

export async function inspectExamPdf(file: File): Promise<InspectedExamPdf> {
  if (file.type !== "application/pdf") {
    throw new Error("只支持 PDF 文件");
  }
  if (file.size > maximumExamPdfBytes) {
    throw new Error("PDF 不得超过 10 MB");
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const signature = new TextDecoder("ascii").decode(bytes.slice(0, 5));
  if (signature !== "%PDF-") {
    throw new Error("文件不是有效 PDF");
  }

  return {
    bytes,
    byteSize: bytes.byteLength,
    sha256: createHash("sha256").update(bytes).digest("hex"),
  };
}
