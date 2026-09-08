import { ContentPage } from '@/components/ContentPage';
export const metadata = { title: 'Verificatie en certificaten' };
export default function Page() {
  return (
    <ContentPage eyebrow="Vertrouwen" title="Verificatie en certificaten" intro="Elke badge op Timmerly staat voor een daadwerkelijke controle. Gebruikers kunnen zichzelf geen badges toekennen.">
      <section><h2>Wat we verifiëren</h2><ul><li><strong>E-mail en telefoon</strong> — direct, via een code.</li><li><strong>Identiteit</strong> — via een gespecialiseerde verificatiepartij; wij bewaren alleen de uitkomst.</li><li><strong>Bedrijf</strong> — KvK-nummer, bedrijfsnaam en vestiging.</li><li><strong>ZZP-status</strong> — KvK-inschrijving, bedrijfsactiviteit en (optioneel) BTW-nummer en aansprakelijkheidsverzekering.</li><li><strong>Certificaten</strong> — VCA Basis/VOL, BHV, hoogwerker, heftruck, steigerbouw, veilig hijsen. Geldigheid wordt bewaakt; 30 dagen voor het verlopen krijg je een melding.</li></ul></section>
      <section><h2>Wat “ZZP geverifieerd” betekent</h2><p>Dat de ondernemingsgegevens kloppen en actueel zijn. Het is geen uitspraak over de vraag of een specifieke opdracht als zelfstandige arbeid kwalificeert; daarvoor is er de ZZP-check en blijven partijen zelf verantwoordelijk.</p></section>
    </ContentPage>
  );
}
