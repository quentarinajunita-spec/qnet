import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import AppShell from "@/components/AppShell";
import SearchView from "@/components/SearchView";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const { q } = await searchParams;

  return (
    <AppShell user={user}>
      <SearchView initialQuery={q ?? ""} />
    </AppShell>
  );
}
