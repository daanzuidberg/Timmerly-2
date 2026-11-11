import type { ReactNode } from 'react';
import { Logo } from '@/components/ui';

const CLAIMS = ['Gratis voor vakmensen', 'Elk bedrijf geverifieerd op KvK', 'Elke match uitgelegd, nooit een zwarte doos'];

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[minmax(0,1fr)_480px]">
      {/* Op mobiel verdwijnt dit paneel volledig in plaats van dat het inkrimpt: de inhoud rechts is het doel, dit is alleen sfeer op grote schermen. */}
      <div className="relative hidden overflow-hidden bg-navy lg:block">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/images/banner-timmermannen.webp')" }}
          role="img"
          aria-label="Een aannemer en een timmerman schudden elkaar de hand op een bouwplaats"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/80 to-navy/30" />
        <div className="relative flex h-full flex-col justify-between p-10 xl:p-14">
          <Logo light size={36} />
          <div className="max-w-sm">
            <p className="text-2xl font-semibold leading-snug tracking-tight text-white [text-shadow:0_2px_24px_rgba(0,0,0,.35)]">Goede bouwprojecten, zonder eindeloos zoeken.</p>
            <ul className="mt-6 flex flex-col gap-3">
              {CLAIMS.map((c) => (
                <li key={c} className="flex items-start gap-2.5 text-sm text-white/80">
                  <span className="mt-0.5 inline-flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-orange text-[10px] font-bold text-white">✓</span>
                  {c}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center bg-ground px-4 py-10">
        <div className="lg:hidden"><Logo /></div>
        <div className="mt-8 w-full max-w-md lg:mt-0">{children}</div>
        <p className="mt-8 text-xs text-faint">© Timmerly B.V. · <a href="/privacy">Privacy</a> · <a href="/support">Support</a></p>
      </div>
    </div>
  );
}
