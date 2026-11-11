import Link from 'next/link';

export const metadata = { title: 'Hoe het werkt' };

const STEPS = [
  ['Profiel', <>Vak, specialisaties, ervaring, certificaten, werkgebied en beschikbaarheid. Zzp’ers vullen daarnaast KvK- en verzekeringsgegevens in. Je bepaalt zelf wat publiek zichtbaar is.</>],
  ['Verificatie', <>E-mail en telefoon worden direct geverifieerd. Identiteit, bedrijf (KvK) en certificaten worden door het Timmerly-team of een gespecialiseerde partij gecontroleerd. Alleen geverifieerde gegevens leveren een badge op.</>],
  ['Matching', <>Elk project krijgt per vakman een score van 0 tot 100 met uitleg: ervaring, afstand, certificaten, beschikbaarheid, tarief, logistiek en reputatie. Verkeerd vak of buiten reisafstand sluit uit. <Link href="/projecten" className="font-semibold">Bekijk projecten</Link>.</>],
  ['Interesse → contact → voorstel → akkoord', <>Interesse tonen kost één klik. Het gesprek hangt aan het project, zodat afspraken niet verdwijnen in een chat. Het bedrijf stuurt een voorstel met tarief en looptijd; bij zzp hoort de <Link href="/zzp-check" className="font-semibold">ZZP-check</Link>.</>],
  ['Opdracht, uren en review', <>Uren per week indienen, goedkeuren of afwijzen met reden. Na afronding beoordelen beide partijen elkaar in zeven categorieën. Reviews worden gemodereerd.</>]
] as const;

export default function Page() {
  return (
    <>
      <div className="bg-navy px-6 py-14 text-white">
        <div className="mx-auto max-w-3xl">
          <div className="eyebrow mb-3 text-orange">Hoe het werkt</div>
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Van profiel tot afgeronde opdracht, in één omgeving</h1>
          <p className="mt-3 max-w-2xl text-white/75">Timmerly is geen vacaturebank. Projecten en profielen worden gescoord op harde criteria; wat overblijft is een gesprek tussen twee gescreende partijen.</p>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-6 py-12">
        <ol className="relative flex flex-col gap-8 before:absolute before:bottom-6 before:left-[17px] before:top-6 before:w-px before:bg-line before:content-['']">
          {STEPS.map(([title, body], i) => (
            <li key={title} className="relative flex gap-5 pl-0">
              <span className="relative z-10 inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-orange text-sm font-bold text-white shadow-button">{i + 1}</span>
              <div className="pt-0.5">
                <h2 className="text-lg font-bold">{title}</h2>
                <p className="mt-1.5 text-[15px] leading-relaxed text-navy-500">{body}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </>
  );
}
