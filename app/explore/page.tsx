import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import AppShell from "@/components/AppShell";
import Feed from "@/components/Feed";

export default async function ExplorePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <AppShell user={user}>
      <Feed user={user} />
    </AppShell>
  );
}
