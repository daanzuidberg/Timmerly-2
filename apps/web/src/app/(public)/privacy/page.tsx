import { ContentPage } from '@/components/ContentPage';
export const metadata = { title: 'Privacy en AVG' };
export default function Page() {
  return (
    <ContentPage eyebrow="AVG & privacy" title="Privacybeleid" intro="Timmerly B.V. is verwerkingsverantwoordelijke voor de persoonsgegevens op dit platform. Dit beleid beschrijft welke gegevens we verwerken, waarom, hoe lang, en welke rechten je hebt.">
      <section><h2>Welke gegevens</h2><ul><li>Accountgegevens: naam, e-mail, telefoon, wachtwoord (gehasht), 2FA-geheim (versleuteld).</li><li>Profielgegevens: vak, ervaring, certificaten, werkgebied, beschikbaarheid, tarief, KvK-gegevens van zzp’ers en bedrijven.</li><li>Gebruiksgegevens: aanmeldingen, berichten, uren, reviews, meldingen, sessies (IP en browser) en een auditlog van wijzigingen.</li><li>Verificatiegegevens: alleen de uitkomst en een referentie van de verificatiepartij; wij bewaren geen kopieën van identiteitsbewijzen.</li></ul></section>
      <section><h2>Waarvoor</h2><p>Uitvoering van de overeenkomst (matching, communicatie, opdrachtafhandeling), gerechtvaardigd belang (beveiliging, fraudepreventie, verbetering van de matching) en wettelijke verplichtingen (bewaarplicht). Voor e-mailmeldingen en cookies die niet noodzakelijk zijn vragen we toestemming.</p></section>
      <section><h2>Locatie</h2><p>Je woonadres wordt nooit publiek getoond. Op kaarten en in profielen tonen we hooguit je woonplaats; afstanden worden berekend op de server.</p></section>
      <section><h2>Bewaartermijnen</h2><p>Accountgegevens zolang je account bestaat. Na verwijdering worden persoonsgegevens direct geanonimiseerd; opdracht-, uren- en reviewgegevens blijven geanonimiseerd bewaard vanwege de fiscale bewaarplicht (7 jaar) en het verdedigingsbelang van de wederpartij. Beveiligingslogs bewaren we 12 maanden.</p></section>
      <section><h2>Je rechten</h2><p>Inzage, correctie, verwijdering, beperking, bezwaar en overdraagbaarheid. Via Instellingen → Privacy exporteer je al je gegevens als bestand en verwijder je je account zelf. Vragen: privacy@timmerly.nl. Je kunt een klacht indienen bij de Autoriteit Persoonsgegevens.</p></section>
      <section><h2>Verwerkers</h2><p>Hosting (EU), e-mailbezorging, en waar van toepassing een identiteitsverificatiepartij. Met alle verwerkers zijn verwerkersovereenkomsten gesloten; gegevens verlaten de EER niet.</p></section>
    </ContentPage>
  );
}
