import type { ReactNode } from 'react';

export function ContentPage({ eyebrow, title, intro, children }: { eyebrow: string; title: string; intro: string; children: ReactNode }) {
  return (
    <>
      <div className="bg-navy px-6 py-14 text-white">
        <div className="mx-auto max-w-3xl"><div className="eyebrow mb-3 text-orange">{eyebrow}</div><h1 className="text-3xl font-semibold tracking-tight md:text-4xl">{title}</h1><p className="mt-3 max-w-2xl text-white/75">{intro}</p></div>
      </div>
      <div className="mx-auto flex max-w-3xl flex-col gap-8 px-6 py-12 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mb-2 [&_p]:text-[15px] [&_p]:text-navy-500 [&_li]:text-[15px] [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:flex [&_ul]:flex-col [&_ul]:gap-1">{children}</div>
    </>
  );
}
