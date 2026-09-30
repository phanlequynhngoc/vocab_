import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { requireUser } from "@/lib/auth";
import { createFolder, deleteFolder } from "./actions";

export default async function DashboardPage() {
  const { supabase, user } = await requireUser();
  const now = new Date().toISOString();

  const [foldersResult, vocabIdsResult, dueResult, newResult] = await Promise.all([
    supabase.from("folders").select("id,name,created_at").eq("user_id", user.id).order("created_at", { ascending: false }),
    supabase.from("vocabularies").select("folder_id").eq("user_id", user.id),
    supabase.from("vocabularies").select("id", { count: "exact", head: true }).eq("user_id", user.id).not("next_review", "is", null).lte("next_review", now),
    supabase.from("vocabularies").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("state", "new"),
  ]);

  if (foldersResult.error) throw new Error(foldersResult.error.message);
  if (vocabIdsResult.error) throw new Error(vocabIdsResult.error.message);

  const counts = new Map<string, number>();
  for (const row of vocabIdsResult.data ?? []) {
    counts.set(row.folder_id, (counts.get(row.folder_id) ?? 0) + 1);
  }

  const due = dueResult.count ?? 0;
  const newWords = newResult.count ?? 0;

  return (
    <AppShell email={user.email ?? "User"}>
      <section className="grid gap-4 md:grid-cols-[1.2fr_.8fr]">
        <div className="rounded-3xl bg-zinc-900 p-6 text-white sm:p-8">
          <p className="text-sm text-zinc-300">TODAY</p>
          <h1 className="mt-2 text-3xl font-bold">Ôn tập hôm nay</h1>
          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-white/10 p-4"><div className="text-3xl font-bold">{due}</div><div className="text-sm text-zinc-300">Từ đến hạn</div></div>
            <div className="rounded-2xl bg-white/10 p-4"><div className="text-3xl font-bold">{newWords}</div><div className="text-sm text-zinc-300">Từ mới</div></div>
          </div>
          <Link href="/review" className="mt-6 inline-flex rounded-xl bg-white px-5 py-3 font-semibold text-zinc-900 hover:bg-zinc-100">Bắt đầu ôn →</Link>
        </div>

        <form action={createFolder} className="rounded-3xl border border-zinc-200 bg-white p-6">
          <h2 className="text-lg font-bold">Tạo folder</h2>
          <p className="mt-1 text-sm text-zinc-500">Ví dụ: IELTS, Engineering, Daily English.</p>
          <input name="name" required maxLength={80} placeholder="Tên folder" className="mt-5 w-full rounded-xl border border-zinc-300 px-3.5 py-3 outline-none focus:border-indigo-500" />
          <button className="mt-3 w-full rounded-xl bg-indigo-600 px-4 py-3 font-semibold text-white hover:bg-indigo-500">+ New Folder</button>
        </form>
      </section>

      <section className="mt-8">
        <div className="mb-4 flex items-end justify-between">
          <div><p className="text-sm font-semibold text-indigo-600">LIBRARY</p><h2 className="text-2xl font-bold">Vocabulary folders</h2></div>
          <span className="text-sm text-zinc-500">{foldersResult.data?.length ?? 0} folders</span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {(foldersResult.data ?? []).map((folder) => (
            <article key={folder.id} className="rounded-2xl border border-zinc-200 bg-white p-5">
              <Link href={`/folders/${folder.id}`} className="block">
                <div className="text-3xl">📁</div>
                <h3 className="mt-4 text-lg font-bold">{folder.name}</h3>
                <p className="mt-1 text-sm text-zinc-500">{counts.get(folder.id) ?? 0} words</p>
              </Link>
              <form action={deleteFolder} className="mt-4 border-t border-zinc-100 pt-3">
                <input type="hidden" name="id" value={folder.id} />
                <button className="text-sm font-medium text-red-600 hover:underline">Xóa folder</button>
              </form>
            </article>
          ))}
        </div>

        {(foldersResult.data ?? []).length === 0 && (
          <div className="rounded-2xl border border-dashed border-zinc-300 p-10 text-center text-zinc-500">Chưa có folder. Hãy tạo folder đầu tiên.</div>
        )}
      </section>
    </AppShell>
  );
}
