import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import AppShell from "@/components/AppShell";
import PostDetailClient from "@/components/PostDetailClient";

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <AppShell user={user}>
      <PostDetailClient user={user} />
    </AppShell>
  );
}
