import React, { useState } from 'react';
import { 
  Layers, 
  CheckCircle2, 
  Clock, 
  AlertOctagon, 
  DollarSign, 
  Sparkles, 
  X, 
  Search, 
  Filter, 
  Plus, 
  ArrowRight, 
  ShieldAlert, 
  ShieldCheck, 
  Key, 
  Server, 
  Cpu, 
  Database, 
  Code2, 
  Activity, 
  ExternalLink,
  RefreshCw,
  Zap,
  Info,
  Building2,
  Tag
} from 'lucide-react';
import { Dataset } from '../types';
import { rawTechStackData } from '../sampleDatasets';
import { formatNumber } from '../utils/dataProcessing';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentDataset: Dataset;
  onSelectTechStackDataset: () => void;
  onUpdateTechStackData: (updatedRecords: Record<string, any>[]) => void;
}

export const TechStackRegistryModal: React.FC<Props> = ({
  isOpen,
  onClose,
  currentDataset,
  onSelectTechStackDataset,
  onUpdateTechStackData,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'legacy' | 'lost' | 'add'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedToolDetail, setSelectedToolDetail] = useState<Record<string, any> | null>(null);

  // Local working copy of tech stack
  const [records, setRecords] = useState<Record<string, any>[]>(() => {
    if (currentDataset.id === 'tech-stack-lifecycle') {
      return currentDataset.data;
    }
    return rawTechStackData;
  });

  // Form state for adding new technology or transition
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('AI & LLM Orchestration');
  const [formStatus, setFormStatus] = useState<'Active (In Production)' | 'Legacy Available' | 'Lost Access / Deprecated'>('Active (In Production)');
  const [formWorkload, setFormWorkload] = useState('');
  const [formAccessStatus, setFormAccessStatus] = useState('Active Enterprise SSO');
  const [formWhyLost, setFormWhyLost] = useState('');
  const [formSuccessor, setFormSuccessor] = useState('Current Production Standard');
  const [formMonthlyCost, setFormMonthlyCost] = useState('0');
  const [formOwner, setFormOwner] = useState('AI Engineering');
  const [formCredentials, setFormCredentials] = useState('Verified & Monitored');
  const [formAdoptionQuarter, setFormAdoptionQuarter] = useState('2024-Q3');
  const [formDeprecationQuarter, setFormDeprecationQuarter] = useState('Active');
  const [formHealthScore, setFormHealthScore] = useState('95');

  if (!isOpen) return null;

  // Counts & Aggregates
  const activeCount = records.filter(r => r.LifecycleStatus === 'Active (In Production)').length;
  const legacyCount = records.filter(r => r.LifecycleStatus === 'Legacy Available').length;
  const lostCount = records.filter(r => r.LifecycleStatus === 'Lost Access / Deprecated').length;
  const totalActiveSpend = records
    .filter(r => r.LifecycleStatus === 'Active (In Production)')
    .reduce((acc, r) => acc + (Number(r.MonthlyCostUSD) || 0), 0);

  // Categories list
  const categories = ['All', ...Array.from(new Set(records.map(r => String(r.Category))))];

  // Filtering
  const filteredRecords = records.filter(r => {
    const matchesTab = 
      activeTab === 'all' ? true :
      activeTab === 'active' ? r.LifecycleStatus === 'Active (In Production)' :
      activeTab === 'legacy' ? r.LifecycleStatus === 'Legacy Available' :
      activeTab === 'lost' ? r.LifecycleStatus === 'Lost Access / Deprecated' :
      true;

    const matchesCategory = selectedCategory === 'All' || r.Category === selectedCategory;

    const q = searchQuery.toLowerCase().trim();
    const matchesQuery = !q || (
      String(r.TechName).toLowerCase().includes(q) ||
      String(r.CurrentOrPastWorkload).toLowerCase().includes(q) ||
      String(r.WhyLostOrDeprecated).toLowerCase().includes(q) ||
      String(r.SuccessorTech).toLowerCase().includes(q) ||
      String(r.TeamOwner).toLowerCase().includes(q) ||
      String(r.Category).toLowerCase().includes(q)
    );

    return matchesTab && matchesCategory && matchesQuery;
  });

  // Handle status transition quick update
  const handleTransitionStatus = (techName: string, newStatus: 'Active (In Production)' | 'Legacy Available' | 'Lost Access / Deprecated', reason?: string) => {
    const updated = records.map(r => {
      if (r.TechName === techName) {
        return {
          ...r,
          LifecycleStatus: newStatus,
          WhyLostOrDeprecated: reason || (
            newStatus === 'Lost Access / Deprecated' 
              ? 'Marked as lost access: Subscription closed or API deprecated.'
              : newStatus === 'Legacy Available'
              ? 'Shifted to backup / fallback status. Grandfathered credentials kept.'
              : 'Promoted back to Active Production standard.'
          ),
          DeprecationQuarter: newStatus === 'Active (In Production)' ? 'Active' : '2025-Q1',
          MonthlyCostUSD: newStatus === 'Lost Access / Deprecated' ? 0 : r.MonthlyCostUSD,
        };
      }
      return r;
    });
    setRecords(updated);
    onUpdateTechStackData(updated);
    if (selectedToolDetail && selectedToolDetail.TechName === techName) {
      setSelectedToolDetail(updated.find(x => x.TechName === techName) || null);
    }
  };

  // Add new tool
  const handleAddToolSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    const newRecord = {
      TechName: formName.trim(),
      Category: formCategory,
      LifecycleStatus: formStatus,
      CurrentOrPastWorkload: formWorkload.trim() || 'No specific workload defined yet.',
      AccessStatus: formAccessStatus,
      WhyLostOrDeprecated: formWhyLost.trim() || (formStatus === 'Active (In Production)' ? 'Adopted as current standard for team productivity.' : 'Deprecated or access lost.'),
      SuccessorTech: formSuccessor.trim() || (formStatus === 'Active (In Production)' ? 'Current Production Standard' : 'In-House Stack'),
      MonthlyCostUSD: parseFloat(formMonthlyCost) || 0,
      TeamOwner: formOwner,
      CredentialsState: formCredentials,
      AdoptionQuarter: formAdoptionQuarter,
      DeprecationQuarter: formStatus === 'Active (In Production)' ? 'Active' : formDeprecationQuarter,
      HealthScore: parseInt(formHealthScore) || (formStatus === 'Active (In Production)' ? 95 : formStatus === 'Legacy Available' ? 80 : 20),
    };

    const updated = [newRecord, ...records];
    setRecords(updated);
    onUpdateTechStackData(updated);

    // Reset Form
    setFormName('');
    setFormWorkload('');
    setFormWhyLost('');
    setActiveTab('all');
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'AI & LLM Orchestration':
        return <Cpu className="h-4 w-4 text-purple-600" />;
      case 'Cloud & Compute Infrastructure':
        return <Server className="h-4 w-4 text-blue-600" />;
      case 'Databases & Vector Storage':
        return <Database className="h-4 w-4 text-emerald-600" />;
      case 'Developer Tooling & CI/CD':
        return <Code2 className="h-4 w-4 text-indigo-600" />;
      case 'Monitoring & Observability':
        return <Activity className="h-4 w-4 text-amber-600" />;
      case 'Customer & Revenue Ops':
        return <DollarSign className="h-4 w-4 text-rose-600" />;
      default:
        return <Zap className="h-4 w-4 text-slate-600" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 md:p-6 overflow-y-auto">
      <div className="relative w-full max-w-6xl rounded-xl border border-slate-200 bg-white shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/90 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-xs">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  Tech Stack Architecture & Lifecycle Registry
                </h3>
                <span className="rounded bg-indigo-100 border border-indigo-200 px-2 py-0.5 text-[10px] font-bold text-indigo-800 uppercase tracking-wider">
                  Live Stack Registry
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Track active production technologies, dormant legacy tools still accessible, and past tools with lost access & deprecation reasons.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {currentDataset.id !== 'tech-stack-lifecycle' && (
              <button
                onClick={() => {
                  onSelectTechStackDataset();
                  onClose();
                }}
                className="inline-flex items-center gap-1.5 rounded border border-indigo-300 bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-800 hover:bg-indigo-100 transition-colors cursor-pointer"
              >
                <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
                <span>Switch Dashboard to Tech Stack</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="rounded p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Executive Tech Metrics Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 border-b border-slate-200 bg-white p-4">
          
          <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-3 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                Active in Production
              </span>
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-black text-emerald-900 font-mono">
                {activeCount}
              </span>
              <span className="text-xs font-bold text-emerald-700">tools</span>
            </div>
            <span className="text-[10px] text-emerald-700 font-medium mt-0.5 block">
              Core daily production stack
            </span>
          </div>

          <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-3 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800">
                Legacy Available
              </span>
              <Clock className="h-4 w-4 text-amber-600" />
            </div>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-black text-amber-900 font-mono">
                {legacyCount}
              </span>
              <span className="text-xs font-bold text-amber-700">tools</span>
            </div>
            <span className="text-[10px] text-amber-700 font-medium mt-0.5 block">
              Past tech, access & keys kept
            </span>
          </div>

          <div className="rounded-lg border border-rose-200 bg-rose-50/50 p-3 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-800">
                Lost Access & Sunset
              </span>
              <AlertOctagon className="h-4 w-4 text-rose-600" />
            </div>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-black text-rose-900 font-mono">
                {lostCount}
              </span>
              <span className="text-xs font-bold text-rose-700">tools</span>
            </div>
            <span className="text-[10px] text-rose-700 font-medium mt-0.5 block">
              Vendor sunset, price hike, shut down
            </span>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-3 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Active Monthly Spend
              </span>
              <DollarSign className="h-4 w-4 text-slate-500" />
            </div>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-black text-slate-900 font-mono">
                ${formatNumber(totalActiveSpend)}
              </span>
              <span className="text-xs text-slate-500 font-bold">/mo</span>
            </div>
            <span className="text-[10px] text-slate-500 font-medium mt-0.5 block">
              Cloud + models + subscriptions
            </span>
          </div>

        </div>

        {/* Filters & Tabs Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-200 bg-slate-100/70 px-6 py-2.5">
          
          {/* Status Tab buttons */}
          <div className="flex items-center gap-1 overflow-x-auto">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'all'
                  ? 'bg-white text-indigo-900 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <Layers className="h-3.5 w-3.5 text-indigo-600" />
              <span>All Tech ({records.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('active')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'active'
                  ? 'bg-white text-emerald-900 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              <span>Currently In Use ({activeCount})</span>
            </button>

            <button
              onClick={() => setActiveTab('legacy')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'legacy'
                  ? 'bg-white text-amber-900 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <Clock className="h-3.5 w-3.5 text-amber-600" />
              <span>Past Tech Still Accessible ({legacyCount})</span>
            </button>

            <button
              onClick={() => setActiveTab('lost')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'lost'
                  ? 'bg-white text-rose-900 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <AlertOctagon className="h-3.5 w-3.5 text-rose-600" />
              <span>Lost Access & Why ({lostCount})</span>
            </button>

            <button
              onClick={() => setActiveTab('add')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'add'
                  ? 'bg-white text-indigo-900 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <Plus className="h-3.5 w-3.5 text-indigo-600" />
              <span>Add / Log Tech</span>
            </button>
          </div>

          {/* Search & Category Filter */}
          {activeTab !== 'add' && (
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search tool, workload, reason..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="rounded-md border border-slate-300 bg-white pl-8 pr-3 py-1 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:outline-hidden w-48 sm:w-60"
                />
              </div>

              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs text-slate-800 focus:border-indigo-500 focus:outline-hidden"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>
                    {cat === 'All' ? 'All Categories' : cat}
                  </option>
                ))}
              </select>
            </div>
          )}

        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          
          {/* TAB 1, 2, 3, 4: CARDS LIST */}
          {activeTab !== 'add' && (
            <div className="space-y-4">
              
              {/* Contextual description banners based on active tab */}
              {activeTab === 'active' && (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-3 flex items-start gap-2.5 text-xs text-emerald-900">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                  <div>
                    <span className="font-bold">Currently in Use:</span> These tools power the live Agent Lab OS, Cloud Run microservices, and client portals today. Below you can see exactly what each tool is used for, who owns it, and current monthly spend.
                  </div>
                </div>
              )}

              {activeTab === 'legacy' && (
                <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-3 flex items-start gap-2.5 text-xs text-amber-900">
                  <Clock className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                  <div>
                    <span className="font-bold">Past Tech Still Available:</span> We no longer use these as our primary production standard, but our accounts, grandfathered free tiers, or emergency fallback credentials remain valid and tested. We can reactivate them without re-negotiating contracts.
                  </div>
                </div>
              )}

              {activeTab === 'lost' && (
                <div className="rounded-lg border border-rose-200 bg-rose-50/60 p-3 flex items-start gap-2.5 text-xs text-rose-900">
                  <AlertOctagon className="h-4 w-4 text-rose-600 mt-0.5 shrink-0" />
                  <div>
                    <span className="font-bold">Past Tech With Lost Access:</span> Detailed post-mortem registry of tools we previously used but can no longer access, highlighting the exact cause (vendor price surge, free tier deprecation, pilot expiration, or intentional decommissioning) and the successor tech we migrated to.
                  </div>
                </div>
              )}

              {filteredRecords.length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-slate-500 text-xs">
                  No technologies match your search or filter criteria.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredRecords.map((item, idx) => {
                    const isActive = item.LifecycleStatus === 'Active (In Production)';
                    const isLegacy = item.LifecycleStatus === 'Legacy Available';
                    const isLost = item.LifecycleStatus === 'Lost Access / Deprecated';

                    return (
                      <div
                        key={`${item.TechName}-${idx}`}
                        className={`rounded-lg border transition-all p-4 flex flex-col justify-between ${
                          isActive
                            ? 'border-emerald-200 bg-white hover:border-emerald-300 shadow-2xs'
                            : isLegacy
                            ? 'border-amber-200 bg-amber-50/20 hover:border-amber-300 shadow-2xs'
                            : 'border-rose-200 bg-rose-50/20 hover:border-rose-300 shadow-2xs'
                        }`}
                      >
                        {/* Top: Name, Category, Status Badge */}
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <div className={`p-1.5 rounded-md ${
                                isActive ? 'bg-emerald-100 text-emerald-800' :
                                isLegacy ? 'bg-amber-100 text-amber-800' :
                                'bg-rose-100 text-rose-800'
                              }`}>
                                {getCategoryIcon(item.Category)}
                              </div>
                              <div>
                                <h4 className="text-sm font-bold text-slate-900 leading-tight">
                                  {item.TechName}
                                </h4>
                                <span className="text-[10px] text-slate-500 font-medium">
                                  {item.Category} • Owned by {item.TeamOwner}
                                </span>
                              </div>
                            </div>

                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border tracking-wider uppercase shrink-0 ${
                              isActive
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : isLegacy
                                ? 'bg-amber-50 text-amber-800 border-amber-200'
                                : 'bg-rose-50 text-rose-800 border-rose-200'
                            }`}>
                              {isActive ? 'In Production' : isLegacy ? 'Legacy Available' : 'Lost Access'}
                            </span>
                          </div>

                          {/* Workload / Purpose Callout */}
                          <div className="mt-3 rounded-md bg-slate-50 border border-slate-100 p-2.5">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                              {isActive ? 'Current Workload & Purpose:' : 'Past Workload & Historic Purpose:'}
                            </span>
                            <p className="text-xs text-slate-800 font-medium mt-0.5 leading-relaxed">
                              {item.CurrentOrPastWorkload}
                            </p>
                          </div>

                          {/* WHY LOST / WHY DEPRECATED / WHY SELECTED */}
                          <div className={`mt-2 rounded-md p-2.5 border ${
                            isLost 
                              ? 'bg-rose-50/80 border-rose-200 text-rose-950' 
                              : isLegacy
                              ? 'bg-amber-50/70 border-amber-200 text-amber-950'
                              : 'bg-emerald-50/40 border-emerald-100 text-emerald-950'
                          }`}>
                            <span className={`text-[10px] font-bold uppercase tracking-wider block ${
                              isLost ? 'text-rose-800' : isLegacy ? 'text-amber-800' : 'text-emerald-800'
                            }`}>
                              {isLost ? 'Why Access Was Lost & Sunset:' : isLegacy ? 'Why Shifted & Current Access:' : 'Why Chosen / Value Delivered:'}
                            </span>
                            <p className="text-xs mt-0.5 font-medium leading-relaxed">
                              {item.WhyLostOrDeprecated}
                            </p>
                          </div>

                          {/* Metadata row: Successor, Cost, Credentials */}
                          <div className="grid grid-cols-3 gap-2 mt-3 pt-2 border-t border-slate-100 text-[11px]">
                            <div>
                              <span className="text-[10px] font-bold text-slate-400 uppercase block">
                                {isLost || isLegacy ? 'Replaced By' : 'Standard'}
                              </span>
                              <span className="font-semibold text-slate-800 truncate block">
                                {item.SuccessorTech || 'Current'}
                              </span>
                            </div>

                            <div>
                              <span className="text-[10px] font-bold text-slate-400 uppercase block">
                                Monthly Cost
                              </span>
                              <span className="font-bold font-mono text-slate-900">
                                {Number(item.MonthlyCostUSD) > 0 ? `$${item.MonthlyCostUSD}/mo` : '$0 (Free/Grandfathered)'}
                              </span>
                            </div>

                            <div>
                              <span className="text-[10px] font-bold text-slate-400 uppercase block">
                                Access Status
                              </span>
                              <span className="font-medium text-slate-700 truncate block">
                                {item.AccessStatus}
                              </span>
                            </div>
                          </div>

                          {/* Credentials status badge */}
                          <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500 pt-1.5 border-t border-slate-100">
                            <span className="flex items-center gap-1">
                              <Key className="h-3 w-3 text-slate-400" />
                              <span className="truncate">{item.CredentialsState}</span>
                            </span>
                            <span className="font-mono text-slate-400">
                              {item.AdoptionQuarter} → {item.DeprecationQuarter}
                            </span>
                          </div>
                        </div>

                        {/* Status Quick-Transition Controls */}
                        <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                          <span className="text-[10px] text-slate-400 font-medium">
                            Change status:
                          </span>
                          <div className="flex items-center gap-1.5">
                            {!isActive && (
                              <button
                                onClick={() => handleTransitionStatus(item.TechName, 'Active (In Production)')}
                                className="px-2 py-0.5 rounded text-[10px] font-bold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 transition-colors cursor-pointer"
                                title="Promote to Active Production"
                              >
                                Move to Active
                              </button>
                            )}
                            {!isLegacy && (
                              <button
                                onClick={() => handleTransitionStatus(item.TechName, 'Legacy Available')}
                                className="px-2 py-0.5 rounded text-[10px] font-bold text-amber-800 bg-amber-100 hover:bg-amber-200 transition-colors cursor-pointer"
                                title="Mark as Legacy Available Backup"
                              >
                                Move to Legacy
                              </button>
                            )}
                            {!isLost && (
                              <button
                                onClick={() => {
                                  const reason = prompt(`Enter reason why access was lost for ${item.TechName}:`, 'Vendor price hike or subscription canceled');
                                  if (reason) {
                                    handleTransitionStatus(item.TechName, 'Lost Access / Deprecated', reason);
                                  }
                                }}
                                className="px-2 py-0.5 rounded text-[10px] font-bold text-rose-800 bg-rose-100 hover:bg-rose-200 transition-colors cursor-pointer"
                                title="Mark as Lost Access & Record Reason"
                              >
                                Mark Lost Access
                              </button>
                            )}
                          </div>
                        </div>

                      </div>
                    );
                  })}
                </div>
              )}

            </div>
          )}

          {/* TAB 5: ADD NEW TECH / RECORD DEPRECATION */}
          {activeTab === 'add' && (
            <form onSubmit={handleAddToolSubmit} className="max-w-3xl mx-auto bg-slate-50/70 p-6 rounded-lg border border-slate-200 space-y-4">
              <div>
                <h4 className="text-sm font-bold text-slate-900">
                  Record New Technology or Document Lost Access
                </h4>
                <p className="text-xs text-slate-500 font-medium">
                  Keep our architecture registry updated so every engineer and stakeholder knows what tools are active, what backups we have, and why past tech was decommissioned.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                
                <div className="space-y-1">
                  <label className="font-bold uppercase tracking-wider text-[10px] text-slate-600">
                    Technology / Tool Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Pinecone, Datadog, Supabase, Neon"
                    className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-slate-800 focus:border-indigo-500 focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold uppercase tracking-wider text-[10px] text-slate-600">
                    Lifecycle Status
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-slate-800 focus:border-indigo-500 focus:outline-hidden"
                  >
                    <option value="Active (In Production)">Active (In Production - Currently Used)</option>
                    <option value="Legacy Available">Legacy Available (Past Tech, Still Accessible)</option>
                    <option value="Lost Access / Deprecated">Lost Access / Deprecated (Access Lost / Sunset)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold uppercase tracking-wider text-[10px] text-slate-600">
                    Category
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-slate-800 focus:border-indigo-500 focus:outline-hidden"
                  >
                    <option value="AI & LLM Orchestration">AI & LLM Orchestration</option>
                    <option value="Cloud & Compute Infrastructure">Cloud & Compute Infrastructure</option>
                    <option value="Databases & Vector Storage">Databases & Vector Storage</option>
                    <option value="Developer Tooling & CI/CD">Developer Tooling & CI/CD</option>
                    <option value="Monitoring & Observability">Monitoring & Observability</option>
                    <option value="Customer & Revenue Ops">Customer & Revenue Ops</option>
                    <option value="Integrations & Automation">Integrations & Automation</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold uppercase tracking-wider text-[10px] text-slate-600">
                    Team Owner
                  </label>
                  <select
                    value={formOwner}
                    onChange={(e) => setFormOwner(e.target.value)}
                    className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-slate-800 focus:border-indigo-500 focus:outline-hidden"
                  >
                    <option value="AI Engineering">AI Engineering</option>
                    <option value="Core Infrastructure">Core Infrastructure</option>
                    <option value="DevOps & Security">DevOps & Security</option>
                    <option value="Product Eng">Product Eng</option>
                    <option value="Growth & Sales">Growth & Sales</option>
                    <option value="Founders / Finance">Founders / Finance</option>
                  </select>
                </div>

                <div className="col-span-1 md:col-span-2 space-y-1">
                  <label className="font-bold uppercase tracking-wider text-[10px] text-slate-600">
                    {formStatus === 'Active (In Production)' ? 'What is this tech currently being used for?' : 'What was this tech used for?'}
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={formWorkload}
                    onChange={(e) => setFormWorkload(e.target.value)}
                    placeholder="Describe specific workload, e.g. Used for fast vector search embeddings, event streaming, multi-region database failover..."
                    className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-slate-800 focus:border-indigo-500 focus:outline-hidden"
                  />
                </div>

                <div className="col-span-1 md:col-span-2 space-y-1">
                  <label className="font-bold uppercase tracking-wider text-[10px] text-slate-600">
                    {formStatus === 'Lost Access / Deprecated' 
                      ? 'Why did we lose access and why was it sunsetted? (Crucial post-mortem details)' 
                      : formStatus === 'Legacy Available'
                      ? 'Why did we shift away from it, and what access do we still retain?'
                      : 'Why was this tech chosen as the current standard?'}
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={formWhyLost}
                    onChange={(e) => setFormWhyLost(e.target.value)}
                    placeholder={
                      formStatus === 'Lost Access / Deprecated'
                        ? 'e.g. Free tier sunsetted by vendor, pricing increased 10x to $5k/mo, AWS org closed to eliminate $4.2k idle compute, trial expired without renewal...'
                        : 'e.g. Grandfathered free tier preserved for backup querying, migrated to GCP for VPC security...'
                    }
                    className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-slate-800 focus:border-indigo-500 focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold uppercase tracking-wider text-[10px] text-slate-600">
                    Successor / Replacement Technology
                  </label>
                  <input
                    type="text"
                    value={formSuccessor}
                    onChange={(e) => setFormSuccessor(e.target.value)}
                    placeholder="e.g. Google Cloud Run, pgvector on Postgres, MCP servers"
                    className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-slate-800 focus:border-indigo-500 focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold uppercase tracking-wider text-[10px] text-slate-600">
                    Monthly Cost ($ USD)
                  </label>
                  <input
                    type="number"
                    value={formMonthlyCost}
                    onChange={(e) => setFormMonthlyCost(e.target.value)}
                    placeholder="0"
                    className="w-full rounded border border-slate-300 bg-white px-3 py-2 font-mono text-slate-800 focus:border-indigo-500 focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold uppercase tracking-wider text-[10px] text-slate-600">
                    Access & Credentials State
                  </label>
                  <select
                    value={formCredentials}
                    onChange={(e) => setFormCredentials(e.target.value)}
                    className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-slate-800 focus:border-indigo-500 focus:outline-hidden"
                  >
                    <option value="Verified & Monitored (Production)">Verified & Monitored (Production)</option>
                    <option value="Credentials Retained (Read-Only / Fallback)">Credentials Retained (Read-Only / Fallback)</option>
                    <option value="Credentials Retained (Grandfathered Free Tier)">Credentials Retained (Grandfathered Free Tier)</option>
                    <option value="No Active Access / Credentials Destroyed">No Active Access / Credentials Destroyed</option>
                    <option value="API Tokens Invalidated by Vendor">API Tokens Invalidated by Vendor</option>
                    <option value="Account Decommissioned / Org Closed">Account Decommissioned / Org Closed</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold uppercase tracking-wider text-[10px] text-slate-600">
                    Adoption Quarter → Deprecation Date
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={formAdoptionQuarter}
                      onChange={(e) => setFormAdoptionQuarter(e.target.value)}
                      placeholder="e.g. 2023-Q4"
                      className="w-full rounded border border-slate-300 bg-white px-2 py-2 font-mono text-slate-800 text-xs"
                    />
                    <input
                      type="text"
                      value={formDeprecationQuarter}
                      onChange={(e) => setFormDeprecationQuarter(e.target.value)}
                      placeholder="Active or 2024-Q3"
                      className="w-full rounded border border-slate-300 bg-white px-2 py-2 font-mono text-slate-800 text-xs"
                    />
                  </div>
                </div>

              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setActiveTab('all')}
                  className="rounded border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700 shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="h-4 w-4" />
                  <span>Save to Tech Stack Registry</span>
                </button>
              </div>
            </form>
          )}

        </div>

      </div>
    </div>
  );
};
