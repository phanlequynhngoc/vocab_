"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";

export async function createFolder(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;

  const { supabase, user } = await requireUser();
  const { error } = await supabase.from("folders").insert({ user_id: user.id, name });
  if (error) throw new Error(error.message);

  revalidatePath("/dashboard");
}

export async function deleteFolder(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const { supabase, user } = await requireUser();

  const { error } = await supabase.from("folders").delete().eq("id", id).eq("user_id", user.id);
  if (error) throw new Error(error.message);

  revalidatePath("/dashboard");
}

export async function logout() {
  const { supabase } = await requireUser();
  await supabase.auth.signOut();
  redirect("/login");
}
