"use client";

import { FileText, Plus, Trash2, Upload, X } from "lucide-react";
import { useState, type FormEvent } from "react";

import type { ExamScoreInput, ParseStatus } from "@ielts/contracts";

import type { ExamDocumentView, ExamRecordView } from "./onboarding-types";
import styles from "./onboarding-wizard.module.css";

const scoreFields = [
  ["overall", "总分"],
  ["listening", "听力"],
  ["reading", "阅读"],
  ["writing", "写作"],
  ["speaking", "口语"],
] as const;

const statusCopy: Record<ParseStatus, string> = {
  processing: "解析中",
  awaiting_confirmation: "等待确认",
  ready: "PDF 记录已录入",
  needs_review: "需要人工处理",
  failed: "解析失败",
};

const emptyScores: ExamScoreInput = {
  examDate: "",
  overall: null,
  listening: null,
  reading: null,
  writing: null,
  speaking: null,
};

function formatScores(record: ExamScoreInput) {
  return scoreFields
    .filter(([key]) => record[key] !== null)
    .map(([key, label]) => `${label} ${record[key]?.toFixed(1)}`)
    .join(" · ");
}

function ScoreForm({
  title,
  initialValue,
  onSubmit,
  onClose,
}: {
  title: string;
  initialValue: ExamScoreInput;
  onSubmit: (value: ExamScoreInput) => Promise<void>;
  onClose: () => void;
}) {
  const [value, setValue] = useState(initialValue);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError("");
    try {
      await onSubmit(value);
      onClose();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "保存失败");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className={styles.modalBackdrop} role="presentation">
      <section className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="score-form-title">
        <header>
          <div><p>考试记录</p><h3 id="score-form-title">{title}</h3></div>
          <button type="button" aria-label="关闭成绩编辑" title="关闭" onClick={onClose}><X aria-hidden="true" /></button>
        </header>
        <form onSubmit={submit}>
          <label className={styles.fullField}>考试日期<input type="date" value={value.examDate} required onChange={(event) => setValue({ ...value, examDate: event.target.value })} /></label>
          <div className={styles.scoreGrid}>
            {scoreFields.map(([key, label]) => (
              <label key={key}>{label}<input type="number" min="0" max="9" step="0.5" value={value[key] ?? ""} onChange={(event) => setValue({ ...value, [key]: event.target.value ? Number(event.target.value) : null })} /></label>
            ))}
          </div>
          {error ? <p className={styles.formError} role="alert">{error}</p> : null}
          <footer><button type="button" className={styles.secondaryButton} onClick={onClose}>取消</button><button type="submit" className={styles.primaryButton} disabled={pending}>{pending ? "保存中..." : "保存记录"}</button></footer>
        </form>
      </section>
    </div>
  );
}

export function RecordEditor({
  documents,
  records,
  onUpload,
  onAddManual,
  onDeleteManual,
  onConfirmDocument,
  onDeleteDocument,
}: {
  documents: ExamDocumentView[];
  records: ExamRecordView[];
  onUpload: (file: File) => Promise<void>;
  onAddManual: (value: ExamScoreInput) => Promise<void>;
  onDeleteManual: (id: string) => Promise<void>;
  onConfirmDocument: (id: string, value: ExamScoreInput) => Promise<void>;
  onDeleteDocument: (id: string) => Promise<void>;
}) {
  const [manualOpen, setManualOpen] = useState(false);
  const [editingDocument, setEditingDocument] = useState<ExamDocumentView | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const total = documents.length + records.filter((record) => record.sourceType === "manual").length;

  async function upload(file: File) {
    setUploading(true);
    setError("");
    try { await onUpload(file); }
    catch (uploadError) { setError(uploadError instanceof Error ? uploadError.message : "上传失败"); }
    finally { setUploading(false); }
  }

  return (
    <div className={styles.recordEditor}>
      <label className={`${styles.uploadZone} ${total >= 5 ? styles.disabled : ""}`}>
        <Upload aria-hidden="true" />
        <strong>{uploading ? "正在处理 PDF..." : "上传成绩记录 PDF"}</strong>
        <span>支持成绩单、机构模考和教师报告，单份不超过 10 MB</span>
        <input type="file" accept="application/pdf" disabled={uploading || total >= 5} onChange={(event) => { const file = event.target.files?.[0]; if (file) void upload(file); event.currentTarget.value = ""; }} />
      </label>
      <div className={styles.recordTools}>
        <span>已添加 {total}/5 份 · 所有历史成绩只作参考</span>
        <button type="button" className={styles.textButton} disabled={total >= 5} onClick={() => setManualOpen(true)}><Plus aria-hidden="true" /> 手动添加</button>
      </div>
      {error ? <p className={styles.formError} role="alert">{error}</p> : null}

      <div className={styles.recordList}>
        {documents.map((document) => (
          <article key={document.id}>
            <FileText aria-hidden="true" />
            <div><div className={styles.recordMeta}><strong>{document.originalFilename}</strong><span>{statusCopy[document.status]}</span></div><p>{document.fields.examDate ? formatScores(document.fields) || "等待补充分数" : document.warnings[0] || "正在读取文件"}</p></div>
            <div className={styles.rowActions}>
              <a href={`/api/onboarding/documents/${document.id}`} target="_blank" rel="noreferrer">预览</a>
              {document.status !== "processing" && document.status !== "ready" ? <button type="button" onClick={() => setEditingDocument(document)}>检查分数</button> : null}
              <button type="button" aria-label={`删除 ${document.originalFilename}`} title="删除" onClick={() => void onDeleteDocument(document.id)}><Trash2 aria-hidden="true" /></button>
            </div>
          </article>
        ))}
        {records.filter((record) => record.sourceType === "manual").map((record) => (
          <article key={record.id}>
            <FileText aria-hidden="true" />
            <div><div className={styles.recordMeta}><strong>{record.examDate}</strong><span>手动记录</span></div><p>{formatScores(record)}</p></div>
            <div className={styles.rowActions}><button type="button" aria-label={`删除 ${record.examDate} 手动记录`} title="删除" onClick={() => void onDeleteManual(record.id)}><Trash2 aria-hidden="true" /></button></div>
          </article>
        ))}
      </div>

      {manualOpen ? <ScoreForm title="手动添加成绩" initialValue={emptyScores} onSubmit={onAddManual} onClose={() => setManualOpen(false)} /> : null}
      {editingDocument ? <ScoreForm title="确认 PDF 中的分数" initialValue={editingDocument.fields} onSubmit={(value) => onConfirmDocument(editingDocument.id, value)} onClose={() => setEditingDocument(null)} /> : null}
    </div>
  );
}
