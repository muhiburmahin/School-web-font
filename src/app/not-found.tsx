import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center gap-3 px-4 py-16">
      <h1 className="text-2xl font-semibold">Page not found</h1>
      <Link className="text-sm underline" href="/">
        Back to home
      </Link>
    </main>
  );
}
