import React, { useState } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  Calendar, 
  AlertTriangle, 
  CheckCircle2, 
  Plus, 
  X, 
  Layers, 
  ArrowUpRight, 
  ArrowDownRight, 
  ShieldCheck, 
  UserCheck, 
  Sparkles,
  RefreshCw,
  Zap,
  BarChart3,
  Building2,
  Receipt
} from 'lucide-react';
import { Dataset, ColumnSchema } from '../types';
import { rawFinancialData, BRANDS, ALL_BRANDS } from '../sampleDatasets';
import { formatNumber, inferSchema, normalizeData } from '../utils/dataProcessing';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentDataset: Dataset;
  onSelectFinancialDataset: () => void;
  onUpdateFinancialData: (updatedRecords: Record<string, any>[]) => void;
  brands?: string[];
}

export const FinancialBoardModal: React.FC<Props> = ({
  isOpen,
  onClose,
  currentDataset,
  onSelectFinancialDataset,
  onUpdateFinancialData,
  brands = BRANDS,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'duedates' | 'trials' | 'addentry'>('overview');
  const [selectedBrand, setSelectedBrand] = useState<string>(ALL_BRANDS);
  
  // Local working copy of financial records
  const [records, setRecords] = useState<Record<string, any>[]>(() => {
    if (currentDataset.id === 'financial-board') {
      return currentDataset.data;
    }
    return rawFinancialData;
  });

  // Form state for adding new financial transaction or trial
  const [formEntityName, setFormEntityName] = useState('');
  const [formBrand, setFormBrand] = useState<string>(brands[0] || 'Uncle Robert Consulting');
  const [formCategory, setFormCategory] = useState('Enterprise Sales');
  const [formType, setFormType] = useState<'inflow' | 'outflow' | 'trial'>('inflow');
  const [formAmount, setFormAmount] = useState('15000');
  const [formDueDate, setFormDueDate] = useState('2025-10-15');
  const [formDaysUntilDue, setFormDaysUntilDue] = useState('14');
  const [formPaymentStatus, setFormPaymentStatus] = useState('Invoice Pending');
  const [formTrialTier, setFormTrialTier] = useState('Enterprise AI Pilot (14-Day)');
  const [formTrialDays, setFormTrialDays] = useState('14');
  const [formConversionProb, setFormConversionProb] = useState('85');

  if (!isOpen) return null;

  // Filter records by selected brand
  const displayRecords = records.filter(r => {
    if (selectedBrand === ALL_BRANDS) return true;
    return r.Brand === selectedBrand;
  });

  // Key Aggregations based on displayRecords
  const totalInflow = displayRecords.reduce((acc, r) => acc + (Number(r.InflowUSD) || 0), 0);
  const totalOutflow = displayRecords.reduce((acc, r) => acc + (Number(r.CostOutflowUSD) || 0), 0);
  const netCashFlow = totalInflow - totalOutflow;
  
  // Active Trials
  const trialRecords = displayRecords.filter(r => 
    r.Category === 'Active Customer Trials' || 
    (Number(r.TrialDaysLeft) > 0) ||
    /trial/i.test(String(r.TransactionType))
  );

  const totalTrialPipeline = trialRecords.reduce((acc, r) => acc + (Number(r.SalesRevenueUSD) || 0), 0);
  
  // Due Dates & Payables
  const pendingDueRecords = displayRecords
    .filter(r => Number(r.DaysUntilDue) > 0 || /due|pending|autopay/i.test(String(r.PaymentStatus)))
    .sort((a, b) => Number(a.DaysUntilDue) - Number(b.DaysUntilDue));

  const urgentDueCount = pendingDueRecords.filter(r => Number(r.DaysUntilDue) <= 7 && Number(r.DaysUntilDue) > 0).length;

  // Mark an invoice/vendor as Paid
  const handleMarkAsPaid = (index: number) => {
    const updated = [...records];
    updated[index] = {
      ...updated[index],
      PaymentStatus: 'Paid / Settled',
      DaysUntilDue: 0,
    };
    setRecords(updated);
    onUpdateFinancialData(updated);
  };

  // Convert a trial into an annual contract
  const handleConvertTrial = (index: number) => {
    const updated = [...records];
    const rec = updated[index];
    const contractVal = Number(rec.SalesRevenueUSD) || 120000;
    
    updated[index] = {
      ...rec,
      Category: 'Enterprise Sales',
      TransactionType: 'Inflow (Sales)',
      InflowUSD: contractVal,
      NetCashImpact: contractVal,
      TrialStatus: `Converted to Annual ($${(contractVal / 1000).toFixed(0)}k)`,
      TrialDaysLeft: 0,
      TrialConversionProb: 100,
      PaymentStatus: 'Invoice Sent',
      DaysUntilDue: 14,
    };
    setRecords(updated);
    onUpdateFinancialData(updated);
  };

  // Add new entry
  const handleAddNewEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formEntityName.trim()) return;

    const amt = parseFloat(formAmount) || 0;
    const daysDue = parseInt(formDaysUntilDue) || 0;

    let newRecord: Record<string, any> = {
      EntityName: formEntityName.trim(),
      Brand: formBrand,
      Category: formCategory,
      DueDate: formDueDate,
      DaysUntilDue: daysDue,
      PaymentStatus: formPaymentStatus,
      CustomerAccount: formEntityName.trim(),
      ContractType: formType === 'inflow' ? 'Annual Enterprise' : formType === 'outflow' ? 'Monthly SaaS / Compute' : 'Trial - Projected Annual',
    };

    if (formType === 'inflow') {
      newRecord = {
        ...newRecord,
        TransactionType: 'Inflow (Sales)',
        InflowUSD: amt,
        CostOutflowUSD: 0,
        NetCashImpact: amt,
        SalesRevenueUSD: amt,
        ARR_Impact: amt,
        TrialTier: 'Paid Production',
        TrialPeriodDays: 0,
        TrialDaysLeft: 0,
        TrialStatus: 'Paid Tier',
        TrialConversionProb: 100,
      };
    } else if (formType === 'outflow') {
      newRecord = {
        ...newRecord,
        TransactionType: 'Outflow (Cost)',
        InflowUSD: 0,
        CostOutflowUSD: amt,
        NetCashImpact: -amt,
        SalesRevenueUSD: 0,
        ARR_Impact: -(amt * 12),
        TrialTier: 'N/A - Vendor Cost',
        TrialPeriodDays: 0,
        TrialDaysLeft: 0,
        TrialStatus: 'N/A - Vendor Cost',
        TrialConversionProb: 0,
      };
    } else {
      // Trial
      newRecord = {
        ...newRecord,
        TransactionType: 'Trial Period (Pipeline)',
        InflowUSD: 0,
        CostOutflowUSD: 350,
        NetCashImpact: -350,
        SalesRevenueUSD: amt,
        ARR_Impact: amt,
        TrialTier: formTrialTier,
        TrialPeriodDays: parseInt(formTrialDays) || 14,
        TrialDaysLeft: parseInt(formTrialDays) || 14,
        TrialStatus: `Active (${formTrialDays}d left)`,
        TrialConversionProb: parseInt(formConversionProb) || 80,
      };
    }

    const updated = [newRecord, ...records];
    setRecords(updated);
    onUpdateFinancialData(updated);

    // Reset Form
    setFormEntityName('');
    setActiveTab('overview');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-5xl rounded-xl border border-slate-200 bg-white shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/80 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-xs">
              <DollarSign className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  Financial Control Board & Cash Runway
                </h3>
                <span className="rounded bg-emerald-100 border border-emerald-300 px-2 py-0.5 text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
                  Money Movement & Runway
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Real-time tracking of cash inflows, compute/SaaS costs, upcoming invoice due dates, and customer trial expirations.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {currentDataset.id !== 'financial-board' && (
              <button
                onClick={() => {
                  onSelectFinancialDataset();
                  onClose();
                }}
                className="inline-flex items-center gap-1.5 rounded border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition-colors cursor-pointer"
              >
                <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                <span>Switch Dashboard to Financial Board</span>
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

        {/* Brand Selector Toolbar */}
        <div className="px-6 py-2.5 bg-slate-100/80 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Brand Scope:
            </span>
            <div className="inline-flex rounded-md bg-white p-0.5 border border-slate-200 shadow-2xs">
              <button
                type="button"
                onClick={() => setSelectedBrand(ALL_BRANDS)}
                className={`px-2.5 py-1 text-xs font-bold rounded cursor-pointer transition-colors ${
                  selectedBrand === ALL_BRANDS
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All Brands ({records.length})
              </button>
              {brands.map(brand => {
                const bCount = records.filter(r => r.Brand === brand).length;
                const isSel = selectedBrand === brand;
                return (
                  <button
                    key={brand}
                    type="button"
                    onClick={() => setSelectedBrand(brand)}
                    className={`px-2.5 py-1 text-xs font-bold rounded cursor-pointer transition-colors ${
                      isSel
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {brand} ({bCount})
                  </button>
                );
              })}
            </div>
          </div>
          {selectedBrand !== ALL_BRANDS && (
            <span className="text-[11px] font-medium text-slate-500 italic">
              Showing financials exclusively for <strong>{selectedBrand}</strong>
            </span>
          )}
        </div>

        {/* Executive KPI Bar */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 border-b border-slate-200 bg-white p-4">
          
          <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-3 shadow-2xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Total Cash Inflows
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-lg font-black text-emerald-700 font-mono">
                ${formatNumber(totalInflow)}
              </span>
              <ArrowUpRight className="h-4 w-4 text-emerald-600" />
            </div>
            <span className="text-[10px] text-slate-500 font-medium mt-0.5 block">
              Enterprise sales & Stripe
            </span>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-3 shadow-2xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Total Cost Outflows
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-lg font-black text-rose-600 font-mono">
                ${formatNumber(totalOutflow)}
              </span>
              <ArrowDownRight className="h-4 w-4 text-rose-600" />
            </div>
            <span className="text-[10px] text-slate-500 font-medium mt-0.5 block">
              Cloud, LLMs & SaaS tooling
            </span>
          </div>

          <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-3 shadow-2xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">
              Net Monthly Cash Flow
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-lg font-black text-emerald-900 font-mono">
                +${formatNumber(netCashFlow)}
              </span>
            </div>
            <span className="text-[10px] text-emerald-700 font-bold mt-0.5 block">
              Cash Flow Positive
            </span>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-3 shadow-2xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Trial Pipeline Value
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-lg font-black text-indigo-700 font-mono">
                ${formatNumber(totalTrialPipeline)}
              </span>
            </div>
            <span className="text-[10px] text-indigo-600 font-bold mt-0.5 block">
              {trialRecords.length} Active Enterprise Pilots
            </span>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-3 shadow-2xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Due Within 7 Days
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-lg font-black text-amber-600 font-mono">
                {urgentDueCount} Payables
              </span>
              <Clock className="h-4 w-4 text-amber-500" />
            </div>
            <span className="text-[10px] text-slate-500 font-medium mt-0.5 block">
              Action required
            </span>
          </div>

        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 border-b border-slate-200 bg-slate-100/70 px-6 py-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'overview'
                ? 'bg-white text-emerald-800 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <BarChart3 className="h-3.5 w-3.5 text-emerald-600" />
            <span>Money Movement & Cash Flow ({records.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('duedates')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'duedates'
                ? 'bg-white text-emerald-800 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <Calendar className="h-3.5 w-3.5 text-blue-600" />
            <span>Due Dates & Payables Watchlist ({pendingDueRecords.length})</span>
            {urgentDueCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                {urgentDueCount} urgent
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('trials')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'trials'
                ? 'bg-white text-emerald-800 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <Clock className="h-3.5 w-3.5 text-indigo-600" />
            <span>Customer Trial Periods Radar ({trialRecords.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('addentry')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'addentry'
                ? 'bg-white text-emerald-800 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <Plus className="h-3.5 w-3.5 text-emerald-600" />
            <span>Record Movement / Trial</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">

          {/* TAB 1: OVERVIEW & MONEY MOVEMENT */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    Money Movement: Inflows, Outflows & Operating Margins
                  </h4>
                  <p className="text-xs text-slate-500 font-medium">
                    Breakdown of each revenue intake, cloud compute spend, and vendor commitment.
                  </p>
                </div>
                <button
                  onClick={() => {
                    onSelectFinancialDataset();
                    onClose();
                  }}
                  className="rounded bg-emerald-700 px-3 py-1 text-xs font-bold text-white hover:bg-emerald-800 shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <BarChart3 className="h-3.5 w-3.5" />
                  <span>Plot on Main Dashboard Charts</span>
                </button>
              </div>

              <div className="rounded-lg border border-slate-200 overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px] font-bold">
                    <tr>
                      <th className="px-4 py-2.5">Entity / Account</th>
                      <th className="px-4 py-2.5">Category</th>
                      <th className="px-4 py-2.5 text-right">Inflow ($)</th>
                      <th className="px-4 py-2.5 text-right">Cost Outflow ($)</th>
                      <th className="px-4 py-2.5 text-right">Net Impact ($)</th>
                      <th className="px-4 py-2.5">Payment / Due Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {displayRecords.map((r, idx) => {
                      const isInflow = Number(r.InflowUSD) > 0;
                      const isOutflow = Number(r.CostOutflowUSD) > 0;
                      return (
                        <tr key={`${r.EntityName}-${idx}`} className="hover:bg-slate-50/70 transition-colors">
                          <td className="px-4 py-2.5 font-sans font-bold text-slate-800">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className={`w-2 h-2 rounded-full shrink-0 ${isInflow ? 'bg-emerald-500' : isOutflow ? 'bg-rose-500' : 'bg-indigo-500'}`}></span>
                              <span>{r.EntityName}</span>
                              {r.Brand && (
                                <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${
                                  r.Brand === 'Uncle Robert Consulting'
                                    ? 'bg-sky-50 text-sky-700 border-sky-200'
                                    : r.Brand === 'Fundable Consulting'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : 'bg-purple-50 text-purple-700 border-purple-200'
                                }`}>
                                  {r.Brand}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-2.5 font-sans text-slate-600 font-medium">
                            {r.Category}
                          </td>
                          <td className="px-4 py-2.5 text-right text-emerald-700 font-bold">
                            {isInflow ? `$${Number(r.InflowUSD).toLocaleString()}` : '—'}
                          </td>
                          <td className="px-4 py-2.5 text-right text-rose-600 font-bold">
                            {isOutflow ? `-$${Number(r.CostOutflowUSD).toLocaleString()}` : '—'}
                          </td>
                          <td className={`px-4 py-2.5 text-right font-bold ${Number(r.NetCashImpact) >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                            {Number(r.NetCashImpact) >= 0 ? '+' : ''}${Number(r.NetCashImpact).toLocaleString()}
                          </td>
                          <td className="px-4 py-2.5 font-sans">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                              /paid/i.test(r.PaymentStatus)
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : /due in \d/i.test(r.PaymentStatus)
                                ? 'bg-amber-50 text-amber-800 border-amber-200'
                                : 'bg-slate-50 text-slate-700 border-slate-200'
                            }`}>
                              {r.PaymentStatus}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: DUE DATES & PAYABLES WATCHLIST */}
          {activeTab === 'duedates' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    Upcoming Payment & Invoice Due Dates
                  </h4>
                  <p className="text-xs text-slate-500 font-medium">
                    Never miss a cloud infrastructure bill, model inference invoice, or SaaS renewal.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {pendingDueRecords.map((r, idx) => {
                  const days = Number(r.DaysUntilDue);
                  const isUrgent = days <= 3 && days >= 0;
                  const isSoon = days > 3 && days <= 7;
                  const isPaid = /paid/i.test(r.PaymentStatus);

                  return (
                    <div 
                      key={`${r.EntityName}-${idx}`} 
                      className={`p-4 rounded-lg border transition-all ${
                        isPaid
                          ? 'border-slate-200 bg-slate-50/50'
                          : isUrgent
                          ? 'border-rose-300 bg-rose-50/40 shadow-xs'
                          : isSoon
                          ? 'border-amber-300 bg-amber-50/40 shadow-xs'
                          : 'border-slate-200 bg-white shadow-2xs'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="font-bold text-slate-900 text-xs truncate">
                            {r.EntityName}
                          </span>
                          {r.Brand && (
                            <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border shrink-0 ${
                              r.Brand === 'Uncle Robert Consulting'
                                ? 'bg-sky-50 text-sky-700 border-sky-200'
                                : r.Brand === 'Fundable Consulting'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-purple-50 text-purple-700 border-purple-200'
                            }`}>
                              {r.Brand}
                            </span>
                          )}
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border font-mono ${
                          isPaid
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : isUrgent
                            ? 'bg-rose-100 text-rose-800 border-rose-300 animate-pulse'
                            : isSoon
                            ? 'bg-amber-100 text-amber-800 border-amber-300'
                            : 'bg-blue-50 text-blue-800 border-blue-200'
                        }`}>
                          {isPaid ? 'PAID' : days === 0 ? 'DUE TODAY' : `DUE IN ${days} DAYS`}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 mt-3 text-xs pt-2 border-t border-slate-100">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">Amount</span>
                          <span className="font-bold font-mono text-slate-800">
                            ${Number(r.CostOutflowUSD || r.InflowUSD || r.SalesRevenueUSD).toLocaleString()}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">Due Date</span>
                          <span className="font-mono text-slate-700">{r.DueDate || 'Oct 2025'}</span>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">Status</span>
                          <span className="text-slate-700 font-medium">{r.PaymentStatus}</span>
                        </div>
                      </div>

                      {!isPaid && (
                        <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-end">
                          <button
                            onClick={() => handleMarkAsPaid(records.indexOf(r))}
                            className="inline-flex items-center gap-1 rounded bg-emerald-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-emerald-700 transition-colors cursor-pointer"
                          >
                            <CheckCircle2 className="h-3 w-3" />
                            <span>Mark as Settled / Paid</span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: CUSTOMER TRIAL PERIODS RADAR */}
          {activeTab === 'trials' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    Customer Trial Periods & Conversion Radar
                  </h4>
                  <p className="text-xs text-slate-500 font-medium">
                    Monitor enterprise trial days remaining, conversion probabilities, and close upcoming contract renewals.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {trialRecords.map((r, idx) => {
                  const totalDays = Number(r.TrialPeriodDays) || 14;
                  const daysLeft = Number(r.TrialDaysLeft) || 0;
                  const daysElapsed = Math.max(0, totalDays - daysLeft);
                  const progressPct = Math.min(100, Math.round((daysElapsed / totalDays) * 100));
                  const isExpiring = daysLeft <= 3 && daysLeft > 0;
                  const isConverted = /converted/i.test(r.TrialStatus);

                  return (
                    <div 
                      key={`${r.CustomerAccount}-${idx}`} 
                      className={`p-4 rounded-lg border transition-all ${
                        isConverted
                          ? 'border-emerald-200 bg-emerald-50/40'
                          : isExpiring
                          ? 'border-amber-300 bg-amber-50/50 shadow-xs'
                          : 'border-slate-200 bg-white shadow-2xs'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h5 className="font-bold text-slate-900 text-xs">{r.CustomerAccount}</h5>
                            {r.Brand && (
                              <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${
                                r.Brand === 'Uncle Robert Consulting'
                                  ? 'bg-sky-50 text-sky-700 border-sky-200'
                                  : r.Brand === 'Fundable Consulting'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : 'bg-purple-50 text-purple-700 border-purple-200'
                              }`}>
                                {r.Brand}
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-500">{r.TrialTier}</span>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          isConverted
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            : isExpiring
                            ? 'bg-amber-100 text-amber-800 border-amber-300 animate-pulse'
                            : 'bg-indigo-50 text-indigo-800 border-indigo-200'
                        }`}>
                          {r.TrialStatus}
                        </span>
                      </div>

                      {/* Progress Bar */}
                      {!isConverted && (
                        <div className="mt-3 space-y-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-slate-500 font-medium">
                              Day {daysElapsed} of {totalDays}
                            </span>
                            <span className="font-bold text-slate-800 font-mono">
                              {daysLeft} days remaining
                            </span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all ${
                                isExpiring ? 'bg-amber-500' : 'bg-indigo-600'
                              }`}
                              style={{ width: `${progressPct}%` }}
                            ></div>
                          </div>
                        </div>
                      )}

                      {/* Financial Value & Conversion Odds */}
                      <div className="grid grid-cols-2 gap-2 mt-3 pt-2 border-t border-slate-100 text-xs">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">Projected Contract</span>
                          <span className="font-bold font-mono text-emerald-700 text-sm">
                            ${Number(r.SalesRevenueUSD).toLocaleString()}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">Conversion Probability</span>
                          <span className="font-bold font-mono text-indigo-700 text-sm">
                            {r.TrialConversionProb}%
                          </span>
                        </div>
                      </div>

                      {/* Conversion Action */}
                      {!isConverted && (
                        <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                          <span className="text-[10px] text-slate-400 font-medium">Trial closing milestone</span>
                          <button
                            onClick={() => handleConvertTrial(records.indexOf(r))}
                            className="inline-flex items-center gap-1 rounded bg-indigo-600 px-3 py-1 text-xs font-bold text-white hover:bg-indigo-700 transition-colors shadow-2xs cursor-pointer"
                          >
                            <Sparkles className="h-3.5 w-3.5 text-indigo-200" />
                            <span>Convert to Annual Contract</span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 4: RECORD NEW FINANCIAL ENTRY / TRIAL */}
          {activeTab === 'addentry' && (
            <form onSubmit={handleAddNewEntry} className="space-y-4 max-w-2xl bg-slate-50/70 p-5 rounded-lg border border-slate-200">
              <div>
                <h4 className="text-sm font-bold text-slate-900">
                  Record Financial Entry, Cost or Customer Trial
                </h4>
                <p className="text-xs text-slate-500 font-medium">
                  Add an expense, incoming enterprise payment, or new pilot sandbox to the active financial dataset.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                
                <div className="space-y-1">
                  <label className="font-bold uppercase tracking-wider text-[10px] text-slate-600">
                    Entry Type
                  </label>
                  <select
                    value={formType}
                    onChange={(e) => {
                      const t = e.target.value as any;
                      setFormType(t);
                      if (t === 'inflow') {
                        setFormCategory('Enterprise Sales');
                        setFormPaymentStatus('Paid / Settled');
                      } else if (t === 'outflow') {
                        setFormCategory('Cloud & AI Compute Cost');
                        setFormPaymentStatus('Due in 14 Days');
                      } else {
                        setFormCategory('Active Customer Trials');
                        setFormPaymentStatus('Active Trial');
                      }
                    }}
                    className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-slate-800 focus:border-emerald-500 focus:outline-hidden"
                  >
                    <option value="inflow">Inflow (Sales Revenue / Invoicing)</option>
                    <option value="outflow">Outflow (Cost / Cloud / SaaS / Vendor)</option>
                    <option value="trial">Customer Trial Period (Pipeline)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold uppercase tracking-wider text-[10px] text-slate-600">
                    Operating Brand
                  </label>
                  <select
                    value={formBrand}
                    onChange={(e) => setFormBrand(e.target.value)}
                    className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-slate-800 font-medium focus:border-emerald-500 focus:outline-hidden"
                  >
                    {brands.map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold uppercase tracking-wider text-[10px] text-slate-600">
                    Entity / Client / Vendor Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formEntityName}
                    onChange={(e) => setFormEntityName(e.target.value)}
                    placeholder="e.g. Oracle Enterprise Pilot, Datadog, Stripe"
                    className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-slate-800 focus:border-emerald-500 focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold uppercase tracking-wider text-[10px] text-slate-600">
                    Amount ($ USD)
                  </label>
                  <input
                    type="number"
                    required
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value)}
                    placeholder="15000"
                    className="w-full rounded border border-slate-300 bg-white px-3 py-2 font-mono text-slate-800 focus:border-emerald-500 focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold uppercase tracking-wider text-[10px] text-slate-600">
                    Category
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-slate-800 focus:border-emerald-500 focus:outline-hidden"
                  >
                    <option value="Enterprise Sales">Enterprise Sales</option>
                    <option value="Self-Serve Subscriptions">Self-Serve Subscriptions</option>
                    <option value="Cloud & AI Compute Cost">Cloud & AI Compute Cost</option>
                    <option value="SaaS & Software Subscriptions">SaaS & Software Subscriptions</option>
                    <option value="Active Customer Trials">Active Customer Trials</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold uppercase tracking-wider text-[10px] text-slate-600">
                    Target Due Date
                  </label>
                  <input
                    type="date"
                    value={formDueDate}
                    onChange={(e) => setFormDueDate(e.target.value)}
                    className="w-full rounded border border-slate-300 bg-white px-3 py-2 font-mono text-slate-800 focus:border-emerald-500 focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold uppercase tracking-wider text-[10px] text-slate-600">
                    Days Remaining / Until Due
                  </label>
                  <input
                    type="number"
                    value={formDaysUntilDue}
                    onChange={(e) => setFormDaysUntilDue(e.target.value)}
                    className="w-full rounded border border-slate-300 bg-white px-3 py-2 font-mono text-slate-800 focus:border-emerald-500 focus:outline-hidden"
                  />
                </div>

                {formType === 'trial' && (
                  <>
                    <div className="space-y-1">
                      <label className="font-bold uppercase tracking-wider text-[10px] text-slate-600">
                        Trial Tier
                      </label>
                      <input
                        type="text"
                        value={formTrialTier}
                        onChange={(e) => setFormTrialTier(e.target.value)}
                        placeholder="Enterprise AI Pilot (14-Day)"
                        className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-slate-800 focus:border-emerald-500 focus:outline-hidden"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold uppercase tracking-wider text-[10px] text-slate-600">
                        Conversion Probability (%)
                      </label>
                      <input
                        type="number"
                        value={formConversionProb}
                        onChange={(e) => setFormConversionProb(e.target.value)}
                        className="w-full rounded border border-slate-300 bg-white px-3 py-2 font-mono text-slate-800 focus:border-emerald-500 focus:outline-hidden"
                      />
                    </div>
                  </>
                )}

              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('overview')}
                  className="rounded border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="h-4 w-4" />
                  <span>Save to Financial Dataset</span>
                </button>
              </div>
            </form>
          )}

        </div>

      </div>
    </div>
  );
};
