"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";

function value(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

export async function addVocabulary(formData: FormData) {
  const folderId = value(formData, "folder_id");
  const word = value(formData, "word");
  const meaning = value(formData, "meaning");
  if (!folderId || !word || !meaning) return;

  const { supabase, user } = await requireUser();
  const { error } = await supabase.from("vocabularies").insert({
    user_id: user.id,
    folder_id: folderId,
    word,
    meaning,
    example: value(formData, "example") || null,
    phonetic: value(formData, "phonetic") || null,
    part_of_speech: value(formData, "part_of_speech") || null,
    note: value(formData, "note") || null,
  });
  if (error) throw new Error(error.message);

  revalidatePath(`/folders/${folderId}`);
  revalidatePath("/dashboard");
}

export async function updateVocabulary(formData: FormData) {
  const folderId = value(formData, "folder_id");
  const id = value(formData, "id");
  const word = value(formData, "word");
  const meaning = value(formData, "meaning");
  if (!id || !folderId || !word || !meaning) return;

  const { supabase, user } = await requireUser();
  const { error } = await supabase
    .from("vocabularies")
    .update({
      word,
      meaning,
      example: value(formData, "example") || null,
      phonetic: value(formData, "phonetic") || null,
      part_of_speech: value(formData, "part_of_speech") || null,
      note: value(formData, "note") || null,
    })
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) throw new Error(error.message);

  revalidatePath(`/folders/${folderId}`);
}

export async function deleteVocabulary(formData: FormData) {
  const folderId = value(formData, "folder_id");
  const id = value(formData, "id");
  const { supabase, user } = await requireUser();

  const { error } = await supabase.from("vocabularies").delete().eq("id", id).eq("user_id", user.id);
  if (error) throw new Error(error.message);

  revalidatePath(`/folders/${folderId}`);
  revalidatePath("/dashboard");
}
