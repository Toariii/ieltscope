import { toBandUnits, type ParseStatus } from "@ielts/contracts";

export type ParsedExamFields = {
  examDate?: string;
  overall?: number;
  listening?: number;
  reading?: number;
  writing?: number;
  speaking?: number;
};

export type ParsedExamDocument = {
  status: Extract<ParseStatus, "awaiting_confirmation" | "needs_review">;
  fields: ParsedExamFields;
  warnings: string[];
};

export type OcrAdapter = {
  extract(bytes: Uint8Array): Promise<string | null>;
};

type ParseExamPdfOptions = {
  extractText?: (bytes: Uint8Array) => Promise<string>;
  ocr?: OcrAdapter;
};

const scorePatterns = {
  overall: /(?:overall(?:\s+band\s+score)?|总分)\s*[:：]?\s*(\d(?:\.\d+)?)/i,
  listening: /(?:listening|听力)\s*[:：]?\s*(\d(?:\.\d+)?)/i,
  reading: /(?:reading|阅读)\s*[:：]?\s*(\d(?:\.\d+)?)/i,
  writing: /(?:writing|写作)\s*[:：]?\s*(\d(?:\.\d+)?)/i,
  speaking: /(?:speaking|口语)\s*[:：]?\s*(\d(?:\.\d+)?)/i,
} as const;

function extractExamDate(text: string) {
  const iso = text.match(/\b(20\d{2})[-/.](\d{1,2})[-/.](\d{1,2})\b/);
  if (iso) return `${iso[1]}-${iso[2].padStart(2, "0")}-${iso[3].padStart(2, "0")}`;

  const dayFirst = text.match(/\b(\d{1,2})[-/.](\d{1,2})[-/.](20\d{2})\b/);
  if (!dayFirst) return undefined;
  return `${dayFirst[3]}-${dayFirst[2].padStart(2, "0")}-${dayFirst[1].padStart(2, "0")}`;
}

export function parseExamText(text: string): ParsedExamDocument {
  const warnings: string[] = [];
  const fields: ParsedExamFields = { examDate: extractExamDate(text) };

  for (const [key, pattern] of Object.entries(scorePatterns)) {
    const match = text.match(pattern);
    if (!match) continue;
    try {
      fields[key as keyof typeof scorePatterns] = toBandUnits(Number(match[1]));
    } catch {
      warnings.push(`${key} 分数格式无效`);
    }
  }

  if (!fields.examDate) warnings.push("缺少考试日期");
  const scoreKeys = Object.keys(scorePatterns) as (keyof typeof scorePatterns)[];
  const missing = scoreKeys.filter((key) => fields[key] === undefined);
  if (missing.length) warnings.push(`缺少字段：${missing.join("、")}`);

  return {
    status: warnings.length ? "needs_review" : "awaiting_confirmation",
    fields,
    warnings,
  };
}

export async function extractPdfText(bytes: Uint8Array) {
  const { getDocument } = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const loadingTask = getDocument({ data: bytes, isEvalSupported: false, useWorkerFetch: false });
  const document = await loadingTask.promise;

  try {
    if (document.numPages < 1 || document.numPages > 20) {
      throw new Error("PDF 页数必须为 1–20 页");
    }
    const [javaScript, attachments] = await Promise.all([
      document.getJSActions(),
      document.getAttachments(),
    ]);
    if (javaScript && Object.keys(javaScript).length) throw new Error("PDF 包含不允许的脚本");
    if (attachments && Object.keys(attachments).length) throw new Error("PDF 包含不允许的附件");

    const pages: string[] = [];
    for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
      const page = await document.getPage(pageNumber);
      const content = await page.getTextContent();
      pages.push(
        content.items
          .filter((item): item is typeof item & { str: string } => "str" in item)
          .map((item) => item.str)
          .join(" "),
      );
    }
    return pages.join("\n").trim();
  } finally {
    await document.destroy();
  }
}

export async function parseExamPdf(
  bytes: Uint8Array,
  options: ParseExamPdfOptions = {},
): Promise<ParsedExamDocument> {
  const text = await (options.extractText ?? extractPdfText)(bytes);
  if (text.trim()) return parseExamText(text);

  const ocrText = await options.ocr?.extract(bytes);
  if (ocrText?.trim()) return parseExamText(ocrText);

  return {
    status: "needs_review",
    fields: {},
    warnings: ["扫描版 PDF 暂时无法自动读取，请手动补充分数"],
  };
}
