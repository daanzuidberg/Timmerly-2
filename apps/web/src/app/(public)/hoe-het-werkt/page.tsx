import Link from 'next/link';
import { ContentPage } from '@/components/ContentPage';
export const metadata = { title: 'Hoe het werkt' };
export default function Page() {
  return (
    <ContentPage eyebrow="Hoe het werkt" title="Van profiel tot afgeronde opdracht, in één omgeving" intro="Timmerly is geen vacaturebank. Projecten en profielen worden gescoord op harde criteria; wat overblijft is een gesprek tussen twee gescreende partijen.">
      <section><h2>1. Profiel</h2><p>Vak, specialisaties, ervaring, certificaten, werkgebied en beschikbaarheid. Zzp’ers vullen daarnaast KvK- en verzekeringsgegevens in. Je bepaalt zelf wat publiek zichtbaar is.</p></section>
      <section><h2>2. Verificatie</h2><p>E-mail en telefoon worden direct geverifieerd. Identiteit, bedrijf (KvK) en certificaten worden door het Timmerly-team of een gespecialiseerde partij gecontroleerd. Alleen geverifieerde gegevens leveren een badge op.</p></section>
      <section><h2>3. Matching</h2><p>Elk project krijgt per vakman een score van 0 tot 100 met uitleg: ervaring, afstand, certificaten, beschikbaarheid, tarief, logistiek en reputatie. Verkeerd vak, buiten reisafstand of geen passende contractvorm sluit uit. <Link href="/projecten">Bekijk projecten</Link>.</p></section>
      <section><h2>4. Interesse → contact → voorstel → akkoord</h2><p>Interesse tonen kost één klik. Het gesprek hangt aan het project, zodat afspraken niet verdwijnen in een chat. Het bedrijf stuurt een voorstel met tarief, looptijd en contractvorm; bij zzp hoort de <Link href="/zzp-check">ZZP-check</Link>.</p></section>
      <section><h2>5. Opdracht, uren en review</h2><p>Uren per week indienen, goedkeuren of afwijzen met reden. Na afronding beoordelen beide partijen elkaar in zeven categorieën. Reviews worden gemodereerd.</p></section>
    </ContentPage>
  );
}
