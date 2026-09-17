import React, { useState, useRef } from 'react';
import Papa from 'papaparse';
import { 
  X, 
  UploadCloud, 
  FileText, 
  Code, 
  CheckCircle2, 
  AlertCircle,
  FileSpreadsheet,
  Plus
} from 'lucide-react';
import { Dataset, ColumnSchema } from '../types';
import { inferSchema, normalizeData } from '../utils/dataProcessing';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onImportDataset: (dataset: Dataset) => void;
}

const TEMPLATES = [
  {
    name: 'Agent Lab SaaS Cloud Run Telemetry',
    raw: `AgentName,Model,TotalRuns,SuccessfulRuns,FailedRuns,AvgStepsPerRun,HITLOverrides,AvgLatencyMs,PromptTokens,CompletionTokens,ToolCalls,CostUSD,SatisfactionScore
Research & Synthesis,gemini-2.5-flash,1420,1385,35,4.8,28,940,2840000,710000,4260,3.42,4.85
Code Generation & Refactor,gemini-2.5-pro,980,945,35,7.2,64,2450,4900000,1470000,5880,14.70,4.92
Data ETL & Visualizer,gemini-2.5-flash,2150,2110,40,5.1,32,780,3225000,537500,8600,2.85,4.78
Customer Support Triage,gemini-2.0-flash,3400,3340,60,2.4,112,420,1700000,340000,1700,1.15,4.65
Compliance & Audit Inspector,gemini-2.5-pro,620,612,8,8.6,19,3100,6200000,930000,3720,16.80,4.95
Document Parser & OCR,gemini-2.5-flash,1850,1790,60,3.9,45,1150,5550000,740000,3700,5.12,4.70`,
  },
  {
    name: 'HubSpot CRM Deals & Pipeline Conversion',
    raw: `DealName,Stage,Amount,Probability,Pipeline,Owner,DaysToClose,LeadSource,AssociatedAgentRuns,HITLApproved
Acme Corp Enterprise AI Tier,Closed Won,185000,100,Direct Enterprise,Sarah Jenkins,42,Agent Lab Inbound,24,1
TechFlow Global Workspace Expansion,Decision Maker Buy-In,94000,75,Direct Enterprise,Alex Rivera,28,Product Qualified Lead,18,1
Starlight Retail Multimodal Bot,Contract Sent,142000,90,Direct Enterprise,Michael Chang,35,Agent Lab Inbound,31,1
HealthPulse HIPAA Agent Pipeline,Closed Won,260000,100,Healthcare Strategic,Sarah Jenkins,56,Outbound Executive,45,1
FinVantage Auto-Reconcile Agent,Presentation Scheduled,78000,40,Fintech Solutions,David Vance,14,Webinar Agent Lab,8,0
Apex Logistics Document OCR & Triage,Closed Won,115000,100,Direct Enterprise,Alex Rivera,31,Agent Lab Inbound,29,1
EchoMedia Content Pipeline,Closed Lost,52000,0,SMB FastTrack,Jessica Miller,21,Self-Serve Portal,12,0
CloudScale Infrastructure Diagnostics,Qualified To Buy,88000,50,DevOps & Tooling,Michael Chang,19,GitHub Marketplace,14,1`,
  },
  {
    name: 'MCP (Model Context Protocol) Server Telemetry',
    raw: `McpServer,ToolName,Invocations,SuccessRate,AvgLatencyMs,StepDepth,HITLOverrides,TotalTokens,Status
github-mcp,create_or_update_pr,1240,98.4,820,3.2,14,1860000,active
postgres-mcp,execute_analytics_query,3420,99.1,340,2.1,8,2450000,active
hubspot-mcp,sync_crm_deal_stage,890,97.2,610,2.8,22,980000,active
slack-mcp,post_incident_digest,2150,99.8,290,1.4,5,1120000,active
brave-search-mcp,deep_web_research,1680,96.5,1450,4.6,38,4200000,active
filesystem-mcp,read_and_patch_source,4100,98.9,180,5.8,41,5900000,active`,
  },
  {
    name: 'Websites, Landing Pages & Client Portals Performance',
    raw: `AssetName,AssetType,URL,TrafficChannel,Visitors,PageViews,BounceRate,AvgSessionDurationSec,ConversionRate,Conversions,PageLoadMs,LCP_Seconds,PortalActiveUsers,ClientSatisfactionNPS
Enterprise AI Waitlist Landing Page,Landing Page,https://agentlab.ai/enterprise,LinkedIn Ads,38400,52100,28.4,142,9.8,3763,580,1.2,0,72
Agent Lab SaaS Marketing Homepage,Main Website,https://agentlab.ai/,Organic Search,86500,198000,34.2,185,6.4,5536,640,1.4,0,75
Enterprise Client Portal - Workspace Overview,Client Portal,https://portal.agentlab.ai/overview,Direct Authenticated,14200,146000,11.2,420,84.5,11999,490,1.1,1850,84
Client Portal - HITL Approvals & Run Logs,Client Portal,https://portal.agentlab.ai/hitl,Direct Authenticated,8900,94000,8.6,510,91.2,8116,520,1.3,1420,88
Interactive Agent Sandbox & Developer Docs,Docs & Resources,https://docs.agentlab.ai/sandbox,Product Inbound,42300,118000,22.8,360,14.6,6175,430,0.9,0,81
Client Portal - Billing Usage & Invoices,Client Portal,https://portal.agentlab.ai/billing,Direct Authenticated,6400,28000,14.5,210,76.4,4889,610,1.5,980,79
Enterprise Case Studies & ROI Calculator LP,Landing Page,https://agentlab.ai/case-studies,Google Search Ads,26500,41200,31.8,245,11.2,2968,720,1.6,0,70
Client Portal - Custom Model Fine-Tuning Hub,Client Portal,https://portal.agentlab.ai/models,Direct Authenticated,5100,48000,9.4,580,68.2,3478,780,1.7,640,86`,
  },
  {
    name: 'E-commerce Orders',
    raw: `OrderDate,CustomerSegment,Category,Sales,Quantity,Discount,Profit
2025-01-10,Consumer,Technology,1250.00,3,0.1,350.00
2025-01-12,Corporate,Furniture,840.50,4,0.15,120.00
2025-01-15,Home Office,Office Supplies,145.20,5,0.0,42.50
2025-01-18,Consumer,Furniture,620.00,2,0.2,95.00
2025-01-22,Corporate,Technology,2100.00,5,0.05,680.00
2025-01-25,Consumer,Office Supplies,89.00,3,0.0,26.00
2025-02-02,Home Office,Technology,1450.00,2,0.1,410.00
2025-02-06,Corporate,Furniture,980.00,3,0.2,145.00
2025-02-11,Consumer,Technology,1890.00,4,0.1,520.00
2025-02-15,Consumer,Office Supplies,210.00,6,0.0,65.00
2025-02-20,Corporate,Office Supplies,340.00,8,0.1,88.00`,
  },
  {
    name: 'Fitness & Health Tracking',
    raw: `Date,Activity,CaloriesBurned,HeartRateAvg,DurationMins,DistanceKm,SleepHours
2025-02-01,Running,480,154,42,6.4,7.5
2025-02-02,Cycling,620,142,65,18.2,8.0
2025-02-03,Swimming,510,138,45,1.8,7.2
2025-02-04,Weightlifting,390,126,50,0.0,8.2
2025-02-05,Running,520,158,45,7.1,6.8
2025-02-06,Yoga,210,98,60,0.0,8.5
2025-02-07,Cycling,740,146,75,22.5,7.8
2025-02-08,Running,600,162,50,8.3,8.0`,
  },
];

