import { useState } from 'react'

function App() {
  const [count, setCount] = useState(0)

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-slate-100">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 rounded-2xl border border-slate-800 bg-slate-900/80 p-8 shadow-2xl">
        <header className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-400">
            Campus Event RSVP Tracker
          </p>
          <h1 className="text-3xl font-bold leading-tight sm:text-4xl">
            Tailwind CSS is configured and running.
          </h1>
          <p className="text-slate-300">
            This screen is styled entirely with utility classes. If these styles are visible,
            Tailwind integration is working correctly.
          </p>
        </header>

        <section className="rounded-xl border border-slate-700 bg-slate-800/60 p-6">
          <p className="text-sm text-slate-300">Verification counter</p>
          <div className="mt-3 flex items-center gap-4">
            <button
              onClick={() => setCount((current) => current + 1)}
              className="rounded-lg bg-cyan-500 px-4 py-2 font-semibold text-slate-950 transition hover:bg-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-300"
            >
              Increment
            </button>
            <span className="rounded-md border border-slate-600 px-3 py-2 text-lg font-bold">
              {count}
            </span>
          </div>
        </section>

        <footer className="text-sm text-slate-400">
          Next step: replace this starter section with your actual event pages and components.
        </footer>
      </div>
    </main>
  )
}

export default App
