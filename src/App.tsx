import React, { useState, useMemo } from 'react';
import Papa from 'papaparse';
import { 
  Plus, 
  BarChart3, 
  UploadCloud, 
  CheckCircle2
} from 'lucide-react';

import { Dataset, ChartConfig, FilterState } from './types';
import { sampleDatasets } from './sampleDatasets';
import { filterDataset } from './utils/dataProcessing';
import { getDefaultChartsForDataset, GEOMETRIC_PALETTE } from './utils/defaultCharts';

import { Header } from './components/Header';
import { KpiMetricsRow } from './components/KpiMetricsRow';
import { FilterToolbar } from './components/FilterToolbar';
import { ChartCard } from './components/ChartCard';
import { ChartSettingsModal } from './components/ChartSettingsModal';
import { DataImporterModal } from './components/DataImporterModal';
import { DataEditorView } from './components/DataEditorView';
import { AgentLabSyncModal } from './components/AgentLabSyncModal';
import { MetricInterpretationModal } from './components/MetricInterpretationModal';
import { FinancialBoardModal } from './components/FinancialBoardModal';
import { TechStackRegistryModal } from './components/TechStackRegistryModal';
import { AiInsightPanel } from './components/AiInsightPanel';
import { ExecutiveAuthGate } from './components/ExecutiveAuthGate';
import { MultiBrandPortfolioBar } from './components/MultiBrandPortfolioBar';
import { BrandManagerModal } from './components/BrandManagerModal';
import { BRANDS, BRAND_PROFILES, BrandMetadata, ALL_BRANDS } from './sampleDatasets';
import { inferSchema, normalizeData } from './utils/dataProcessing';

