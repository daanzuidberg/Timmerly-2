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
      <section className="relative overflow-hidden bg-navy px-6 py-20 text-white md:py-28">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/images/banner-timmermannen.webp')" }}
          role="img"
          aria-label="Een aannemer en een timmerman schudden elkaar de hand op een bouwplaats"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-navy via-navy/85 to-navy/45" />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-navy/60 to-transparent" />
        <div className="container-x relative grid items-center gap-12 lg:grid-cols-[1.2fr_1fr]">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-xs font-bold text-[#FCD34D] backdrop-blur"><span className="h-1.5 w-1.5 rounded-full bg-[#FCD34D]" />Voor zzp-timmermannen en aannemers in Nederland</div>
            <h1 className="text-[1.375rem] font-semibold leading-[1.2] tracking-tight [text-shadow:0_2px_24px_rgba(0,0,0,.35)] sm:text-4xl sm:leading-[1.1] md:text-5xl xl:text-6xl">Goede bouwprojecten,<br /><span className="text-orange">zonder eindeloos zoeken.</span></h1>
            <p className="mt-5 max-w-xl text-lg text-white/85 [text-shadow:0_1px_12px_rgba(0,0,0,.35)]">Maak één keer je profiel. Timmerly toont projecten die passen bij je vak, regio en beschikbaarheid, screent beide kanten en regelt de match en de afhandeling.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/projecten" className="btn-primary px-7 py-3.5 text-base">Bekijk projecten</Link>
              <Link href="/registreren?rol=professional" className="btn border border-white/40 bg-white/10 px-7 py-3.5 text-base text-white backdrop-blur hover:bg-white/20 hover:text-white">Word Timmerly-vakman</Link>
            </div>
            <p className="mt-6 text-sm text-white/65">Gratis voor vakmensen · Aanmelden in 10 minuten · Persoonlijk aanspreekpunt</p>
          </div>
          <div className="rounded-card border border-white/40 bg-white p-6 text-navy shadow-float">
            <div className="mb-3 flex items-center justify-between"><span className="eyebrow">Zo werkt een match</span><span className="pill bg-ok-100 text-ok-800">Live voorbeeld</span></div>
            <div className="mb-1 text-lg font-bold">Timmerman nieuwbouw – 84 woningen</div>
            <div className="mb-4 text-sm text-muted">Almere Poort · start 21 september · 12 weken</div>
            <div className="mb-4 flex items-center gap-5 rounded-control border border-line-soft bg-ground p-4">
              <div className="text-center"><div className="text-3xl font-bold text-ok-800">96%</div><div className="text-[10px] font-bold uppercase tracking-wider text-faint">match</div></div>
              <ul className="grid flex-1 gap-1.5 text-sm">
                {['8 jaar ervaring aftimmering', '50 km van het project', 'VCA Basis geverifieerd', 'Beschikbaar vanaf 14 september'].map((r) => (
                  <li key={r} className="flex items-center gap-2"><span className="inline-flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-ok-100 text-[10px] font-bold text-ok-800">✓</span>{r}</li>
                ))}
              </ul>
            </div>
            <div className="text-sm text-muted">Elke score is uitgelegd. Je ziet altijd waarom je past — en wat je nog mist.</div>
          </div>
        </div>
      </section>

      <section className="border-b border-line-soft bg-white px-6 py-4 shadow-[0_1px_0_rgba(12,26,42,0.04)]">
        <div className="container-x flex flex-wrap gap-x-8 gap-y-2 text-sm font-semibold text-navy-500">
          {['Gescreende vakmensen', 'Geverifieerde opdrachtgevers', 'Uitgelegde matchscores', 'ZZP-check ingebouwd', 'AVG-proof gegevensbeheer'].map((t) => (
            <span key={t} className="inline-flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-orange" />{t}</span>
          ))}
        </div>
      </section>

      <section className="section bg-white">
        <div className="container-x">
          <div className="eyebrow mb-3 text-orange-700">Hoe werkt Timmerly</div>
          <h2 className="h1 mb-10 max-w-2xl">Vier stappen van profiel naar project</h2>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {STEPS.map(([title, body], i) => (
              <div key={title} className="card card-hover">
                <div className="mb-4 inline-flex h-9 w-9 items-center justify-center rounded-full bg-orange text-sm font-bold text-white shadow-button">{i + 1}</div>
                <div className="mb-1.5 font-bold">{title}</div>
                <p className="text-sm leading-relaxed text-muted">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section bg-ground">
        <div className="container-x">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div><div className="eyebrow mb-2">Actuele projecten</div><h2 className="h1">Waar nu timmermannen gezocht worden</h2></div>
            <Link href="/projecten" className="btn-secondary">Alle projecten</Link>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {projects.map((p) => <ProjectCard key={p.id} project={p} />)}
          </div>
        </div>
      </section>

      <section className="section bg-white">
        <div className="container-x">
          <div className="eyebrow mb-3 text-orange-700">Waarom Timmerly</div>
          <h2 className="h1 mb-10 max-w-2xl">Geen vacaturebank, maar een vaknetwerk</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {WHY.map(([title, body]) => (
              <div key={title} className="panel flex gap-4">
                <span className="mt-1.5 h-2.5 w-2.5 flex-shrink-0 rounded-sm bg-orange" aria-hidden="true" />
                <div><div className="mb-1 font-bold">{title}</div><p className="text-sm leading-relaxed text-muted">{body}</p></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 pb-20">
        <div className="container-x overflow-hidden rounded-card bg-gradient-to-br from-navy via-navy to-navy-700 p-8 text-white shadow-float md:p-12">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div>
              <div className="eyebrow mb-2 text-white/50">Voor opdrachtgevers</div>
              <h2 className="h2">Op zoek naar een timmerman?</h2>
              <p className="mt-2 max-w-xl text-white/75">Plaats je project in drie stappen. Timmerly toont direct de best passende, gescreende vakmensen — met uitleg per kandidaat.</p>
            </div>
            <Link href="/registreren?rol=company" className="btn-primary px-7 py-3.5 text-base">Project aanmelden</Link>
          </div>
        </div>
      </section>
    </>
  );
}