export const DataImporterModal: React.FC<Props> = ({ isOpen, onClose, onImportDataset }) => {
  const [activeTab, setActiveTab] = useState<'paste' | 'upload' | 'templates'>('paste');
  const [datasetName, setDatasetName] = useState('Custom Imported Dataset');
  const [datasetDesc, setDatasetDesc] = useState('User-provided custom dataset for interactive analysis');
  const [rawText, setRawText] = useState('');
  const [parsedData, setParsedData] = useState<Record<string, any>[] | null>(null);
  const [previewSchema, setPreviewSchema] = useState<ColumnSchema[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleParseText = (text: string) => {
    setErrorMsg(null);
    const trimmed = text.trim();
    if (!trimmed) {
      setParsedData(null);
      setPreviewSchema([]);
      return;
    }

    try {
      // Try JSON first
      if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
        const json = JSON.parse(trimmed);
        if (Array.isArray(json) && json.length > 0 && typeof json[0] === 'object') {
          const schema = inferSchema(json);
          const normalized = normalizeData(json, schema);
          setParsedData(normalized);
          setPreviewSchema(schema);
          return;
        }
      }

      // Try CSV / Delimited
      Papa.parse(trimmed, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.errors.length > 0 && results.data.length === 0) {
            setErrorMsg(`Parsing failed: ${results.errors[0].message}`);
            setParsedData(null);
            return;
          }

          const rawRows = results.data as Record<string, any>[];
          if (rawRows.length === 0) {
            setErrorMsg('No valid rows found in data.');
            setParsedData(null);
            return;
          }

          const schema = inferSchema(rawRows);
          const normalized = normalizeData(rawRows, schema);
          setParsedData(normalized);
          setPreviewSchema(schema);
        },
        error: (err) => {
          setErrorMsg(`CSV error: ${err.message}`);
          setParsedData(null);
        },
      });
    } catch (e: any) {
      setErrorMsg(`Failed to parse: ${e.message || 'Invalid format'}`);
      setParsedData(null);
    }
  };

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const processFile = (file: File) => {
    const filename = file.name.replace(/\.[^/.]+$/, '');
    setDatasetName(filename || 'Uploaded Dataset');

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setRawText(content);
      handleParseText(content);
      setActiveTab('paste');
    };
    reader.readAsText(file);
  };

  const handleConfirmImport = () => {
    if (!parsedData || parsedData.length === 0) {
      setErrorMsg('Please paste or upload valid data before importing.');
      return;
    }

    const newDataset: Dataset = {
      id: `custom-dataset-${Date.now()}`,
      name: datasetName.trim() || 'Custom Dataset',
      description: datasetDesc.trim() || 'Imported dataset',
      data: parsedData,
      schema: previewSchema,
    };

    onImportDataset(newDataset);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="flex flex-col w-full max-w-4xl max-h-[90vh] rounded-lg bg-white shadow-2xl border border-slate-200 overflow-hidden">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-sm bg-indigo-600 flex items-center justify-center text-white font-bold text-base shadow-xs">
              Δ
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 uppercase tracking-tight">Import & Ingest Dataset</h2>
              <p className="text-xs text-slate-500 font-medium">
                Paste your CSV, TSV, or JSON data, upload a file, or pick a sample template.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          
          {/* Tabs */}
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
            <button
              onClick={() => setActiveTab('paste')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-bold transition-colors cursor-pointer ${
                activeTab === 'paste'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Code className="h-3.5 w-3.5" />
              Paste CSV / JSON / TSV
            </button>
            <button
              onClick={() => setActiveTab('upload')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-bold transition-colors cursor-pointer ${
                activeTab === 'upload'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <FileSpreadsheet className="h-3.5 w-3.5" />
              Upload File (.csv, .json)
            </button>
            <button
              onClick={() => setActiveTab('templates')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-bold transition-colors cursor-pointer ${
                activeTab === 'templates'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <FileText className="h-3.5 w-3.5" />
              Pre-built Templates
            </button>
          </div>

          {/* Dataset metadata inputs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">Dataset Name</label>
              <input
                type="text"
                value={datasetName}
                onChange={e => setDatasetName(e.target.value)}
                placeholder="e.g. Q1 Sales Report"
                className="w-full rounded border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-800 focus:border-indigo-600 focus:outline-hidden font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">Description (Optional)</label>
              <input
                type="text"
                value={datasetDesc}
                onChange={e => setDatasetDesc(e.target.value)}
                placeholder="e.g. Monthly regional sales breakdown"
                className="w-full rounded border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-800 focus:border-indigo-600 focus:outline-hidden font-medium"
              />
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === 'paste' && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Raw Data Input (CSV format with header row or JSON array)
                </label>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Auto-detects columns and types
                </span>
              </div>
              <textarea
                value={rawText}
                onChange={e => {
                  setRawText(e.target.value);
                  handleParseText(e.target.value);
                }}
                rows={7}
                placeholder="Date,Category,Region,Revenue,Expenses,Customers&#10;2025-01-01,Hardware,US,45000,12000,120&#10;2025-01-02,Software,EU,62000,15000,340&#10;2025-01-03,Services,APAC,38000,9500,85"
                className="w-full rounded border border-slate-300 bg-slate-50/50 p-3 font-mono text-xs text-slate-800 placeholder:text-slate-400 focus:border-indigo-600 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-indigo-600/30"
              />
            </div>
          )}

          {activeTab === 'upload' && (
            <div
              onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleFileDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`flex flex-col items-center justify-center p-8 rounded border-2 border-dashed cursor-pointer transition-all ${
                isDragging
                  ? 'border-indigo-500 bg-indigo-50/50 scale-[0.99]'
                  : 'border-slate-300 hover:border-slate-400 bg-slate-50/50'
              }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                accept=".csv, .tsv, .json, .txt"
                onChange={e => {
                  if (e.target.files && e.target.files[0]) {
                    processFile(e.target.files[0]);
                  }
                }}
                className="hidden"
              />
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 mb-3">
                <UploadCloud className="h-6 w-6" />
              </div>
              <p className="text-sm font-bold text-slate-800">Click to browse or drag & drop files here</p>
              <p className="text-xs text-slate-500 mt-1 font-medium">Supports CSV, TSV, JSON file formats</p>
            </div>
          )}

          {activeTab === 'templates' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {TEMPLATES.map(tmpl => (
                <div
                  key={tmpl.name}
                  onClick={() => {
                    setDatasetName(tmpl.name);
                    setRawText(tmpl.raw);
                    handleParseText(tmpl.raw);
                    setActiveTab('paste');
                  }}
                  className="group p-4 rounded border border-slate-200 bg-white hover:border-indigo-500 hover:shadow-sm cursor-pointer transition-all"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-slate-800 group-hover:text-indigo-600">
                      {tmpl.name}
                    </span>
                    <Plus className="h-4 w-4 text-slate-400 group-hover:text-indigo-600" />
                  </div>
                  <pre className="mt-2 text-[11px] font-mono text-slate-500 truncate bg-slate-50 p-2 rounded border border-slate-100">
                    {tmpl.raw.slice(0, 120)}...
                  </pre>
                </div>
              ))}
            </div>
          )}

          {/* Error notice */}
          {errorMsg && (
            <div className="flex items-center gap-2 p-3 rounded bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Preview Schema & Sample Rows */}
          {parsedData && parsedData.length > 0 && (
            <div className="rounded border border-slate-200 bg-slate-50/60 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>Successfully Parsed: {parsedData.length} records, {previewSchema.length} columns detected</span>
                </div>
              </div>

              {/* Schema Pills */}
              <div className="flex flex-wrap gap-1.5">
                {previewSchema.map(col => (
                  <div
                    key={col.key}
                    className="inline-flex items-center gap-1.5 rounded bg-white border border-slate-200 px-2.5 py-1 text-xs"
                  >
                    <span className="font-bold text-slate-800">{col.label}</span>
                    <span className={`text-[10px] font-mono uppercase px-1.5 py-0.2 rounded ${
                      col.type === 'number'
                        ? 'bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold'
                        : col.type === 'date'
                        ? 'bg-purple-50 border border-purple-200 text-purple-700 font-bold'
                        : 'bg-slate-100 text-slate-600 font-semibold'
                    }`}>
                      {col.type}
                    </span>
                  </div>
                ))}
              </div>

              {/* Sample preview table (first 3 rows) */}
              <div className="overflow-x-auto rounded border border-slate-200 bg-white">
                <table className="w-full text-[11px] text-left border-collapse">
                  <thead className="bg-slate-50 text-[10px] uppercase font-black text-slate-400 border-b border-slate-200">
                    <tr>
                      {previewSchema.map(col => (
                        <th key={col.key} className="px-3 py-2">
                          {col.key}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {parsedData.slice(0, 3).map((row, idx) => (
                      <tr key={idx} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                        {previewSchema.map(col => (
                          <td key={col.key} className="px-3 py-1.5 text-slate-700 whitespace-nowrap font-medium">
                            {String(row[col.key] ?? '')}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-slate-200 px-6 py-4 bg-slate-50">
          <button
            onClick={onClose}
            className="rounded border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirmImport}
            disabled={!parsedData || parsedData.length === 0}
            className={`flex items-center gap-2 rounded px-5 py-2 text-xs font-bold transition-all ${
              parsedData && parsedData.length > 0
                ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md cursor-pointer'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <CheckCircle2 className="h-4 w-4" />
            <span>Apply Dataset to Dashboard</span>
          </button>
        </div>

      </div>
    </div>
  );
};
