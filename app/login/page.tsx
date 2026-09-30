import { login, signup } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const { error, message } = await searchParams;

  return (
    <main className="min-h-screen grid place-items-center p-5">
      <section className="w-full max-w-md rounded-3xl bg-white p-7 shadow-sm border border-zinc-200">
        <div className="mb-7">
          <div className="text-sm font-semibold text-indigo-600">VOCAB SRS</div>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">Học từ vựng chủ động</h1>
          <p className="mt-2 text-sm text-zinc-500">Active Recall + Spaced Repetition, đồng bộ trên điện thoại và laptop.</p>
        </div>

        {error && <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
        {message && <div className="mb-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div>}

        <form className="space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium">Email</span>
            <input className="w-full rounded-xl border border-zinc-300 px-3.5 py-3 outline-none focus:border-indigo-500" name="email" type="email" required autoComplete="email" />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium">Password</span>
            <input className="w-full rounded-xl border border-zinc-300 px-3.5 py-3 outline-none focus:border-indigo-500" name="password" type="password" required minLength={8} autoComplete="current-password" />
          </label>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <button formAction={login} className="rounded-xl bg-zinc-900 px-4 py-3 font-semibold text-white hover:bg-zinc-800">Đăng nhập</button>
            <button formAction={signup} className="rounded-xl border border-zinc-300 px-4 py-3 font-semibold hover:bg-zinc-50">Đăng ký</button>
          </div>
        </form>
      </section>
    </main>
  );
}
