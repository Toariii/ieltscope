import { describe, expect, it } from "vitest";

import { parseExamPdf, parseExamText } from "./exam-document-parser";

const completeReport = `
  Test Date 20/06/2026
  Listening 7.0
  Reading 6.5
  Writing 6.0
  Speaking 6.0
  Overall Band Score 6.5
`;

describe("exam document parser", () => {
  it("extracts a complete score report as reference data", () => {
    expect(parseExamText(completeReport)).toEqual({
      status: "awaiting_confirmation",
      fields: {
        examDate: "2026-06-20",
        overall: 13,
        listening: 14,
        reading: 13,
        writing: 12,
        speaking: 12,
      },
      warnings: [],
    });
  });

  it("supports Chinese field labels", () => {
    const result = parseExamText(
      "考试日期 2026-06-20 总分 6.5 听力 7 阅读 6.5 写作 6 口语 6",
    );

    expect(result.status).toBe("awaiting_confirmation");
    expect(result.fields.listening).toBe(14);
  });

  it("sends missing or invalid scores to manual review", () => {
    const result = parseExamText("Test Date 20/06/2026 Overall 7.0 Listening 9.7");

    expect(result.status).toBe("needs_review");
    expect(result.warnings).toEqual(
      expect.arrayContaining(["listening 分数格式无效", expect.stringContaining("缺少字段")]),
    );
  });

  it("uses OCR only when a PDF has no text layer", async () => {
    const result = await parseExamPdf(new Uint8Array([1, 2, 3]), {
      extractText: async () => "",
      ocr: { extract: async () => completeReport },
    });

    expect(result.status).toBe("awaiting_confirmation");
    expect(result.fields.overall).toBe(13);
  });

  it("does not invent data when OCR is unavailable", async () => {
    const result = await parseExamPdf(new Uint8Array([1, 2, 3]), {
      extractText: async () => "",
      ocr: { extract: async () => null },
    });

    expect(result).toEqual({
      status: "needs_review",
      fields: {},
      warnings: ["扫描版 PDF 暂时无法自动读取，请手动补充分数"],
    });
  });
});
