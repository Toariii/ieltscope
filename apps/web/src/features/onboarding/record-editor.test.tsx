import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { RecordEditor } from "./record-editor";

describe("RecordEditor", () => {
  it("uses neutral source and processing labels", () => {
    render(
      <RecordEditor
        documents={[
          {
            id: "document-1",
            originalFilename: "score.pdf",
            byteSize: 1000,
            status: "needs_review",
            fields: {
              examDate: "",
              overall: null,
              listening: null,
              reading: null,
              writing: null,
              speaking: null,
            },
            warnings: ["请手动补充分数"],
            createdAt: "2026-07-16T00:00:00Z",
          },
        ]}
        records={[
          {
            id: "record-1",
            sourceType: "manual",
            sourceDocumentId: null,
            examDate: "2026-06-20",
            overall: 6.5,
            listening: 7,
            reading: 6.5,
            writing: 6,
            speaking: 6,
          },
        ]}
        onUpload={vi.fn()}
        onAddManual={vi.fn()}
        onDeleteManual={vi.fn()}
        onConfirmDocument={vi.fn()}
        onDeleteDocument={vi.fn()}
      />,
    );

    expect(screen.getByText("手动记录")).toBeVisible();
    expect(screen.getByText("需要人工处理")).toBeVisible();
    expect(screen.queryByText(/已核验|可信度/)).not.toBeInTheDocument();
  });
});