export default function App() {
  const [datasets, setDatasets] = useState<Dataset[]>(sampleDatasets);
  const [activeDatasetId, setActiveDatasetId] = useState<string>(sampleDatasets[0].id);
  const [selectedBrand, setSelectedBrand] = useState<string>(ALL_BRANDS);

  // Dynamic Brands & Profiles with LocalStorage persistence
  const [brands, setBrands] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('UR_HOLDING_BRANDS');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      // fallback
    }
    return BRANDS;
  });

  const [brandProfiles, setBrandProfiles] = useState<Record<string, BrandMetadata>>(() => {
    try {
      const saved = localStorage.getItem('UR_HOLDING_BRAND_PROFILES');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') return parsed;
      }
    } catch (e) {
      // fallback
    }
    return BRAND_PROFILES;
  });

  const [isBrandManagerOpen, setIsBrandManagerOpen] = useState(false);
  
  const activeDataset = useMemo(() => {
    return datasets.find(d => d.id === activeDatasetId) || datasets[0];
  }, [datasets, activeDatasetId]);

  // Brand record counts for the current active dataset
  const brandCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    brands.forEach(b => {
      counts[b] = 0;
    });
    activeDataset.data.forEach(item => {
      const b = (item.Brand as string) || '';
      if (b && counts[b] !== undefined) {
        counts[b] += 1;
      } else if (b) {
        counts[b] = (counts[b] || 0) + 1;
      }
    });
    return counts;
  }, [brands, activeDataset.data]);

  // Active charts for current dataset
  const [charts, setCharts] = useState<ChartConfig[]>(() => {
    return getDefaultChartsForDataset(sampleDatasets[0]);
  });

  // Filter state
  const [filters, setFilters] = useState<FilterState>({
    searchQuery: '',
    categoryFilters: {},
    numericRanges: {},
  });

  // Modals state
  const [isImporterOpen, setIsImporterOpen] = useState(false);
  const [isDataEditorOpen, setIsDataEditorOpen] = useState(false);
  const [isAgentLabSyncOpen, setIsAgentLabSyncOpen] = useState(false);
  const [isPlaybookOpen, setIsPlaybookOpen] = useState(false);
  const [isFinancialBoardOpen, setIsFinancialBoardOpen] = useState(false);
  const [isTechStackRegistryOpen, setIsTechStackRegistryOpen] = useState(false);
  const [highlightMetricKey, setHighlightMetricKey] = useState<string | undefined>(undefined);
  const [editingChart, setEditingChart] = useState<ChartConfig | null>(null);
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

  const handleOpenPlaybook = (metricKey?: string) => {
    setHighlightMetricKey(metricKey);
    setIsPlaybookOpen(true);
  };

  const handleSelectFinancialDataset = () => {
    const fin = datasets.find(d => d.id === 'financial-board');
    if (fin) {
      handleSelectDataset(fin);
      showNotification('Switched dashboard to Financial Board & Cash Runway.');
    }
  };

  const handleSelectTechStackDataset = () => {
    const tech = datasets.find(d => d.id === 'tech-stack-lifecycle');
    if (tech) {
      handleSelectDataset(tech);
      showNotification('Switched dashboard to Tech Stack Architecture & Lifecycle Registry.');
    }
  };

  const handleUpdateFinancialData = (updatedRecords: Record<string, any>[]) => {
    const finDataset = datasets.find(d => d.id === 'financial-board');
    if (!finDataset) return;
    const schema = inferSchema(updatedRecords);
    const normalized = normalizeData(updatedRecords, schema);
    const updated: Dataset = {
      ...finDataset,
      data: normalized,
      schema,
    };
    handleUpdateDataset(updated);
  };

  const handleUpdateTechStackData = (updatedRecords: Record<string, any>[]) => {
    const techDataset = datasets.find(d => d.id === 'tech-stack-lifecycle');
    if (!techDataset) return;
    const schema = inferSchema(updatedRecords);
    const normalized = normalizeData(updatedRecords, schema);
    const updated: Dataset = {
      ...techDataset,
      data: normalized,
      schema,
    };
    handleUpdateDataset(updated);
    showNotification('Tech Stack Registry updated.');
  };

  // Compute filtered rows
  const filteredData = useMemo(() => {
    return filterDataset(activeDataset.data, activeDataset.schema, filters);
  }, [activeDataset.data, activeDataset.schema, filters]);

  const showNotification = (msg: string) => {
    setNotificationMsg(msg);
    setTimeout(() => setNotificationMsg(null), 3500);
  };

  // Brand Switcher handler
  const handleSelectBrand = (brand: string) => {
    setSelectedBrand(brand);
    setFilters(prev => {
      const nextCategoryFilters = { ...prev.categoryFilters };
      if (brand === ALL_BRANDS) {
        delete nextCategoryFilters['Brand'];
      } else {
        nextCategoryFilters['Brand'] = [brand];
      }
      return {
        ...prev,
        categoryFilters: nextCategoryFilters,
      };
    });
  };

  // Synchronized filter change handler
  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters);
    const brandFilter = newFilters.categoryFilters['Brand'];
    if (!brandFilter || brandFilter.length === 0 || brandFilter.length > 1) {
      setSelectedBrand(ALL_BRANDS);
    } else if (brandFilter.length === 1) {
      setSelectedBrand(brandFilter[0]);
    }
  };

  const handleResetFilters = () => {
    setSelectedBrand(ALL_BRANDS);
    setFilters({
      searchQuery: '',
      categoryFilters: {},
      numericRanges: {},
    });
  };

  const handleSaveBrands = (
    newBrands: string[],
    newProfiles: Record<string, BrandMetadata>,
    renameMap?: { oldName: string; newName: string }
  ) => {
    setBrands(newBrands);
    setBrandProfiles(newProfiles);
    try {
      localStorage.setItem('UR_HOLDING_BRANDS', JSON.stringify(newBrands));
      localStorage.setItem('UR_HOLDING_BRAND_PROFILES', JSON.stringify(newProfiles));
    } catch (e) {
      console.error(e);
    }

    // If a brand was renamed or subtracted with reassignment, update dataset records
    if (renameMap) {
      const { oldName, newName } = renameMap;
      if (selectedBrand === oldName) {
        setSelectedBrand(newName);
      }
      setDatasets(prev =>
        prev.map(ds => {
          let hasChange = false;
          const updatedData = ds.data.map(row => {
            if (row.Brand === oldName) {
              hasChange = true;
              return { ...row, Brand: newName };
            }
            return row;
          });
          if (!hasChange) return ds;
          const schema = inferSchema(updatedData);
          return {
            ...ds,
            data: updatedData,
            schema,
          };
        })
      );
      showNotification(`Brand "${oldName}" updated to "${newName}" across portfolio datasets.`);
    } else {
      showNotification('Brand portfolio updated successfully.');
    }
  };

  const handleResetBrandsToDefault = () => {
    setBrands(BRANDS);
    setBrandProfiles(BRAND_PROFILES);
    try {
      localStorage.removeItem('UR_HOLDING_BRANDS');
      localStorage.removeItem('UR_HOLDING_BRAND_PROFILES');
    } catch (e) {
      console.error(e);
    }
    showNotification('Restored default holding brand configuration.');
  };

  // Switch dataset handler
  const handleSelectDataset = (dataset: Dataset) => {
    setActiveDatasetId(dataset.id);
    setSelectedBrand(ALL_BRANDS);
    setCharts(getDefaultChartsForDataset(dataset));
    setFilters({
      searchQuery: '',
      categoryFilters: {},
      numericRanges: {},
    });
  };

  // Import dataset handler
  const handleImportDataset = (newDataset: Dataset) => {
    setDatasets(prev => {
      const existingIdx = prev.findIndex(d => d.id === newDataset.id);
      if (existingIdx >= 0) {
        const updated = [...prev];
        updated[existingIdx] = newDataset;
        return updated;
      }
      return [newDataset, ...prev];
    });
    setActiveDatasetId(newDataset.id);
    setSelectedBrand(ALL_BRANDS);
    setCharts(getDefaultChartsForDataset(newDataset));
    setFilters({
      searchQuery: '',
      categoryFilters: {},
      numericRanges: {},
    });
    showNotification(`Successfully loaded dataset "${newDataset.name}" with ${newDataset.data.length} records!`);
  };

  // Update existing dataset (e.g. from Table Editor)
  const handleUpdateDataset = (updated: Dataset) => {
    setDatasets(prev => prev.map(d => d.id === updated.id ? updated : d));
    showNotification(`Dataset updated with ${updated.data.length} records.`);
  };

  // Add Chart handler
  const handleAddNewChart = () => {
    const numericCols = activeDataset.schema.filter(s => s.type === 'number');
    const firstX = activeDataset.schema[0]?.key || '';
    const firstY = numericCols[0]?.key || activeDataset.schema[1]?.key || '';

    const newConfig: ChartConfig = {
      id: `custom-chart-${Date.now()}`,
      title: `Analysis of ${firstY || 'Metric'} by ${firstX || 'Dimension'}`,
      type: 'bar',
      xAxisKey: firstX,
      yAxisKeys: firstY ? [firstY] : [],
      aggregation: 'sum',
      sortBy: 'y-desc',
      colorPalette: GEOMETRIC_PALETTE,
      showGrid: true,
      showLegend: true,
      showValues: false,
      curveType: 'monotone',
    };

    setEditingChart(newConfig);
  };

  // Save chart from modal
  const handleSaveChartConfig = (savedConfig: ChartConfig) => {
    const exists = charts.some(c => c.id === savedConfig.id);
    if (exists) {
      setCharts(charts.map(c => c.id === savedConfig.id ? savedConfig : c));
      showNotification('Visualization updated successfully.');
    } else {
      setCharts([savedConfig, ...charts]);
      showNotification('New visualization created.');
    }
  };

  // Duplicate chart
  const handleDuplicateChart = (source: ChartConfig) => {
    const duplicated: ChartConfig = {
      ...source,
      id: `chart-copy-${Date.now()}`,
      title: `${source.title} (Copy)`,
    };
    setCharts([duplicated, ...charts]);
    showNotification('Chart duplicated.');
  };

  // Delete chart
  const handleDeleteChart = (chartId: string) => {
    setCharts(charts.filter(c => c.id !== chartId));
    showNotification('Chart removed from dashboard.');
  };

  // Inline update chart config
  const handleUpdateInlineConfig = (updated: ChartConfig) => {
    setCharts(charts.map(c => c.id === updated.id ? updated : c));
  };

  // Reset layout to defaults
  const handleResetLayout = () => {
    setCharts(getDefaultChartsForDataset(activeDataset));
    showNotification('Dashboard visualizations reset to default preset.');
  };

  // Export data
  const handleExportData = (format: 'csv' | 'json') => {
    if (format === 'csv') {
      const csv = Papa.unparse(filteredData);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${activeDataset.name.toLowerCase().replace(/\s+/g, '_')}_filtered.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      showNotification('CSV exported successfully.');
    } else {
      const jsonStr = JSON.stringify(filteredData, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${activeDataset.name.toLowerCase().replace(/\s+/g, '_')}_filtered.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      showNotification('JSON exported successfully.');
    }
  };

  return (
    <ExecutiveAuthGate>
      {({ user, email, organization, onLogout }) => (
        <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans antialiased selection:bg-indigo-600 selection:text-white">
          
          {/* Sticky Header */}
          <Header
            datasets={datasets}
            activeDataset={activeDataset}
            onSelectDataset={handleSelectDataset}
            onOpenImporter={() => setIsImporterOpen(true)}
            onOpenDataEditor={() => setIsDataEditorOpen(true)}
            onOpenAgentLabSync={() => setIsAgentLabSyncOpen(true)}
            onOpenPlaybook={() => handleOpenPlaybook()}
            onOpenFinancialBoard={() => setIsFinancialBoardOpen(true)}
            onOpenTechStackRegistry={() => setIsTechStackRegistryOpen(true)}
            onAddChart={handleAddNewChart}
            onExportData={handleExportData}
            onResetLayout={handleResetLayout}
            totalFilteredCount={filteredData.length}
            currentUserEmail={email}
            currentUserName={user.displayName || email.split('@')[0]}
            currentUserPhoto={user.photoURL}
            organization={organization}
            onLogout={onLogout}
          />

      {/* Notification Toast */}
      {notificationMsg && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-3 text-xs font-semibold text-white shadow-2xl transition-all">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{notificationMsg}</span>
        </div>
      )}

      {/* Main Balanced Dashboard Area */}
      <main className="flex-1 px-6 lg:px-8 py-6 max-w-[1720px] mx-auto w-full space-y-6">
        
        {/* Dataset Intro & Geometric Scope Banner */}
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg bg-white border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-50 border border-indigo-200 rounded flex items-center justify-center text-indigo-700 font-bold text-xs uppercase tracking-wider">
              DS
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-tight">{activeDataset.name}</h2>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">{activeDataset.description}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs">
            {activeDataset.id === 'tech-stack-lifecycle' ? (
              <button
                onClick={() => setIsTechStackRegistryOpen(true)}
                className="rounded border border-indigo-300 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 font-bold text-indigo-900 text-[11px] cursor-pointer transition-colors"
              >
                Tech Stack Hub & Workloads
              </button>
            ) : (
              <button
                onClick={handleSelectTechStackDataset}
                className="rounded border border-indigo-300 bg-indigo-50/60 hover:bg-indigo-100 px-2.5 py-1 font-bold text-indigo-800 text-[11px] cursor-pointer transition-colors"
              >
                Tech Stack Registry
              </button>
            )}

            {activeDataset.id === 'financial-board' ? (
              <button
                onClick={() => setIsFinancialBoardOpen(true)}
                className="rounded border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 font-bold text-emerald-800 text-[11px] cursor-pointer transition-colors"
              >
                Financial Control & Payables
              </button>
            ) : (
              <button
                onClick={handleSelectFinancialDataset}
                className="rounded border border-emerald-300 bg-emerald-50/60 hover:bg-emerald-100 px-2.5 py-1 font-bold text-emerald-800 text-[11px] cursor-pointer transition-colors"
              >
                Financial Board & Runway
              </button>
            )}
            <button
              onClick={() => handleOpenPlaybook()}
              className="rounded border border-indigo-200 bg-indigo-50/60 hover:bg-indigo-100 px-2.5 py-1 font-bold text-indigo-700 text-[11px] cursor-pointer transition-colors"
            >
              Metric Interpretations Playbook
            </button>
            <span className="rounded border border-slate-200 bg-slate-50 px-2.5 py-1 font-semibold text-slate-600 text-[11px]">
              {activeDataset.schema.length} Dimensions & Metrics
            </span>
            <span className="rounded border border-slate-200 bg-slate-50 px-2.5 py-1 font-semibold text-slate-600 text-[11px]">
              {activeDataset.data.length} Total Records
            </span>
            <button
              onClick={() => setIsImporterOpen(true)}
              className="inline-flex items-center gap-1 text-indigo-600 font-bold hover:text-indigo-800 cursor-pointer ml-1 text-xs"
            >
              <UploadCloud className="h-3.5 w-3.5" />
              Provide New Data
            </button>
          </div>
        </div>

        {/* Multi-Brand Portfolio Selector Bar */}
        <MultiBrandPortfolioBar
          selectedBrand={selectedBrand}
          onSelectBrand={handleSelectBrand}
          brandCounts={brandCounts}
          totalCount={activeDataset.data.length}
          brands={brands}
          brandProfiles={brandProfiles}
          onOpenBrandManager={() => setIsBrandManagerOpen(true)}
        />

        {/* Top Summary KPI Cards */}
        <KpiMetricsRow 
          data={filteredData} 
          schema={activeDataset.schema} 
          datasetId={activeDataset.id}
          onOpenPlaybook={handleOpenPlaybook}
        />

        {/* Global Filter Toolbar */}
        <FilterToolbar
          schema={activeDataset.schema}
          filters={filters}
          onFilterChange={handleFilterChange}
          onResetFilters={handleResetFilters}
          filteredCount={filteredData.length}
          totalCount={activeDataset.data.length}
        />

        {/* AI Insight & Anomaly Engine */}
        <AiInsightPanel
          dataset={activeDataset}
          filteredData={filteredData}
          filters={filters}
          onOpenPlaybook={handleOpenPlaybook}
        />

        {/* Visualizations Grid */}
        {charts.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-white p-12 text-center">
            <BarChart3 className="h-12 w-12 text-slate-300 mb-3" />
            <h3 className="text-base font-bold text-slate-800 uppercase tracking-wide">No Visualizations Configured</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm font-medium">
              Add your first custom chart, or restore preset visualizations for this dataset.
            </p>
            <div className="mt-4 flex gap-3">
              <button
                onClick={handleAddNewChart}
                className="inline-flex items-center gap-1.5 rounded bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                Add Visualization
              </button>
              <button
                onClick={handleResetLayout}
                className="rounded border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Restore Preset Charts
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3 gap-6">
            {charts.map(chartConfig => (
              <ChartCard
                key={chartConfig.id}
                config={chartConfig}
                data={filteredData}
                schema={activeDataset.schema}
                onEdit={config => setEditingChart(config)}
                onDuplicate={handleDuplicateChart}
                onDelete={handleDeleteChart}
                onUpdateConfig={handleUpdateInlineConfig}
                onOpenPlaybook={handleOpenPlaybook}
              />
            ))}
          </div>
        )}

      </main>

      {/* Data Importer / Upload Modal */}
      <DataImporterModal
        isOpen={isImporterOpen}
        onClose={() => setIsImporterOpen(false)}
        onImportDataset={handleImportDataset}
      />

      {/* Raw Data Table & Inline Editor Modal */}
      <DataEditorView
        isOpen={isDataEditorOpen}
        onClose={() => setIsDataEditorOpen(false)}
        dataset={activeDataset}
        onUpdateDataset={handleUpdateDataset}
      />

      {/* Chart Configuration Modal */}
      {editingChart && (
        <ChartSettingsModal
          isOpen={!!editingChart}
          onClose={() => setEditingChart(null)}
          config={editingChart}
          schema={activeDataset.schema}
          onSave={handleSaveChartConfig}
        />
      )}

      {/* Agent Lab Cloud Run Service Account Sync Modal */}
      <AgentLabSyncModal
        isOpen={isAgentLabSyncOpen}
        onClose={() => setIsAgentLabSyncOpen(false)}
        onImportDataset={handleImportDataset}
        currentDatasetId={activeDatasetId}
      />

      {/* Operations & Metric Interpretation Playbook Modal */}
      <MetricInterpretationModal
        isOpen={isPlaybookOpen}
        onClose={() => setIsPlaybookOpen(false)}
        initialHighlightKey={highlightMetricKey}
      />

      {/* Financial Control Board & Due Dates / Trials Radar Modal */}
      <FinancialBoardModal
        isOpen={isFinancialBoardOpen}
        onClose={() => setIsFinancialBoardOpen(false)}
        currentDataset={activeDataset}
        onSelectFinancialDataset={handleSelectFinancialDataset}
        onUpdateFinancialData={handleUpdateFinancialData}
        brands={brands}
      />

      {/* Tech Stack Architecture & Lifecycle Registry Modal */}
      <TechStackRegistryModal
        isOpen={isTechStackRegistryOpen}
        onClose={() => setIsTechStackRegistryOpen(false)}
        currentDataset={activeDataset}
        onSelectTechStackDataset={handleSelectTechStackDataset}
        onUpdateTechStackData={handleUpdateTechStackData}
      />

      {/* Brand Portfolio Manager Modal */}
      <BrandManagerModal
        isOpen={isBrandManagerOpen}
        onClose={() => setIsBrandManagerOpen(false)}
        brands={brands}
        brandProfiles={brandProfiles}
        onSaveBrands={handleSaveBrands}
        onResetBrandsToDefault={handleResetBrandsToDefault}
        brandCounts={brandCounts}
      />

        </div>
      )}
    </ExecutiveAuthGate>
  );
}
