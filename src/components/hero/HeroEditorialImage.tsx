import React from 'react';

const HERO_IMAGE = '/images/decor.jpg';
const HERO_THUMBNAIL = '/images/photography.jpg';

export const HeroEditorialImage: React.FC = React.memo(() => {
  return (
    <div className="relative">
      <div className="rounded-[32px] border border-[#eadbcb] bg-[rgba(255,251,246,0.9)] p-3 shadow-[0_38px_120px_rgba(95,67,39,0.18)] backdrop-blur-sm">
        <div className="overflow-hidden rounded-[24px] border border-[#e5d7c8] bg-[#eee1d3]">
          <img
            src={HERO_IMAGE}
            alt="Curated premium event styling"
            className="aspect-[4/5] w-full object-cover"
            decoding="async"
          />
        </div>
      </div>

      <div className="pointer-events-none absolute inset-3 rounded-[24px] bg-gradient-to-tr from-[rgba(50,37,27,0.2)] via-transparent to-[rgba(255,255,255,0.16)]" />

      <div className="absolute -bottom-6 left-5 z-10 max-w-[15rem] rounded-[22px] border border-[rgba(72,53,34,0.1)] bg-[rgba(255,251,246,0.9)] p-3 shadow-[0_18px_44px_rgba(80,56,33,0.14)] backdrop-blur-xl sm:left-6 sm:p-3.5">
        <div className="flex items-center gap-3">
          <img
            src={HERO_THUMBNAIL}
            alt=""
            aria-hidden="true"
            className="h-14 w-14 shrink-0 rounded-[16px] border border-black/5 object-cover"
            loading="lazy"
            decoding="async"
          />
          <div className="min-w-0">
            <span className="inline-flex rounded-full bg-[#32251b] px-2.5 py-1 text-[0.58rem] font-semibold uppercase tracking-[0.26em] text-[#f6ede2]">
              Live
            </span>
            <p className="mt-2 text-sm font-medium leading-5 text-noir-ink">
              Editorial preview
            </p>
          </div>
        </div>
      </div>
    </div>
  );
});
