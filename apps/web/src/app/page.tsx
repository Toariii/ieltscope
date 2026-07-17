import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { PublicHome } from "@/features/marketing/public-home";
import { auth } from "@/lib/auth/server";

export default async function Home() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return <PublicHome />;
  }

  redirect("/dashboard");
}
