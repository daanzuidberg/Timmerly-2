import { ContentPage } from '@/components/ContentPage';
export const metadata = { title: 'Algemene voorwaarden' };
export default function Page() {
  return (
    <ContentPage eyebrow="Algemene voorwaarden" title="Voorwaarden voor het gebruik van Timmerly" intro="Timmerly faciliteert het contact tussen opdrachtgevers en bouwprofessionals. Timmerly is geen partij bij de overeenkomst die zij onderling sluiten.">
      <section><h2>1. Het platform</h2><p>Timmerly biedt matching, communicatie, urenregistratie en reviews. Overeenkomsten van opdracht of arbeidsovereenkomsten komen tot stand tussen opdrachtgever en vakman; Timmerly is daarbij geen werkgever, uitzender of bemiddelaar in de zin van de Waadi, tenzij uitdrukkelijk anders overeengekomen.</p></section>
      <section><h2>2. Verificatie en badges</h2><p>Badges geven weer wat Timmerly heeft gecontroleerd op het moment van controle. Ze vormen geen garantie over de juistheid van gegevens of over de kwalificatie van een arbeidsrelatie.</p></section>
      <section><h2>3. ZZP-check</h2><p>De ZZP-check is risicosignalering op basis van door partijen gegeven antwoorden. Het is geen juridisch advies en geen oordeel over de arbeidsrelatie. Partijen blijven zelf verantwoordelijk voor de juridische kwalificatie en de fiscale gevolgen.</p></section>
      <section><h2>4. Gedrag</h2><p>Gebruikers verstrekken juiste gegevens, maken geen meerdere accounts, plaatsen geen misleidende projecten of reviews en gedragen zich respectvol. Bij overtreding kan Timmerly content verwijderen en accounts schorsen; dit wordt vastgelegd in de auditlog.</p></section>
      <section><h2>5. Aansprakelijkheid</h2><p>Timmerly is niet aansprakelijk voor schade die voortvloeit uit de uitvoering van opdrachten tussen gebruikers. Aansprakelijkheid voor het platform zelf is beperkt tot het bedrag dat in de betreffende periode aan Timmerly is betaald.</p></section>
      <section><h2>6. Toepasselijk recht</h2><p>Nederlands recht. Geschillen worden voorgelegd aan de bevoegde rechter in Nederland.</p></section>
    </ContentPage>
  );
}
