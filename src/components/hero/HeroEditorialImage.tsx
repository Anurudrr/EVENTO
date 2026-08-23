import React from 'react';
import { STATIC_EVENT_IMAGES } from '../../constants/images';
import { FALLBACK_IMAGE_URL } from '../../utils';

const HERO_IMAGE = STATIC_EVENT_IMAGES.hero;
const HERO_THUMBNAIL = STATIC_EVENT_IMAGES.heroThumbnail;

export const HeroEditorialImage: React.FC = React.memo(() => {
  return (
    <div className="relative">
      <div className="rounded-[24px] border border-noir-border bg-white/85 p-3 shadow-[0_38px_120px_rgba(32,37,43,0.14)] backdrop-blur-sm">
        <div className="overflow-hidden rounded-[18px] border border-noir-border bg-[#e7ece9]">
          <img
            src={HERO_IMAGE}
            alt="Curated premium event styling"
            className="aspect-[4/5] w-full object-cover"
            decoding="async"
            onError={(event) => {
              (event.target as HTMLImageElement).src = FALLBACK_IMAGE_URL;
            }}
          />
        </div>
      </div>

      <div className="pointer-events-none absolute inset-3 rounded-[18px] bg-gradient-to-tr from-[rgba(32,37,43,0.26)] via-transparent to-[rgba(255,255,255,0.16)]" />

      <div className="absolute -bottom-6 left-5 z-10 max-w-[15rem] rounded-[18px] border border-noir-border bg-white/90 p-3 shadow-[0_18px_44px_rgba(32,37,43,0.12)] backdrop-blur-xl sm:left-6 sm:p-3.5">
        <div className="flex items-center gap-3">
          <img
            src={HERO_THUMBNAIL}
            alt=""
            aria-hidden="true"
            className="h-14 w-14 shrink-0 rounded-[16px] border border-black/5 object-cover"
            loading="lazy"
            decoding="async"
            onError={(event) => {
              (event.target as HTMLImageElement).src = FALLBACK_IMAGE_URL;
            }}
          />
          <div className="min-w-0">
            <span className="inline-flex rounded-full bg-[#32251b] px-2.5 py-1 text-[0.58rem] font-semibold uppercase tracking-[0.26em] text-[#f6ede2]">
              Verified
            </span>
            <p className="mt-2 text-sm font-medium leading-5 text-noir-ink">
              Event-ready vendor
            </p>
          </div>
        </div>
      </div>
    </div>
  );
});
