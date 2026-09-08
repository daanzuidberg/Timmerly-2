import type { ReactNode } from 'react';
import { Logo } from '@/components/ui';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center bg-ground px-4 py-10">
      <Logo />
      <div className="mt-8 w-full max-w-md">{children}</div>
      <p className="mt-8 text-xs text-faint">© Timmerly B.V. · <a href="/privacy">Privacy</a> · <a href="/support">Support</a></p>
    </div>
  );
}
