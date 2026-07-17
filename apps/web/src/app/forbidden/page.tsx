import Link from "next/link";

export default function ForbiddenPage() {
  return (
    <main style={{ maxWidth: 560, margin: "96px auto", padding: "0 24px" }}>
      <p>权限受限</p>
      <h1>当前账号无法访问此页面</h1>
      <p>请使用已获授权的教师或管理账号。</p>
      <Link href="/">返回学习系统</Link>
    </main>
  );
}
