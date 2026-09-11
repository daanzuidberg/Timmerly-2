import Link from 'next/link';
import { Logo } from './ui';

export function Footer() {
  const col = 'flex flex-col gap-2.5 text-sm text-white/75';
  return (
    <footer className="bg-navy text-white/70">
      <div className="mx-auto grid max-w-6xl gap-8 px-6 py-14 sm:grid-cols-2 lg:grid-cols-5">
        <div>
          <Logo light size={26} />
          <p className="mt-3 max-w-[260px] text-sm leading-relaxed">Landelijk matchingplatform voor aannemers en bouwprofessionals.</p>
        </div>
        <div><div className="eyebrow mb-3 text-white/50">Platform</div><div className={col}><Link href="/over-timmerly" className="text-white/75 hover:text-orange">Over Timmerly</Link><Link href="/hoe-het-werkt" className="text-white/75 hover:text-orange">Hoe het werkt</Link><Link href="/prijzen" className="text-white/75 hover:text-orange">Prijzen</Link></div></div>
        <div><div className="eyebrow mb-3 text-white/50">Voor aannemers</div><div className={col}><Link href="/voor-opdrachtgevers" className="text-white/75 hover:text-orange">Vakmensen vinden</Link><Link href="/registreren?rol=company" className="text-white/75 hover:text-orange">Project plaatsen</Link><Link href="/zzp-check" className="text-white/75 hover:text-orange">ZZP-check</Link></div></div>
        <div><div className="eyebrow mb-3 text-white/50">Voor vakmensen</div><div className={col}><Link href="/projecten" className="text-white/75 hover:text-orange">Werk vinden</Link><Link href="/registreren?rol=professional" className="text-white/75 hover:text-orange">Profiel aanmaken</Link><Link href="/verificatie" className="text-white/75 hover:text-orange">Verificatie &amp; certificaten</Link></div></div>
        <div><div className="eyebrow mb-3 text-white/50">Vertrouwen &amp; contact</div><div className={col}><Link href="/privacy" className="text-white/75 hover:text-orange">AVG &amp; privacy</Link><Link href="/voorwaarden" className="text-white/75 hover:text-orange">Algemene voorwaarden</Link><Link href="/support" className="text-white/75 hover:text-orange">Support</Link><a href="mailto:support@timmerly.nl" className="text-white/75 hover:text-orange">support@timmerly.nl</a></div></div>
      </div>
      <div className="border-t border-white/10 px-6 py-5 text-center text-xs text-white/50">
        © {new Date().getFullYear()} Timmerly B.V. · De ZZP-check is risicosignalering, geen juridisch advies.
      </div>
    </footer>
  );
}
