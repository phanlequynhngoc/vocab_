import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { requireUser } from "@/lib/auth";
import type { ReviewCard } from "@/lib/srs";
import { ReviewClient } from "./review-client";

const fields =
  "id,word,meaning,example,phonetic,part_of_speech,note,word_language,state,difficulty,stability,last_review,next_review,review_count,lapse_count";

export default async function ReviewPage({
  searchParams,
}: {
  searchParams: Promise<{ folder?: string }>;
}) {
  const { folder } = await searchParams;
  const { supabase, user } = await requireUser();
  const now = new Date().toISOString();

  let dueQuery = supabase
    .from("vocabularies")
    .select(fields)
    .eq("user_id", user.id)
    .not("next_review", "is", null)
    .lte("next_review", now)
    .order("next_review", { ascending: true })
    .limit(100);

  let newQuery = supabase
    .from("vocabularies")
    .select(fields)
    .eq("user_id", user.id)
    .eq("state", "new")
    .order("created_at", { ascending: true })
    .limit(10);

  if (folder) {
    dueQuery = dueQuery.eq("folder_id", folder);
    newQuery = newQuery.eq("folder_id", folder);
  }

  const [dueResult, newResult] = await Promise.all([dueQuery, newQuery]);
  if (dueResult.error) throw new Error(dueResult.error.message);
  if (newResult.error) throw new Error(newResult.error.message);

  const cards = [...(dueResult.data ?? []), ...(newResult.data ?? [])] as ReviewCard[];

  return (
    <AppShell email={user.email ?? "User"}>
      <div className="mb-5 flex items-center justify-between">
        <Link href={folder ? `/folders/${folder}` : "/dashboard"} className="text-sm text-zinc-500 hover:underline">← Back</Link>
        <div className="text-sm text-zinc-500">Due + tối đa 10 từ mới</div>
      </div>

      {cards.length > 0 ? (
        <ReviewClient cards={cards} />
      ) : (
        <div className="mx-auto max-w-xl rounded-3xl border border-zinc-200 bg-white p-8 text-center">
          <div className="text-5xl">🎉</div>
          <h1 className="mt-4 text-2xl font-bold">Không có từ cần ôn</h1>
          <p className="mt-2 text-zinc-500">Các từ sẽ tự xuất hiện khi đến lịch ôn tiếp theo.</p>
          <Link href="/dashboard" className="mt-6 inline-flex rounded-xl bg-zinc-900 px-5 py-3 font-semibold text-white">Về Dashboard</Link>
        </div>
      )}
    </AppShell>
  );
}
