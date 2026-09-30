import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import VocabularyForm from "@/components/VocabularyForm";
import { requireUser } from "@/lib/auth";
import { addVocabulary, deleteVocabulary, updateVocabulary } from "./actions";

export default async function FolderPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const { id } = await params;
  const { q = "" } = await searchParams;
  const { supabase, user } = await requireUser();

  const { data: folder } = await supabase.from("folders").select("id,name").eq("id", id).eq("user_id", user.id).single();
  if (!folder) notFound();

  let query = supabase
    .from("vocabularies")
    .select("id,word,meaning,example,phonetic,part_of_speech,note,state,next_review,review_count,lapse_count")
    .eq("folder_id", id)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (q.trim()) query = query.ilike("word", `%${q.trim()}%`);
  const { data: words, error } = await query;
  if (error) throw new Error(error.message);

  return (
    <AppShell email={user.email ?? "User"}>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/dashboard" className="text-sm text-zinc-500 hover:underline">← Dashboard</Link>
          <h1 className="mt-1 text-3xl font-bold">📁 {folder.name}</h1>
          <p className="mt-1 text-sm text-zinc-500">{words?.length ?? 0} words {q ? `(search: ${q})` : ""}</p>
        </div>
        <Link href={`/review?folder=${folder.id}`} className="rounded-xl bg-zinc-900 px-4 py-3 font-semibold text-white">Ôn folder này</Link>
      </div>

      <section className="grid gap-5 lg:grid-cols-[.8fr_1.2fr]">
        <div className="h-fit rounded-2xl border border-zinc-200 bg-white p-5">
          <VocabularyForm 
            folderId={folder.id}
          />
        </div>

        <div>
          <form className="mb-3 flex gap-2">
            <input name="q" defaultValue={q} placeholder="Search vocabulary..." className="min-w-0 flex-1 rounded-xl border border-zinc-300 bg-white px-3.5 py-3" />
            <button className="rounded-xl border border-zinc-300 bg-white px-4 font-semibold">Search</button>
          </form>

          <div className="space-y-3">
            {(words ?? []).map((word) => (
              <article key={word.id} className="rounded-2xl border border-zinc-200 bg-white p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-baseline gap-2">
                      <h3 className="text-xl font-bold">{word.word}</h3>
                      {word.phonetic && <span className="text-sm text-zinc-500">{word.phonetic}</span>}
                      {word.part_of_speech && <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600">{word.part_of_speech}</span>}
                    </div>
                    <p className="mt-2 font-medium">{word.meaning}</p>
                    {word.example && <p className="mt-2 text-sm italic text-zinc-600">“{word.example}”</p>}
                    {word.note && <p className="mt-2 text-sm text-zinc-500">Note: {word.note}</p>}
                  </div>
                  <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">{word.state}</span>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-zinc-100 pt-3 text-xs text-zinc-500">
                  <span>Reviews: {word.review_count}</span><span>Lapses: {word.lapse_count}</span>
                  <span>Next: {word.next_review ? new Date(word.next_review).toLocaleDateString("vi-VN") : "New"}</span>
                </div>

                <details className="mt-4">
                  <summary className="cursor-pointer text-sm font-semibold text-indigo-600">Edit</summary>
                  <form action={updateVocabulary} className="mt-3 grid gap-2 rounded-xl bg-zinc-50 p-3">
                    <input type="hidden" name="id" value={word.id} /><input type="hidden" name="folder_id" value={folder.id} />
                    <input name="word" required defaultValue={word.word} className="rounded-lg border border-zinc-300 px-3 py-2" />
                    <input name="meaning" required defaultValue={word.meaning} className="rounded-lg border border-zinc-300 px-3 py-2" />
                    <div className="grid grid-cols-2 gap-2">
                      <input name="phonetic" defaultValue={word.phonetic ?? ""} placeholder="Phonetic" className="rounded-lg border border-zinc-300 px-3 py-2" />
                      <input name="part_of_speech" defaultValue={word.part_of_speech ?? ""} placeholder="Part of speech" className="rounded-lg border border-zinc-300 px-3 py-2" />
                    </div>
                    <textarea name="example" defaultValue={word.example ?? ""} placeholder="Example" className="rounded-lg border border-zinc-300 px-3 py-2" />
                    <textarea name="note" defaultValue={word.note ?? ""} placeholder="Note" className="rounded-lg border border-zinc-300 px-3 py-2" />
                    <button className="rounded-lg bg-zinc-900 px-3 py-2 font-semibold text-white">Save</button>
                  </form>
                </details>

                <form action={deleteVocabulary} className="mt-3">
                  <input type="hidden" name="id" value={word.id} /><input type="hidden" name="folder_id" value={folder.id} />
                  <button className="text-sm font-medium text-red-600 hover:underline">Delete</button>
                </form>
              </article>
            ))}
          </div>

          {(words ?? []).length === 0 && <div className="rounded-2xl border border-dashed border-zinc-300 p-10 text-center text-zinc-500">Không tìm thấy từ nào.</div>}
        </div>
      </section>
    </AppShell>
  );
}
