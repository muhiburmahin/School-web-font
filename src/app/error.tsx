"use client";

export default function AppError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center gap-3 px-4 py-16">
      <h1 className="text-2xl font-semibold">Something went wrong</h1>
      <p className="text-sm text-muted-foreground">The page could not be shown.</p>
      <button className="w-fit text-sm underline" type="button" onClick={reset}>
        Try again
      </button>
    </main>
  );
}
