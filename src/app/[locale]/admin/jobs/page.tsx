import { type Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { isAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { isLocale } from "@/i18n/config";
import { getJobs, getJobStats } from "@/lib/jobs";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Tâches en arrière-plan",
};

const STATUS_STYLES: Record<string, string> = {
  pending: "border-shell/30 text-shell-dim",
  running: "border-lagoon/50 text-lagoon",
  completed: "border-lagoon/50 text-lagoon",
  failed: "border-coral/50 text-coral",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "en attente",
  running: "en cours",
  completed: "terminée",
  failed: "échouée",
};

export default async function JobsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  if (!(await isAdmin())) notFound();

  const stats = getJobStats();
  const jobs = getJobs();

  return (
    <div className="mx-auto max-w-4xl px-5 py-10 sm:px-8">
      <header className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <h1 className="font-display text-4xl text-shell">
          Tâches en arrière-plan
        </h1>
        <Link
          href={`/${locale}/admin`}
          className="text-sm text-shell-dim hover:text-brass"
        >
          ← Retour au service
        </Link>
      </header>

      <div className="mt-8 grid grid-cols-2 gap-x-6 gap-y-6 sm:grid-cols-5">
        <div className="border-t border-brass/35 pt-4">
          <p className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-shell-dim/80">
            Total
          </p>
          <p className="mt-2 font-mono text-3xl leading-none tabular-nums text-shell">
            {stats.total}
          </p>
        </div>
        <div className="border-t border-brass/35 pt-4">
          <p className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-shell-dim/80">
            En attente
          </p>
          <p className="mt-2 font-mono text-3xl leading-none tabular-nums text-shell-dim">
            {stats.pending}
          </p>
        </div>
        <div className="border-t border-brass/35 pt-4">
          <p className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-shell-dim/80">
            En cours
          </p>
          <p className="mt-2 font-mono text-3xl leading-none tabular-nums text-lagoon">
            {stats.running}
          </p>
        </div>
        <div className="border-t border-brass/35 pt-4">
          <p className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-shell-dim/80">
            Terminées
          </p>
          <p className="mt-2 font-mono text-3xl leading-none tabular-nums text-lagoon">
            {stats.completed}
          </p>
        </div>
        <div className="border-t border-brass/35 pt-4">
          <p className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-shell-dim/80">
            Échouées
          </p>
          <p className="mt-2 font-mono text-3xl leading-none tabular-nums text-coral">
            {stats.failed}
          </p>
        </div>
      </div>

      <div className="mt-10">
        <h2 className="font-display text-2xl text-shell">File d&apos;attente</h2>

        {jobs.length === 0 ? (
          <p className="mt-8 py-8 text-center text-shell-dim">
            Aucune tâche dans la file.
          </p>
        ) : (
          <div className="mt-4 overflow-hidden rounded-xl border border-shell/12">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-shell/12 bg-deep/60">
                  <th className="px-5 py-3 font-mono text-xs uppercase tracking-wider text-shell-dim">
                    ID
                  </th>
                  <th className="px-5 py-3 font-mono text-xs uppercase tracking-wider text-shell-dim">
                    Type
                  </th>
                  <th className="px-5 py-3 font-mono text-xs uppercase tracking-wider text-shell-dim">
                    Statut
                  </th>
                  <th className="px-5 py-3 font-mono text-xs uppercase tracking-wider text-shell-dim">
                    Créée
                  </th>
                  <th className="px-5 py-3 font-mono text-xs uppercase tracking-wider text-shell-dim">
                    Erreur
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-shell/8">
                {jobs.map((job) => (
                  <tr key={job.id} className="hover:bg-deep/30">
                    <td className="px-5 py-3 font-mono text-xs text-shell-dim">
                      {job.id.slice(0, 24)}…
                    </td>
                    <td className="px-5 py-3 text-shell">{job.type}</td>
                    <td className="px-5 py-3">
                      <span
                        className={`rounded-full border px-2.5 py-0.5 font-mono text-[0.65rem] uppercase ${STATUS_STYLES[job.status]}`}
                      >
                        {STATUS_LABELS[job.status]}
                      </span>
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-shell-dim">
                      {new Intl.DateTimeFormat("fr-FR", {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      }).format(job.createdAt)}
                    </td>
                    <td className="px-5 py-3 text-xs text-coral">
                      {job.error ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
