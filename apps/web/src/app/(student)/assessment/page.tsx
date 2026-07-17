import type { Metadata } from "next";

import { AssessmentRunner } from "@/features/assessment/assessment-runner";
import {
  getAssessmentSnapshot,
  getAuthenticatedAssessmentStudentId,
} from "@/features/assessment/assessment-server";

import styles from "./assessment.module.css";

export const metadata: Metadata = { title: "能力诊断 | IELTScope" };

export default async function AssessmentPage() {
  const userId = await getAuthenticatedAssessmentStudentId();
  const snapshot = await getAssessmentSnapshot(userId);

  return (
    <main className={styles.page}>
      <header><a href="/dashboard">IELT<span>Scope</span><small>AI 雅思提分系统</small></a><span>免费基础诊断</span></header>
      <AssessmentRunner initialSnapshot={snapshot} />
    </main>
  );
}
