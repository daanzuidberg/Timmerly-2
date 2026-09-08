import { ContentPage } from '@/components/ContentPage';
export const metadata = { title: 'Over Timmerly' };
export default function Page() {
  return (
    <ContentPage eyebrow="Over ons" title="Eén platform voor aannemers en bouwprofessionals" intro="Timmerly brengt vraag en aanbod in de bouw samen op basis van vakgebied, beschikbaarheid, afstand en geverifieerde certificaten — geen vacaturebank, maar een matchingplatform.">
      <section><h2>Waarom Timmerly</h2><p>Aannemers verliezen tijd aan het screenen van kandidaten die niet passen op ervaring, regio of beschikbaarheid. Vakmensen verliezen tijd aan reageren op vacatures die niet matchen met hun tarief of planning. Timmerly lost dat op met matching op harde criteria, in plaats van open sollicitaties.</p></section>
      <section><h2>Vertrouwen als basis</h2><p>Identiteit, KvK-status en certificaten worden gecontroleerd voordat een badge zichtbaar is. Reviews zijn gekoppeld aan een afgeronde opdracht en worden gemodereerd. Een interne trustscore weegt mee in matching en fraudepreventie.</p></section>
      <section><h2>Gebouwd om te groeien</h2><p>We starten met timmermannen. Het platform is ontworpen om uit te breiden naar andere bouwberoepen en naar België en Duitsland, zonder de kern opnieuw te bouwen.</p></section>
    </ContentPage>
  );
}
