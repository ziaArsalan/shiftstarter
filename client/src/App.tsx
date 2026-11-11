// M1 scaffold placeholder. Real screens/routing arrive in M2+ (see docs/ARCHITECTURE.md §7).
// Branding: docs/BRAND.md.
export default function App() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-surface text-brand-ink">
      <div className="text-center">
        <img
          src="/shiftstarter-logo.png"
          alt="ShiftStarter"
          className="mx-auto mb-6 h-40 w-auto"
        />
        <h1 className="text-2xl font-semibold text-brand-navy">ShiftStarter</h1>
        <p className="mt-2 text-slate-500">
          Pharmacy staffing marketplace — scaffold ready. Features begin in Milestone 2.
        </p>
      </div>
    </main>
  );
}
