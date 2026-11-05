import Link from 'next/link';
import { SPECIALISM_LABELS, formatDateNl, type Specialism } from '@timmerly/core';
import { Pill, Score, StatusPill } from './ui';

type Project = {
  id: string; title: string; city: string; startDate: string; endDate: string | null; specialisms: string[]; rateMin: number | null; rateMax: number | null;
  headcount: number; filledCount: number; status: string; company?: { name: string; verifiedAt: Date | null } | null;
};

export function ProjectCard({ project, score, distanceKm }: { project: Project; score?: number; distanceKm?: number | null }) {
  const spots = project.headcount - project.filledCount;
  return (
    <Link href={`/projecten/${project.id}`} className="card card-hover flex flex-col gap-3 text-navy no-underline hover:text-navy">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-lg font-bold leading-snug text-navy">{project.title}</div>
          <div className="mt-1 text-sm text-muted">
            {project.company?.name}{project.company?.verifiedAt ? ' ✓' : ''} · {project.city}{distanceKm != null ? ` · ${distanceKm} km` : ''}
          </div>
        </div>
        {score != null ? <Score value={score} /> : project.status === 'published' ? <Pill tone={spots <= 1 ? 'warn' : 'ok'}>{spots <= 1 ? 'Bijna vol' : 'Open'}</Pill> : <StatusPill status={project.status} />}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {project.specialisms.slice(0, 3).map((s) => <span key={s} className="rounded-md border border-line bg-ground px-2 py-0.5 text-xs font-bold text-navy">{SPECIALISM_LABELS[s as Specialism] ?? s}</span>)}
      </div>
      <div className="grid grid-cols-2 gap-2 border-t border-line pt-3 text-sm">
        <div><div className="text-xs text-faint">Start</div><div className="font-semibold">{formatDateNl(project.startDate)}</div></div>
        <div><div className="text-xs text-faint">Plekken</div><div className="font-semibold">{spots} van {project.headcount} open</div></div>
      </div>
      <div className="flex items-center justify-between">
        <span className="font-bold">{project.rateMin ? `€${project.rateMin} – €${project.rateMax} p/u` : 'Tarief in overleg'}</span>
        <span className="text-sm font-bold text-orange-700">Bekijk project →</span>
      </div>
    </Link>
  );
}
