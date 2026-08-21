import React, { useState, useEffect } from 'react';
import { DrillAd } from '../data/drillAds';
import { Play, FastForward, ExternalLink, Sparkles, Shield, ShoppingBag, Star, Zap, CheckCircle2 } from 'lucide-react';

interface YouTubeStyleAdOverlayProps {
  ad: DrillAd;
  drillTitle: string;
  isProSubscriber?: boolean;
  onAdCompleted: () => void;
  onUpgradeToPro: () => void;
}

export const YouTubeStyleAdOverlay: React.FC<YouTubeStyleAdOverlayProps> = ({
  ad,
  drillTitle,
  isProSubscriber = false,
  onAdCompleted,
  onUpgradeToPro
}) => {
  const [secondsRemaining, setSecondsRemaining] = useState<number>(5);
  const [canSkip, setCanSkip] = useState<boolean>(false);
  const [showProductDetailsModal, setShowProductDetailsModal] = useState<boolean>(false);

  // Auto Countdown for YouTube style Ad
  useEffect(() => {
    if (isProSubscriber) {
      onAdCompleted();
      return;
    }

    const timer = setInterval(() => {
      setSecondsRemaining(prev => {
        if (prev <= 1) {
          setCanSkip(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isProSubscriber]);

  if (isProSubscriber) return null;

  return (
    <div className="absolute inset-0 z-40 bg-black flex flex-col justify-between overflow-hidden animate-fade-in font-sans">
      
      {/* Top Bar: YouTube Ad Header */}
      <div className="p-4 flex items-center justify-between bg-gradient-to-b from-black/90 via-black/50 to-transparent z-20">
        <div className="flex items-center gap-2">
          {/* Yellow Ad Badge */}
          <span className="px-2 py-0.5 rounded bg-amber-400 text-slate-950 font-black text-[11px] tracking-wider uppercase shadow-md">
            Ad
          </span>
          <span className="text-xs text-slate-300 font-medium">1 of 1</span>
          <span className="text-slate-600">•</span>
          <div className="flex items-center gap-1.5 bg-slate-900/80 px-2.5 py-1 rounded-full border border-slate-800 text-xs text-white">
            <span className="text-amber-400 font-bold">{ad.brandLogo}</span>
            <span className="font-bold">{ad.brandName}</span>
          </div>
        </div>

        {/* Pro Badge Callout */}
        <button
          onClick={onUpgradeToPro}
          className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold hover:border-amber-400 transition-all"
        >
          <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
          <span>Go Pro (No Ads)</span>
        </button>
      </div>

      {/* Main Video Ad Canvas Simulation */}
      <div className="relative flex-1 flex flex-col items-center justify-center p-6 text-center overflow-hidden">
        
        {/* Background Image with Pan effect */}
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-40 scale-105 transition-transform duration-10000 ease-out"
          style={{ backgroundImage: `url(${ad.sponsoredImage})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-slate-950/40" />

        {/* Drill Context Specific Sponsor Pill */}
        <div className="relative z-10 space-y-3 max-w-lg mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>Targeted Drill Gear for: <strong className="text-white">{drillTitle}</strong></span>
          </div>

          <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
            {ad.productTitle}
          </h3>

          <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto line-clamp-2">
            "{ad.description}"
          </p>

          <div className="flex items-center justify-center gap-3 pt-1">
            <div className="flex items-center gap-1 text-amber-400 text-xs font-bold">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              <span>{ad.rating}</span>
              <span className="text-slate-400 font-normal">({ad.reviewsCount} reviews)</span>
            </div>
            <span className="text-slate-600">•</span>
            <div className="text-xs font-black text-white">
              <span className="text-emerald-400 text-sm">{ad.price}</span>{' '}
              <span className="text-slate-500 line-through text-[11px] font-normal">{ad.originalPrice}</span>
            </div>
          </div>
        </div>

        {/* Video Player Progress Line */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-800 z-10">
          <div 
            className="h-full bg-amber-400 transition-all duration-1000 ease-linear"
            style={{ width: `${((5 - secondsRemaining) / 5) * 100}%` }}
          />
        </div>

      </div>

      {/* Bottom Controls Bar: Sponsor Card + YouTube Style "Skip Ad" Button */}
      <div className="p-4 bg-slate-950 border-t border-slate-800 z-20 flex flex-col sm:flex-row items-center justify-between gap-4">
        
        {/* Product Callout Card */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <img
            src={ad.sponsoredImage}
            alt={ad.productTitle}
            className="w-12 h-12 rounded-xl object-cover border border-slate-700 shrink-0"
          />
          <div className="text-left">
            <p className="text-xs font-bold text-white line-clamp-1">{ad.productTitle}</p>
            <p className="text-[11px] text-slate-400">{ad.brandName} • {ad.tagline}</p>
          </div>

          <button
            onClick={() => setShowProductDetailsModal(true)}
            className="ml-auto sm:ml-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center gap-1 shrink-0 cursor-pointer"
          >
            <ShoppingBag className="w-3.5 h-3.5 text-amber-400" />
            <span>Shop</span>
          </button>
        </div>

        {/* Skip Ad / Countdown Action Button */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          {canSkip ? (
            <button
              onClick={onAdCompleted}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-amber-400/20 transition-all cursor-pointer animate-pulse"
            >
              <span>Skip Ad</span>
              <FastForward className="w-4 h-4 fill-slate-950" />
            </button>
          ) : (
            <div className="w-full sm:w-auto px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 text-xs font-bold flex items-center justify-center gap-2">
              <div className="w-4 h-4 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
              <span>Skip in {secondsRemaining}s</span>
            </div>
          )}
        </div>

      </div>

      {/* Product Quick Sheet Modal */}
      {showProductDetailsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 text-left shadow-2xl relative">
            <button
              onClick={() => setShowProductDetailsModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white text-sm"
            >
              ✕
            </button>

            <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase">
              <Sparkles className="w-4 h-4" />
              <span>Official Drill Recommended Gear</span>
            </div>

            <img
              src={ad.sponsoredImage}
              alt={ad.productTitle}
              className="w-full h-44 rounded-xl object-cover border border-slate-800"
            />

            <div>
              <h4 className="text-base font-bold text-white">{ad.productTitle}</h4>
              <p className="text-xs text-slate-400 mt-1">{ad.description}</p>
            </div>

            <div className="space-y-1.5 pt-2 border-t border-slate-800">
              <p className="text-xs font-bold text-slate-300">Targeted Feature Specs:</p>
              {ad.highlightSpecs.map((spec, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs text-slate-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>{spec}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <div>
                <span className="text-lg font-extrabold text-white">{ad.price}</span>
                <span className="text-xs text-slate-500 line-through ml-2">{ad.originalPrice}</span>
              </div>

              <a
                href="#shop-drill-gear"
                onClick={(e) => {
                  e.preventDefault();
                  alert(`Redirecting to ${ad.brandName} official store page for ${ad.productTitle}`);
                  setShowProductDetailsModal(false);
                }}
                className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs flex items-center gap-1.5"
              >
                <span>Order Now</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
