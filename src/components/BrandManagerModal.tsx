import React, { useState } from 'react';
import { 
  X, 
  Plus, 
  Trash2, 
  Edit3, 
  Building2, 
  Check, 
  AlertCircle, 
  RotateCcw, 
  ExternalLink,
  ShieldCheck,
  Globe,
  Tag,
  Briefcase,
  Upload,
  Image as ImageIcon,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { BrandMetadata, BRAND_PROFILES } from '../sampleDatasets';

export interface PresetLogo {
  id: string;
  name: string;
  description: string;
  dataUrl: string;
}

export const PRESET_LOGOS: PresetLogo[] = [
  {
    id: 'crest',
    name: 'Executive Shield',
    description: 'Corporate Crest & Holding Governance',
    dataUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none"><rect width="100" height="100" rx="20" fill="%230284c7"/><path d="M30 32v24c0 11 9 20 20 20s20-9 20-20V32" stroke="white" stroke-width="7" stroke-linecap="round"/><path d="M42 32h16c6 0 10 4 10 10s-4 10-10 10H42v16" stroke="%23bae6fd" stroke-width="5" stroke-linecap="round"/><circle cx="50" cy="52" r="4" fill="white"/></svg>',
  },
  {
    id: 'venture',
    name: 'Venture Growth',
    description: 'Fundraising & Escrow Deals',
    dataUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none"><rect width="100" height="100" rx="20" fill="%2316a34a"/><path d="M26 68L46 48l12 12 22-26" stroke="white" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/><path d="M64 34h16v16" stroke="white" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/><circle cx="78" cy="34" r="4" fill="%23bbf7d0"/></svg>',
  },
  {
    id: 'agent',
    name: 'Autonomous AI',
    description: 'Neural Agents & Compute Fleet',
    dataUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none"><rect width="100" height="100" rx="20" fill="%239333ea"/><circle cx="50" cy="50" r="14" fill="white"/><circle cx="50" cy="24" r="7" fill="%23e9d5ff"/><circle cx="74" cy="65" r="7" fill="%23e9d5ff"/><circle cx="26" cy="65" r="7" fill="%23e9d5ff"/><path d="M50 31v6M68 60l-6-4M32 60l6-4" stroke="white" stroke-width="4" stroke-linecap="round"/><circle cx="50" cy="50" r="6" fill="%239333ea"/></svg>',
  },
  {
    id: 'cloud',
    name: 'Cloud & Infra',
    description: 'Cloud Platform & Microservices',
    dataUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none"><rect width="100" height="100" rx="20" fill="%234f46e5"/><path d="M30 65h40a16 16 0 000-32 20 20 0 00-38-6 14 14 0 00-2 38z" fill="white"/><path d="M42 52l8-8 8 8M50 44v16" stroke="%234f46e5" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  },
  {
    id: 'capital',
    name: 'Capital Diamond',
    description: 'Valuation & M&A Escrows',
    dataUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none"><rect width="100" height="100" rx="20" fill="%23d97706"/><path d="M50 20L80 50 50 80 20 50z" fill="white"/><path d="M50 32L68 50 50 68 32 50z" fill="%23fef3c7"/><circle cx="50" cy="50" r="6" fill="%23d97706"/></svg>',
  },
  {
    id: 'globe',
    name: 'Global Network',
    description: 'Cross-Border Operations',
    dataUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none"><rect width="100" height="100" rx="20" fill="%230d9488"/><circle cx="50" cy="50" r="28" stroke="white" stroke-width="6"/><ellipse cx="50" cy="50" rx="14" ry="28" stroke="white" stroke-width="4"/><path d="M22 50h56" stroke="white" stroke-width="4"/></svg>',
  },
  {
    id: 'star',
    name: 'Sovereign Star',
    description: 'Flagship Strategic Brand',
    dataUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none"><rect width="100" height="100" rx="20" fill="%23e11d48"/><path d="M50 18l9 22 23 2-18 15 6 23-20-13-20 13 6-23-18-15 23-2z" fill="white"/><circle cx="50" cy="50" r="6" fill="%23e11d48"/></svg>',
  }
];

interface ColorOption {
  id: string;
  name: string;
  primaryColor: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
  dotColor: string;
}

export const COLOR_THEMES: ColorOption[] = [
  {
    id: 'sky',
    name: 'Executive Sky',
    primaryColor: '#0284c7',
    badgeBg: 'bg-sky-50 dark:bg-sky-950/40',
    badgeBorder: 'border-sky-300 dark:border-sky-800',
    badgeText: 'text-sky-700 dark:text-sky-300',
    dotColor: 'bg-sky-500',
  },
  {
    id: 'emerald',
    name: 'Venture Emerald',
    primaryColor: '#16a34a',
    badgeBg: 'bg-emerald-50 dark:bg-emerald-950/40',
    badgeBorder: 'border-emerald-300 dark:border-emerald-800',
    badgeText: 'text-emerald-700 dark:text-emerald-300',
    dotColor: 'bg-emerald-500',
  },
  {
    id: 'purple',
    name: 'Autonomous Purple',
    primaryColor: '#9333ea',
    badgeBg: 'bg-purple-50 dark:bg-purple-950/40',
    badgeBorder: 'border-purple-300 dark:border-purple-800',
    badgeText: 'text-purple-700 dark:text-purple-300',
    dotColor: 'bg-purple-500',
  },
  {
    id: 'indigo',
    name: 'Corporate Indigo',
    primaryColor: '#4f46e5',
    badgeBg: 'bg-indigo-50 dark:bg-indigo-950/40',
    badgeBorder: 'border-indigo-300 dark:border-indigo-800',
    badgeText: 'text-indigo-700 dark:text-indigo-300',
    dotColor: 'bg-indigo-500',
  },
  {
    id: 'amber',
    name: 'Capital Amber',
    primaryColor: '#d97706',
    badgeBg: 'bg-amber-50 dark:bg-amber-950/40',
    badgeBorder: 'border-amber-300 dark:border-amber-800',
    badgeText: 'text-amber-700 dark:text-amber-300',
    dotColor: 'bg-amber-500',
  },
  {
    id: 'rose',
    name: 'Strategic Rose',
    primaryColor: '#e11d48',
    badgeBg: 'bg-rose-50 dark:bg-rose-950/40',
    badgeBorder: 'border-rose-300 dark:border-rose-800',
    badgeText: 'text-rose-700 dark:text-rose-300',
    dotColor: 'bg-rose-500',
  },
  {
    id: 'teal',
    name: 'Tech Teal',
    primaryColor: '#0d9488',
    badgeBg: 'bg-teal-50 dark:bg-teal-950/40',
    badgeBorder: 'border-teal-300 dark:border-teal-800',
    badgeText: 'text-teal-700 dark:text-teal-300',
    dotColor: 'bg-teal-500',
  },
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  brands: string[];
  brandProfiles: Record<string, BrandMetadata>;
  onSaveBrands: (
    newBrands: string[],
    newProfiles: Record<string, BrandMetadata>,
    renameMap?: { oldName: string; newName: string }
  ) => void;
  onResetBrandsToDefault: () => void;
  brandCounts?: Record<string, number>;
}

export const BrandManagerModal: React.FC<Props> = ({
  isOpen,
  onClose,
  brands,
  brandProfiles,
  onSaveBrands,
  onResetBrandsToDefault,
  brandCounts = {},
}) => {
  const [activeTab, setActiveTab] = useState<'list' | 'add' | 'edit'>('list');
  const [editingBrandName, setEditingBrandName] = useState<string | null>(null);

  // Form states for Add / Edit
  const [formName, setFormName] = useState('');
  const [formBadgeType, setFormBadgeType] = useState('Operating Unit');
  const [formTagline, setFormTagline] = useState('');
  const [formFocus, setFormFocus] = useState('');
  const [formDomain, setFormDomain] = useState('');
  const [formKeyAccounts, setFormKeyAccounts] = useState('');
  const [selectedThemeId, setSelectedThemeId] = useState('sky');
  const [updateExistingRecords, setUpdateExistingRecords] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);

  // Deletion confirm state
  const [deleteConfirmBrand, setDeleteConfirmBrand] = useState<string | null>(null);
  const [reassignTarget, setReassignTarget] = useState<string>('');

  if (!isOpen) return null;

  const handleOpenAdd = () => {
    setFormName('');
    setFormBadgeType('Operating Advisory');
    setFormTagline('');
    setFormFocus('');
    setFormDomain('');
    setFormKeyAccounts('');
    setSelectedThemeId('indigo');
    setFormError(null);
    setActiveTab('add');
  };

  const handleOpenEdit = (brandName: string) => {
    const profile = brandProfiles[brandName];
    if (!profile) return;
    setEditingBrandName(brandName);
    setFormName(profile.name);
    setFormBadgeType(profile.badgeType || 'Operating Unit');
    setFormTagline(profile.tagline);
    setFormFocus(profile.focus);
    setFormDomain(profile.domain || '');
    setFormKeyAccounts(profile.keyAccounts || '');
    
    // Find matching theme
    const matched = COLOR_THEMES.find(t => t.primaryColor === profile.primaryColor);
    setSelectedThemeId(matched ? matched.id : 'sky');
    setUpdateExistingRecords(true);
    setFormError(null);
    setActiveTab('edit');
  };

  const handleSaveNewBrand = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = formName.trim();
    if (!trimmed) {
      setFormError('Brand name is required.');
      return;
    }
    if (brands.includes(trimmed)) {
      setFormError(`A brand named "${trimmed}" already exists.`);
      return;
    }

    const theme = COLOR_THEMES.find(t => t.id === selectedThemeId) || COLOR_THEMES[0];
    const newProfile: BrandMetadata = {
      name: trimmed,
      badgeType: formBadgeType.trim() || 'Operating Unit',
      tagline: formTagline.trim() || `${trimmed} Strategic Solutions`,
      focus: formFocus.trim() || 'Client solutions and managed operations.',
      domain: formDomain.trim() || `${trimmed.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
      keyAccounts: formKeyAccounts.trim() || 'Direct Client Engagements',
      primaryColor: theme.primaryColor,
      badgeBg: theme.badgeBg,
      badgeBorder: theme.badgeBorder,
      badgeText: theme.badgeText,
    };

    const nextBrands = [...brands, trimmed];
    const nextProfiles = {
      ...brandProfiles,
      [trimmed]: newProfile,
    };

    onSaveBrands(nextBrands, nextProfiles);
    setActiveTab('list');
  };

  const handleSaveEditBrand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBrandName) return;
    const trimmed = formName.trim();
    if (!trimmed) {
      setFormError('Brand name is required.');
      return;
    }
    if (trimmed !== editingBrandName && brands.includes(trimmed)) {
      setFormError(`Another brand named "${trimmed}" already exists.`);
      return;
    }

    const theme = COLOR_THEMES.find(t => t.id === selectedThemeId) || COLOR_THEMES[0];
    const updatedProfile: BrandMetadata = {
      name: trimmed,
      badgeType: formBadgeType.trim() || 'Operating Unit',
      tagline: formTagline.trim() || `${trimmed} Operations`,
      focus: formFocus.trim() || 'Executive and client operations.',
      domain: formDomain.trim() || `${trimmed.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
      keyAccounts: formKeyAccounts.trim() || 'Corporate Clients',
      primaryColor: theme.primaryColor,
      badgeBg: theme.badgeBg,
      badgeBorder: theme.badgeBorder,
      badgeText: theme.badgeText,
    };

    const nextBrands = brands.map(b => (b === editingBrandName ? trimmed : b));
    const nextProfiles = { ...brandProfiles };
    delete nextProfiles[editingBrandName];
    nextProfiles[trimmed] = updatedProfile;

    const renameMap = (trimmed !== editingBrandName && updateExistingRecords) 
      ? { oldName: editingBrandName, newName: trimmed }
      : undefined;

    onSaveBrands(nextBrands, nextProfiles, renameMap);
    setEditingBrandName(null);
    setActiveTab('list');
  };

  const handleDeleteBrand = (brandToDelete: string) => {
    if (brands.length <= 1) {
      setFormError('Portfolio must retain at least one active brand.');
      return;
    }

    const nextBrands = brands.filter(b => b !== brandToDelete);
    const nextProfiles = { ...brandProfiles };
    delete nextProfiles[brandToDelete];

    const targetReassign = reassignTarget || nextBrands[0];
    const renameMap = targetReassign ? { oldName: brandToDelete, newName: targetReassign } : undefined;

    onSaveBrands(nextBrands, nextProfiles, renameMap);
    setDeleteConfirmBrand(null);
    setReassignTarget('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fadeIn">
      <div 
        id="brand-manager-modal"
        className="flex max-h-[92vh] w-full max-w-4xl flex-col rounded-xl border border-slate-200 bg-white shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-900 px-6 py-4 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-500/20 text-sky-400 border border-sky-500/30">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold tracking-tight text-white">
                  Brand Portfolio Manager
                </h3>
                <span className="rounded bg-sky-400/20 px-2 py-0.5 text-[10px] font-bold text-sky-300 border border-sky-400/30 uppercase tracking-wider">
                  Holding Configuration
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Add, edit, or subtract operating brands under Uncle Robert Consulting LLC holding governance
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setActiveTab('list'); setFormError(null); }}
              className={`rounded-md px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'list'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Active Brands ({brands.length})
            </button>
            <button
              onClick={handleOpenAdd}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'add'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Plus className="h-3.5 w-3.5 text-emerald-600" />
              <span>Add New Brand</span>
            </button>
          </div>

          <button
            onClick={() => {
              if (confirm('Reset brand portfolio to the canonical default brands (Uncle Robert Consulting, Fundable Consulting, Agent Lab)?')) {
                onResetBrandsToDefault();
                setActiveTab('list');
              }
            }}
            className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
            title="Restore default holding brands"
          >
            <RotateCcw className="h-3 w-3" />
            <span>Reset to Defaults</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {formError && (
            <div className="mb-4 flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-800">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>{formError}</span>
            </div>
          )}

          {/* TAB: LIST BRANDS */}
          {activeTab === 'list' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    Operating Entities in Holding Portfolio
                  </h4>
                  <p className="text-xs text-slate-500">
                    Each entity maintains its own telemetry, financial pipeline, portal domains, and active customer accounts.
                  </p>
                </div>
                <button
                  onClick={handleOpenAdd}
                  className="inline-flex items-center gap-1.5 rounded-md bg-slate-900 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add Brand</span>
                </button>
              </div>

              <div className="grid grid-cols-1 gap-3.5">
                {brands.map(brandName => {
                  const profile = brandProfiles[brandName] || {
                    name: brandName,
                    tagline: 'Advisory Unit',
                    focus: 'Operations & Strategy',
                    primaryColor: '#475569',
                    badgeBg: 'bg-slate-50',
                    badgeBorder: 'border-slate-200',
                    badgeText: 'text-slate-700',
                  };
                  const count = brandCounts[brandName] || 0;

                  return (
                    <div
                      key={brandName}
                      className="rounded-lg border border-slate-200 bg-white p-4 shadow-xs hover:border-slate-300 transition-all"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div
                            className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white font-extrabold text-sm shadow-xs"
                            style={{ backgroundColor: profile.primaryColor }}
                          >
                            {brandName.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h5 className="text-sm font-bold text-slate-900">
                                {profile.name}
                              </h5>
                              {profile.badgeType && (
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${profile.badgeBg} ${profile.badgeBorder} ${profile.badgeText}`}>
                                  {profile.badgeType}
                                </span>
                              )}
                              <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                                {count} {count === 1 ? 'dataset record' : 'dataset records'}
                              </span>
                            </div>
                            <p className="mt-1 text-xs font-medium text-slate-700">
                              {profile.tagline}
                            </p>
                            <p className="mt-0.5 text-xs text-slate-500">
                              {profile.focus}
                            </p>
                            
                            <div className="mt-2 flex flex-wrap items-center gap-4 text-[11px] text-slate-500">
                              {profile.domain && (
                                <div className="flex items-center gap-1 font-mono text-slate-600">
                                  <Globe className="h-3 w-3 text-slate-400" />
                                  <span>{profile.domain}</span>
                                </div>
                              )}
                              {profile.keyAccounts && (
                                <div className="flex items-center gap-1">
                                  <Briefcase className="h-3 w-3 text-slate-400" />
                                  <span>Scope: <strong className="text-slate-700">{profile.keyAccounts}</strong></span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-1.5 self-start">
                          <button
                            onClick={() => handleOpenEdit(brandName)}
                            className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer"
                          >
                            <Edit3 className="h-3.5 w-3.5 text-slate-500" />
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={() => {
                              setDeleteConfirmBrand(brandName);
                              const remaining = brands.filter(b => b !== brandName);
                              setReassignTarget(remaining[0] || '');
                            }}
                            disabled={brands.length <= 1}
                            className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50 hover:border-rose-200 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                            title={brands.length <= 1 ? "At least one brand must remain" : "Remove brand"}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span>Remove</span>
                          </button>
                        </div>
                      </div>

                      {/* In-card Delete Confirmation */}
                      {deleteConfirmBrand === brandName && (
                        <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50/70 p-3 text-xs text-slate-800 animate-fadeIn">
                          <div className="flex items-center gap-2 font-bold text-rose-900">
                            <AlertCircle className="h-4 w-4 text-rose-600" />
                            <span>Confirm Brand Subtraction</span>
                          </div>
                          <p className="mt-1 text-slate-600">
                            Are you sure you want to remove <strong>{brandName}</strong> from the active portfolio?
                          </p>
                          {count > 0 && (
                            <div className="mt-2 space-y-1">
                              <label className="font-semibold text-slate-700">
                                Reassign {count} existing records to:
                              </label>
                              <select
                                value={reassignTarget}
                                onChange={(e) => setReassignTarget(e.target.value)}
                                className="w-full rounded border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800"
                              >
                                {brands.filter(b => b !== brandName).map(b => (
                                  <option key={b} value={b}>{b}</option>
                                ))}
                              </select>
                            </div>
                          )}
                          <div className="mt-3 flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setDeleteConfirmBrand(null)}
                              className="rounded bg-white px-3 py-1 text-xs font-semibold text-slate-600 border border-slate-200 hover:bg-slate-50 cursor-pointer"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteBrand(brandName)}
                              className="rounded bg-rose-600 px-3 py-1 text-xs font-bold text-white hover:bg-rose-700 cursor-pointer shadow-xs"
                            >
                              Confirm Removal
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB: ADD OR EDIT BRAND FORM */}
          {(activeTab === 'add' || activeTab === 'edit') && (
            <form onSubmit={activeTab === 'add' ? handleSaveNewBrand : handleSaveEditBrand} className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h4 className="text-sm font-bold text-slate-900">
                  {activeTab === 'add' ? 'Register New Operating Brand' : `Edit Brand Profile: ${editingBrandName}`}
                </h4>
                <button
                  type="button"
                  onClick={() => setActiveTab('list')}
                  className="text-xs text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  Back to Brand List
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Brand Name */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                    Brand / Entity Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Acme Strategic Ventures LLC"
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-900 focus:border-indigo-500 focus:outline-hidden"
                  />
                </div>

                {/* Badge Type */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                    Brand Category / Classification
                  </label>
                  <input
                    type="text"
                    value={formBadgeType}
                    onChange={(e) => setFormBadgeType(e.target.value)}
                    placeholder="e.g. Advisory, SaaS & Tech, Venture Fund, PE Diligence"
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-900 focus:border-indigo-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Tagline */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                  Tagline / Executive Mission Statement
                </label>
                <input
                  type="text"
                  value={formTagline}
                  onChange={(e) => setFormTagline(e.target.value)}
                  placeholder="e.g. Cross-Border M&A Structuring & Sovereign Capital Advisory"
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-900 focus:border-indigo-500 focus:outline-hidden"
                />
              </div>

              {/* Focus / Scope */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                  Strategic Focus &amp; Core Mandate
                </label>
                <textarea
                  rows={2}
                  value={formFocus}
                  onChange={(e) => setFormFocus(e.target.value)}
                  placeholder="e.g. Enterprise Retainers, Due Diligence Audits, Autonomous AI Orchestration, Syndicate Escrows"
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-900 focus:border-indigo-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Domain */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                    Website / Portal Domain
                  </label>
                  <input
                    type="text"
                    value={formDomain}
                    onChange={(e) => setFormDomain(e.target.value)}
                    placeholder="e.g. acmeventures.com"
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-900 focus:border-indigo-500 focus:outline-hidden"
                  />
                </div>

                {/* Key Accounts / Offerings */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                    Key Accounts / Representative Offerings
                  </label>
                  <input
                    type="text"
                    value={formKeyAccounts}
                    onChange={(e) => setFormKeyAccounts(e.target.value)}
                    placeholder="e.g. Fortune 100 Accounts, Pitch Sprints, Microservices"
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-900 focus:border-indigo-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Theme Color Selector */}
              <div className="space-y-1.5 pt-2">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                  Brand Color Scheme &amp; Visual Identity
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {COLOR_THEMES.map(theme => (
                    <button
                      key={theme.id}
                      type="button"
                      onClick={() => setSelectedThemeId(theme.id)}
                      className={`flex items-center gap-2 p-2 rounded-lg border text-left text-xs font-semibold transition-all cursor-pointer ${
                        selectedThemeId === theme.id
                          ? 'border-slate-900 bg-slate-50 ring-2 ring-slate-900/10'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <span
                        className="w-3.5 h-3.5 rounded-full shrink-0"
                        style={{ backgroundColor: theme.primaryColor }}
                      />
                      <span className="truncate">{theme.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Edit Mode: Synchronize existing records checkbox */}
              {activeTab === 'edit' && editingBrandName && formName.trim() !== editingBrandName && (
                <div className="mt-2 rounded-md bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900">
                  <label className="flex items-center gap-2 font-medium cursor-pointer">
                    <input
                      type="checkbox"
                      checked={updateExistingRecords}
                      onChange={(e) => setUpdateExistingRecords(e.target.checked)}
                      className="rounded border-amber-400 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>
                      Automatically reassign all existing dataset records from <strong>"{editingBrandName}"</strong> to <strong>"{formName.trim()}"</strong>
                    </span>
                  </label>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setActiveTab('list')}
                  className="rounded-md border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-md bg-slate-900 px-5 py-2 text-xs font-bold text-white hover:bg-slate-800 transition-colors cursor-pointer shadow-xs"
                >
                  {activeTab === 'add' ? 'Add Brand to Portfolio' : 'Save Changes'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-3 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span>Executive Holding Governance: Changes immediately synchronize with financial records, tables, and filters</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="font-bold text-slate-700 hover:text-slate-900 cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
