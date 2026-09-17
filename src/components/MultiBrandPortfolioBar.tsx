import React, { useState } from 'react';
import { 
  Building2, 
  TrendingUp, 
  Bot, 
  Layers, 
  Check, 
  ChevronRight, 
  Sparkles, 
  ExternalLink,
  Info,
  ShieldCheck,
  BarChart3,
  Briefcase,
  Settings,
  Plus
} from 'lucide-react';
import { BRANDS, BRAND_PROFILES, BrandMetadata, ALL_BRANDS } from '../sampleDatasets';

interface Props {
  selectedBrand: string;
  onSelectBrand: (brand: string) => void;
  brandCounts: Record<string, number>;
  totalCount: number;
  brands?: string[];
  brandProfiles?: Record<string, BrandMetadata>;
  onOpenBrandManager?: () => void;
}

export const MultiBrandPortfolioBar: React.FC<Props> = ({
  selectedBrand,
  onSelectBrand,
  brandCounts,
  totalCount,
  brands = BRANDS,
  brandProfiles = BRAND_PROFILES,
  onOpenBrandManager,
}) => {
  const [showPortfolioDetails, setShowPortfolioDetails] = useState(false);

  const getBrandIcon = (brand: string) => {
    switch (brand) {
      case 'Uncle Robert Consulting':
        return <Briefcase className="h-3.5 w-3.5" />;
      case 'Fundable Consulting':
        return <TrendingUp className="h-3.5 w-3.5" />;
      case 'Agent Lab':
        return <Bot className="h-3.5 w-3.5" />;
      default:
        return <Building2 className="h-3.5 w-3.5" />;
    }
  };

  const getBrandAccent = (brand: string) => {
    const profile = brandProfiles[brand];
    if (profile) {
      return {
        activeBg: 'text-white shadow-xs',
        style: { backgroundColor: profile.primaryColor },
        hoverBg: 'hover:bg-slate-50 text-slate-700 hover:text-slate-900 border-slate-200',
        dot: profile.primaryColor,
      };
    }

    return {
      activeBg: 'bg-slate-900 text-white shadow-xs',
      style: {},
      hoverBg: 'hover:bg-slate-100 text-slate-700 hover:text-slate-900 border-slate-200',
      dot: '#475569',
    };
  };

  const activeProfile = selectedBrand !== ALL_BRANDS ? brandProfiles[selectedBrand] : null;

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
      {/* Brand Navigation Switcher */}
      <div className="px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-slate-50/80 via-white to-slate-50/80 border-b border-slate-100">
        
        {/* Left: Holding Company identity */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-slate-900 text-white px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase">
            <Building2 className="h-3 w-3 text-sky-400" />
            <span>Holding Portfolio</span>
          </div>
          <span className="text-xs font-semibold text-slate-600 hidden md:inline">
            Uncle Robert Consulting LLC
          </span>
          <span className="text-slate-300 hidden md:inline">•</span>
          <span className="text-[11px] text-slate-500 font-medium hidden lg:inline">
            {brands.length} Operating Brands Under Direct Executive Oversight
          </span>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          {onOpenBrandManager && (
            <button
              onClick={onOpenBrandManager}
              className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-700 hover:text-indigo-600 bg-white hover:bg-slate-50 px-2.5 py-1 rounded border border-slate-200 shadow-2xs transition-colors cursor-pointer"
            >
              <Settings className="h-3 w-3 text-slate-500" />
              <span>Manage Brands</span>
            </button>
          )}

          <button
            onClick={() => setShowPortfolioDetails(!showPortfolioDetails)}
            className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-600 hover:text-indigo-600 transition-colors cursor-pointer"
          >
            <Info className="h-3.5 w-3.5" />
            <span>{showPortfolioDetails ? 'Hide Brand Portfolio Matrix' : 'View Brand Portfolio Matrix'}</span>
          </button>
        </div>
      </div>

      {/* Brand Tabs Bar */}
      <div className="px-4 py-3 flex flex-wrap items-center gap-2 bg-white">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">
          Brand Scope:
        </span>

        {/* Consolidated Tab */}
        <button
          onClick={() => onSelectBrand(ALL_BRANDS)}
          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-all border cursor-pointer ${
            selectedBrand === ALL_BRANDS
              ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900'
          }`}
        >
          <Layers className="h-3.5 w-3.5" />
          <span>All Brands (Consolidated)</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
            selectedBrand === ALL_BRANDS ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-600'
          }`}>
            {totalCount}
          </span>
        </button>

        {/* Individual Brand Tabs */}
        {brands.map(brand => {
          const isSelected = selectedBrand === brand;
          const count = brandCounts[brand] || 0;
          const style = getBrandAccent(brand);

          return (
            <button
              key={brand}
              onClick={() => onSelectBrand(brand)}
              style={isSelected ? style.style : undefined}
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-all border cursor-pointer ${
                isSelected
                  ? style.activeBg + ' border-transparent'
                  : 'bg-white ' + style.hoverBg
              }`}
            >
              {getBrandIcon(brand)}
              <span>{brand}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                isSelected ? 'bg-black/20 text-white' : 'bg-slate-100 text-slate-600'
              }`}>
                {count}
              </span>
            </button>
          );
        })}

        {onOpenBrandManager && (
          <button
            onClick={onOpenBrandManager}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer ml-1"
            title="Add or configure brands"
          >
            <Plus className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Add Brand</span>
          </button>
        )}
      </div>

      {/* Dynamic Brand Contextual Callout */}
      {activeProfile && (
        <div className={`px-4 py-2 border-t ${activeProfile.badgeBg} ${activeProfile.badgeBorder} border-t flex flex-wrap items-center justify-between gap-3`}>
          <div className="flex items-center gap-2.5">
            <span className={`text-xs font-extrabold ${activeProfile.badgeText} uppercase tracking-wider flex items-center gap-1.5`}>
              {getBrandIcon(activeProfile.name)}
              {activeProfile.name} Active Focus:
            </span>
            <span className="text-xs text-slate-700 font-medium">
              {activeProfile.tagline}
            </span>
          </div>
          <span className="text-[11px] text-slate-500 italic hidden sm:inline">
            {activeProfile.focus}
          </span>
        </div>
      )}

      {/* Expanded Multi-Brand Portfolio Matrix Drawer */}
      {showPortfolioDetails && (
        <div className="border-t border-slate-200 bg-slate-50/70 p-4 transition-all animate-fadeIn">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Holding Organization Architecture &amp; Brand Mandates
                </h4>
                <p className="text-[11px] text-slate-500 font-medium">
                  Parent entity: Uncle Robert Consulting LLC — Overwatching {brands.join(', ')}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {onOpenBrandManager && (
                  <button
                    onClick={onOpenBrandManager}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded border border-indigo-200 cursor-pointer transition-colors"
                  >
                    <Settings className="h-3 w-3" />
                    <span>Edit Brands</span>
                  </button>
                )}
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  <ShieldCheck className="h-3 w-3" />
                  Executive Gated
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              {brands.map(brandName => {
                const profile = brandProfiles[brandName] || {
                  name: brandName,
                  tagline: 'Advisory Unit',
                  focus: 'Operations & Strategy',
                  badgeType: 'Operating Brand',
                  primaryColor: '#475569',
                  badgeBg: 'bg-slate-50',
                  badgeBorder: 'border-slate-200',
                  badgeText: 'text-slate-700',
                };
                const isSelected = selectedBrand === brandName;

                return (
                  <div
                    key={brandName}
                    onClick={() => onSelectBrand(brandName)}
                    className={`p-3.5 rounded-lg border bg-white transition-all cursor-pointer hover:shadow-md ${
                      isSelected
                        ? 'ring-2 ring-indigo-500/20'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                    style={isSelected ? { borderColor: profile.primaryColor } : undefined}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-6 h-6 rounded flex items-center justify-center font-bold text-xs text-white"
                          style={{ backgroundColor: profile.primaryColor }}
                        >
                          {brandName.substring(0, 2).toUpperCase()}
                        </div>
                        <span className="font-bold text-xs text-slate-900 truncate">
                          {profile.name}
                        </span>
                      </div>
                      {profile.badgeType && (
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${profile.badgeBg} ${profile.badgeBorder} ${profile.badgeText}`}>
                          {profile.badgeType}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-600 mb-2 font-medium line-clamp-2">
                      {profile.focus || profile.tagline}
                    </p>
                    <div className="text-[10px] space-y-1 text-slate-500 border-t border-slate-100 pt-2">
                      {profile.keyAccounts && (
                        <div className="flex justify-between">
                          <span>Key Accounts:</span>
                          <strong className="text-slate-800 truncate max-w-[140px]">{profile.keyAccounts}</strong>
                        </div>
                      )}
                      {profile.domain && (
                        <div className="flex justify-between">
                          <span>Portal:</span>
                          <span className="font-mono text-indigo-600">{profile.domain}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

