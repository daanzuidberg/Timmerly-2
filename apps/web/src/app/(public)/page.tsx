import Link from 'next/link';
import { desc, eq, schema } from '@timmerly/db';
import { db } from '@/lib/db';
import { ProjectCard } from '@/components/ProjectCard';

export const dynamic = 'force-dynamic';

const STEPS = [
  ['Maak je profiel', 'Vak, ervaring, certificaten, werkgebied en beschikbaarheid. Eén keer invullen, daarna alleen bijhouden.'],
  ['Ontdek passende projecten', 'Je ziet projecten die bij je profiel passen, met een duidelijke matchscore en alle voorwaarden vooraf.'],
  ['Meld je aan', 'Interesse tonen kost één klik. Wij screenen beide kanten en het gesprek start direct.'],
  ['Wij regelen de match', 'Voorstel, akkoord, uren en betaling lopen via Timmerly. Na afloop beoordelen jullie elkaar.']
];
const WHY = [
  ['Relevante projecten', 'Alleen bouwwerk, gefilterd op jouw vak, regio en beschikbaarheid.'],
  ['Gescreende opdrachtgevers', 'Elk bedrijf wordt geverifieerd op KvK voordat een project online komt.'],
  ['Uitgelegde matches', 'Geen zwarte doos: bij elke score staat waarom je past.'],
  ['ZZP-check ingebouwd', 'Risicosignalering op schijnzelfstandigheid, voordat je start.'],
  ['Alles in één omgeving', 'Opdrachtbevestiging, urenregistratie en reviews op één plek.'],
  ['Transparante afspraken', 'Tarief, looptijd en voorwaarden staan vast voordat je begint.']
];

export default async function Home() {
  const projects = await db().query.projects.findMany({
    where: eq(schema.projects.status, 'published'), orderBy: desc(schema.projects.publishedAt), limit: 3,
    with: { company: { columns: { name: true, verifiedAt: true } } }
  });

  return (
    <>
      <section className="bg-navy px-6 py-20 text-white">
        <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1.2fr_1fr]">
          <div>
            <div className="mb-5 inline-flex items-center rounded-[3px] border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-bold text-[#FCD34D]">Voor zzp-timmermannen en aannemers in Nederland</div>
            <h1 className="text-4xl font-semibold leading-[1.1] tracking-tight md:text-6xl">Goede bouwprojecten,<br /><span className="text-orange">zonder eindeloos zoeken.</span></h1>
            <p className="mt-5 max-w-xl text-lg text-white/80">Maak één keer je profiel. Timmerly toont projecten die passen bij je vak, regio en beschikbaarheid, screent beide kanten en regelt de match en de afhandeling.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/projecten" className="btn-primary px-7 py-3.5 text-base">Bekijk projecten</Link>
              <Link href="/registreren?rol=professional" className="btn border-[1.5px] border-white/60 px-7 py-3.5 text-base text-white hover:bg-white/10">Word Timmerly-vakman</Link>
            </div>
            <p className="mt-6 text-sm text-white/60">Gratis voor vakmensen · Aanmelden in 10 minuten · Persoonlijk aanspreekpunt</p>
          </div>
          <div className="rounded-card bg-white p-6 text-navy">
            <div className="eyebrow mb-3">Zo werkt een match</div>
            <div className="mb-1 text-lg font-bold">Timmerman nieuwbouw – 84 woningen</div>
            <div className="mb-4 text-sm text-muted">Almere Poort · start 21 september · 12 weken</div>
            <div className="mb-4 flex items-center gap-4 rounded-card bg-ground p-4">
              <div className="text-3xl font-bold text-ok-800">96%</div>
              <ul className="grid flex-1 gap-1 text-sm">
                <li>✓ 8 jaar ervaring aftimmering</li><li>✓ 50 km van het project</li><li>✓ VCA Basis geverifieerd</li><li>✓ Beschikbaar vanaf 14 september</li>
              </ul>
            </div>
            <div className="text-sm text-muted">Elke score is uitgelegd. Je ziet altijd waarom je past — en wat je nog mist.</div>
          </div>
        </div>
      </section>

      <section className="border-b border-line bg-white px-6 py-4">
        <div className="mx-auto flex max-w-6xl flex-wrap gap-x-8 gap-y-2 text-sm font-semibold">
          {['Gescreende vakmensen', 'Geverifieerde opdrachtgevers', 'Uitgelegde matchscores', 'ZZP-check ingebouwd', 'AVG-proof gegevensbeheer'].map((t) => (
            <span key={t} className="inline-flex items-center gap-2"><span className="h-1.5 w-1.5 bg-orange" />{t}</span>
          ))}
        </div>
      </section>

      <section className="px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="eyebrow mb-3 text-orange-700">Hoe werkt Timmerly</div>
          <h2 className="h1 mb-10 max-w-2xl">Vier stappen van profiel naar project</h2>
          <div className="grid gap-5 md:grid-cols-4">
            {STEPS.map(([title, body], i) => (
              <div key={title} className="card">
                <div className="mb-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-orange text-sm font-bold text-white">{i + 1}</div>
                <div className="mb-1.5 font-bold">{title}</div>
                <p className="text-sm text-muted">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-ground px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div><div className="eyebrow mb-2">Actuele projecten</div><h2 className="h1">Waar nu timmermannen gezocht worden</h2></div>
            <Link href="/projecten" className="btn-secondary">Alle projecten</Link>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {projects.map((p) => <ProjectCard key={p.id} project={p} />)}
          </div>
        </div>
      </section>

      <section className="px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="eyebrow mb-3 text-orange-700">Waarom Timmerly</div>
          <h2 className="h1 mb-10 max-w-2xl">Geen vacaturebank, maar een vaknetwerk</h2>
          <div className="grid gap-x-10 gap-y-8 md:grid-cols-3">
            {WHY.map(([title, body]) => (
              <div key={title} className="border-t border-line pt-4">
                <div className="mb-1 font-bold">{title}</div>
                <p className="text-sm text-muted">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-navy px-6 py-16 text-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-6">
          <div>
            <div className="eyebrow mb-2 text-white/50">Voor opdrachtgevers</div>
            <h2 className="h2">Op zoek naar een timmerman?</h2>
            <p className="mt-2 max-w-xl text-white/75">Plaats je project in drie stappen. Timmerly toont direct de best passende, gescreende vakmensen — met uitleg per kandidaat.</p>
          </div>
          <Link href="/registreren?rol=company" className="btn-primary px-7 py-3.5 text-base">Project aanmelden</Link>
        </div>
      </section>
    </>
  );
}
