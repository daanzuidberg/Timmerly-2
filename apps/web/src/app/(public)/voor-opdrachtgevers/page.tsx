import Link from 'next/link';
import { ContentPage } from '@/components/ContentPage';
export const metadata = { title: 'Voor opdrachtgevers', description: 'Vind binnen minuten gescreende timmermannen voor je project. Plaats een project, bekijk gerangschikte kandidaten met uitleg en regel de opdracht via Timmerly.' };
export default function Page() {
  return (
    <ContentPage eyebrow="Voor aannemers en bouwbedrijven" title="De juiste vakman, gescreend, binnen minuten" intro="Plaats een project in drie stappen. Timmerly rangschikt beschikbare vakmensen op ervaring, afstand, certificaten en beschikbaarheid — en legt per kandidaat uit waarom.">
      <section><h2>Plaats een project</h2><p>“Ik zoek 4 timmermannen in Almere voor 12 weken.” Vul de eisen aan (ervaring, certificaten, tarief, contractvorm) of gebruik een eerder project als sjabloon. Na KvK-verificatie publiceren je projecten direct.</p></section>
      <section><h2>Bekijk kandidaten</h2><p>Je ziet alleen vakmensen die geschikt zijn. Per kandidaat: matchscore met uitleg, geverifieerde certificaten, beoordelingen en beschikbaarheid. Benader wie je wilt; het gesprek start meteen.</p></section>
      <section><h2>Bouw een talentpool</h2><p>Sla vakmensen op, markeer wie je eerder inzette en zie direct wie beschikbaar is voor je volgende project.</p></section>
      <section><h2>Regel het netjes</h2><p>Voorstel, akkoord, urenregistratie en reviews lopen via het platform. De ingebouwde ZZP-check signaleert vooraf risico’s rond schijnzelfstandigheid.</p></section>
      <div><Link href="/registreren?rol=company" className="btn-primary">Bedrijfsaccount aanmaken</Link></div>
    </ContentPage>
  );
}
