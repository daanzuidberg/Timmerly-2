import { ContentPage } from '@/components/ContentPage';
export const metadata = { title: 'Support' };
export default function Page() {
  return (
    <ContentPage eyebrow="Support" title="Hulp nodig?" intro="Een vast aanspreekpunt, geen anoniem ticketsysteem. Op werkdagen reageren we binnen één werkdag.">
      <section><h2>Contact</h2><p><a href="mailto:support@timmerly.nl">support@timmerly.nl</a> · Voor spoed tijdens een lopende opdracht: je contactpersoon in het gesprek bij de opdracht.</p></section>
      <section><h2>Iets melden</h2><p>Nepaccount, fraude, ongewenst gedrag of een onveilige werksituatie? Gebruik de knop “Melden” op een profiel of project. Meldingen worden binnen twee werkdagen beoordeeld en vastgelegd.</p></section>
      <section><h2>Veelgestelde vragen</h2><ul><li><strong>Wat kost Timmerly voor vakmensen?</strong> Niets. Profiel, matches en chat zijn gratis.</li><li><strong>Hoe lang duurt verificatie?</strong> E-mail en telefoon direct; identiteit, KvK en certificaten binnen twee werkdagen.</li><li><strong>Kan ik mijn account verwijderen?</strong> Ja, via Instellingen → Privacy. Persoonsgegevens worden direct geanonimiseerd.</li></ul></section>
    </ContentPage>
  );
}
