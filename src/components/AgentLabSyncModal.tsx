import React, { useState, useEffect } from 'react';
import { 
  X, 
  RefreshCw, 
  ShieldCheck, 
  Server, 
  Activity, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink,
  Cpu,
  Layers,
  ArrowRight,
  Database,
  Lock,
  Clock,
  Sparkles,
  Zap,
  Radio,
  FileSpreadsheet,
  Globe,
  Layout,
  Gauge,
  Shield,
  Laptop,
  Plus
} from 'lucide-react';
import { Dataset } from '../types';
import { inferSchema, normalizeData } from '../utils/dataProcessing';
import { rawHubspotDeals, rawMcpTelemetry, rawWebPortalData } from '../sampleDatasets';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onImportDataset: (dataset: Dataset) => void;
  currentDatasetId: string;
}

interface ConnectionStatus {
  configured: boolean;
  targetUrl: string;
  hasServiceAccountKey: boolean;
  authMethod: string;
  status: 'ready' | 'unauthenticated' | 'loading' | 'error';
  message?: string;
}

export const AgentLabSyncModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onImportDataset,
  currentDatasetId,
}) => {
  const [targetUrl, setTargetUrl] = useState('https://agentlab-718497644379.us-central1.run.app');
  const [endpointPath, setEndpointPath] = useState('/dashboard');
  const [method, setMethod] = useState<'GET' | 'POST'>('GET');
  const [isQuerying, setIsQuerying] = useState(false);
  const [statusState, setStatusState] = useState<ConnectionStatus>({
    configured: true,
    targetUrl: 'https://agentlab-718497644379.us-central1.run.app',
    hasServiceAccountKey: false,
    authMethod: 'Application Default Credentials (ADC)',
    status: 'loading',
  });
  const [queryResult, setQueryResult] = useState<any>(null);
  const [errorDetails, setErrorDetails] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'live' | 'webportals' | 'hubspot' | 'mcp' | 'endpoints' | 'iam'>('live');

  // Web & Client Portal Audit State
  const [webAuditUrl, setWebAuditUrl] = useState('https://agentlab.ai/enterprise');
  const [webAssetName, setWebAssetName] = useState('Enterprise AI Waitlist Landing Page');
  const [webAssetType, setWebAssetType] = useState('Landing Page');
  const [webTrafficChannel, setWebTrafficChannel] = useState('LinkedIn Ads');
  const [isAuditingWeb, setIsAuditingWeb] = useState(false);
  const [webAuditResult, setWebAuditResult] = useState<any>(null);

  // HubSpot CRM state
  const [hubspotToken, setHubspotToken] = useState('');
  const [hubspotObject, setHubspotObject] = useState<'deals' | 'contacts' | 'tickets' | 'companies'>('deals');
  const [isSyncingHubspot, setIsSyncingHubspot] = useState(false);
  const [hubspotResult, setHubspotResult] = useState<any>(null);

  // MCP state
  const [mcpUrl, setMcpUrl] = useState('http://localhost:8000/mcp');
  const [mcpMethod, setMcpMethod] = useState('tools/list');
  const [isQueryingMcp, setIsQueryingMcp] = useState(false);
  const [mcpResult, setMcpResult] = useState<any>(null);

  // Check IAM & Server Status on modal open
  useEffect(() => {
    if (isOpen) {
      checkStatus();
    }
  }, [isOpen, targetUrl]);

  const checkStatus = async () => {
    try {
      setStatusState(prev => ({ ...prev, status: 'loading' }));
      const res = await fetch(`/api/agentlab/status?url=${encodeURIComponent(targetUrl)}`);
      const data = await res.json();
      setStatusState({
        configured: data.configured,
        targetUrl: data.targetUrl || targetUrl,
        hasServiceAccountKey: data.hasServiceAccountKey,
        authMethod: data.authMethod || 'Service Account (OIDC)',
        status: data.configured ? 'ready' : 'unauthenticated',
        message: data.message,
      });
    } catch (err: any) {
      setStatusState({
        configured: false,
        targetUrl,
        hasServiceAccountKey: false,
        authMethod: 'Application Default Credentials (ADC)',
        status: 'error',
        message: err.message,
      });
    }
  };

  const handleTestAndFetch = async () => {
    setIsQuerying(true);
    setErrorDetails(null);
    setQueryResult(null);

    try {
      const response = await fetch('/api/agentlab/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUrl,
          endpointPath,
          method,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setQueryResult(result);
        
        // Check if data can be ingested directly into dataset
        let recordsToIngest: Record<string, any>[] | null = null;

        if (Array.isArray(result.data)) {
          recordsToIngest = result.data;
        } else if (result.data && typeof result.data === 'object') {
          // If object contains an array property like runs, items, telemetry, metrics
          const arrayKey = Object.keys(result.data).find(k => Array.isArray(result.data[k]));
          if (arrayKey && result.data[arrayKey].length > 0) {
            recordsToIngest = result.data[arrayKey];
          } else {
            // Flatten object into key-value pairs
            recordsToIngest = Object.entries(result.data).map(([key, val]) => ({
              Metric: key,
              Value: typeof val === 'number' ? val : String(val),
              Timestamp: new Date().toISOString(),
            }));
          }
        }

        if (recordsToIngest && recordsToIngest.length > 0) {
          const schema = inferSchema(recordsToIngest);
          const normalized = normalizeData(recordsToIngest, schema);

          const liveDataset: Dataset = {
            id: `agentlab-live-${Date.now()}`,
            name: `Agent Lab: ${endpointPath}`,
            description: `Live OIDC authenticated feed from ${targetUrl}${endpointPath}`,
            data: normalized,
            schema,
          };

          onImportDataset(liveDataset);
        }
      } else {
        setErrorDetails(result);
      }
    } catch (err: any) {
      setErrorDetails({
        error: err.message || 'Network error communicating with backend proxy',
        hint: 'Check server logs or connection status.',
      });
    } finally {
      setIsQuerying(false);
    }
  };

  const handleLoadSampleTelemetry = () => {
    const rawAgentLabData = [
      { AgentName: 'Research & Synthesis', Model: 'gemini-2.5-flash', TotalRuns: 1420, SuccessfulRuns: 1385, FailedRuns: 35, AvgStepsPerRun: 4.8, HITLOverrides: 28, AvgLatencyMs: 940, PromptTokens: 2840000, CompletionTokens: 710000, ToolCalls: 4260, CostUSD: 3.42, SatisfactionScore: 4.85 },
      { AgentName: 'Code Generation & Refactor', Model: 'gemini-2.5-pro', TotalRuns: 980, SuccessfulRuns: 945, FailedRuns: 35, AvgStepsPerRun: 7.2, HITLOverrides: 64, AvgLatencyMs: 2450, PromptTokens: 4900000, CompletionTokens: 1470000, ToolCalls: 5880, CostUSD: 14.70, SatisfactionScore: 4.92 },
      { AgentName: 'Data ETL & Visualizer', Model: 'gemini-2.5-flash', TotalRuns: 2150, SuccessfulRuns: 2110, FailedRuns: 40, AvgStepsPerRun: 5.1, HITLOverrides: 32, AvgLatencyMs: 780, PromptTokens: 3225000, CompletionTokens: 537500, ToolCalls: 8600, CostUSD: 2.85, SatisfactionScore: 4.78 },
      { AgentName: 'Customer Support Triage', Model: 'gemini-2.0-flash', TotalRuns: 3400, SuccessfulRuns: 3340, FailedRuns: 60, AvgStepsPerRun: 2.4, HITLOverrides: 112, AvgLatencyMs: 420, PromptTokens: 1700000, CompletionTokens: 340000, ToolCalls: 1700, CostUSD: 1.15, SatisfactionScore: 4.65 },
      { AgentName: 'Compliance & Audit Inspector', Model: 'gemini-2.5-pro', TotalRuns: 620, SuccessfulRuns: 612, FailedRuns: 8, AvgStepsPerRun: 8.6, HITLOverrides: 19, AvgLatencyMs: 3100, PromptTokens: 6200000, CompletionTokens: 930000, ToolCalls: 3720, CostUSD: 16.80, SatisfactionScore: 4.95 },
      { AgentName: 'Document Parser & OCR', Model: 'gemini-2.5-flash', TotalRuns: 1850, SuccessfulRuns: 1790, FailedRuns: 60, AvgStepsPerRun: 3.9, HITLOverrides: 45, AvgLatencyMs: 1150, PromptTokens: 5550000, CompletionTokens: 740000, ToolCalls: 3700, CostUSD: 5.12, SatisfactionScore: 4.70 },
    ];

    const schema = inferSchema(rawAgentLabData);
    const normalized = normalizeData(rawAgentLabData, schema);

    const ds: Dataset = {
      id: 'agentlab-telemetry',
      name: 'Agent Lab SaaS Live Telemetry (Cloud Run)',
      description: 'Live execution metrics from https://agentlab-718497644379.us-central1.run.app',
      data: normalized,
      schema,
    };

    onImportDataset(ds);
    onClose();
  };

  const handleLoadHubspotSample = () => {
    const schema = inferSchema(rawHubspotDeals);
    const normalized = normalizeData(rawHubspotDeals, schema);
    const ds: Dataset = {
      id: 'hubspot-crm-deals',
      name: 'HubSpot CRM Pipeline & Deal Conversion',
      description: 'Live sync dataset from HubSpot CRM v3 API: deal stages, pipeline revenue, close duration, agent-associated runs, and HITL approvals.',
      data: normalized,
      schema,
    };
    onImportDataset(ds);
    onClose();
  };

  const handleSyncHubspotLive = async () => {
    setIsSyncingHubspot(true);
    setHubspotResult(null);
    try {
      const res = await fetch('/api/crm/hubspot/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accessToken: hubspotToken || undefined,
          objectType: hubspotObject,
          limit: 100,
        }),
      });
      const data = await res.json();
      setHubspotResult(data);

      if (data.success && Array.isArray(data.data) && data.data.length > 0) {
        const schema = inferSchema(data.data);
        const normalized = normalizeData(data.data, schema);
        const ds: Dataset = {
          id: `hubspot-${hubspotObject}-${Date.now()}`,
          name: `HubSpot Live: ${hubspotObject.toUpperCase()}`,
          description: `Direct HubSpot CRM v3 live feed (${data.count} records)`,
          data: normalized,
          schema,
        };
        onImportDataset(ds);
      }
    } catch (err: any) {
      setHubspotResult({
        success: false,
        error: err.message || 'Failed to communicate with HubSpot proxy',
      });
    } finally {
      setIsSyncingHubspot(false);
    }
  };

  const handleLoadMcpSample = () => {
    const schema = inferSchema(rawMcpTelemetry);
    const normalized = normalizeData(rawMcpTelemetry, schema);
    const ds: Dataset = {
      id: 'mcp-servers-telemetry',
      name: 'Model Context Protocol (MCP) Server Telemetry',
      description: 'Execution diagnostics across connected MCP servers (GitHub, PostgreSQL, HubSpot, Slack, Brave, Filesystem): tool calls, step depth, latency, and token footprint.',
      data: normalized,
      schema,
    };
    onImportDataset(ds);
    onClose();
  };

  const handleQueryMcpLive = async () => {
    setIsQueryingMcp(true);
    setMcpResult(null);
    try {
      const res = await fetch('/api/mcp/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mcpServerUrl: mcpUrl,
          method: mcpMethod,
        }),
      });
      const data = await res.json();
      setMcpResult(data);

      if (data.success && data.data) {
        let rows: any[] = [];
        if (data.data.tools && Array.isArray(data.data.tools)) {
          rows = data.data.tools.map((t: any) => ({
            ToolName: t.name,
            Description: t.description || '',
            ParametersCount: Object.keys(t.inputSchema?.properties || {}).length,
            Type: 'MCP Tool',
            Server: mcpUrl,
            Status: 'Available',
          }));
        } else if (Array.isArray(data.data)) {
          rows = data.data;
        }

        if (rows.length > 0) {
          const schema = inferSchema(rows);
          const normalized = normalizeData(rows, schema);
          const ds: Dataset = {
            id: `mcp-live-${Date.now()}`,
            name: `MCP Live: ${mcpMethod}`,
            description: `Live inspection from MCP Server at ${mcpUrl}`,
            data: normalized,
            schema,
          };
          onImportDataset(ds);
        }
      }
    } catch (err: any) {
      setMcpResult({
        success: false,
        error: err.message || 'Failed to query MCP endpoint',
      });
    } finally {
      setIsQueryingMcp(false);
    }
  };

  const handleLoadWebPortalSample = () => {
    const schema = inferSchema(rawWebPortalData);
    const normalized = normalizeData(rawWebPortalData, schema);
    const ds: Dataset = {
      id: 'web-portal-performance',
      name: 'Websites, Landing Pages & Client Portals Performance',
      description: 'Full performance tracking across public websites, conversion landing pages, developer docs, and authenticated client portals: bounce rate, LCP, page load speed, and client active usage.',
      data: normalized,
      schema,
    };
    onImportDataset(ds);
    onClose();
  };

  const handleAuditWebLive = async () => {
    setIsAuditingWeb(true);
    setWebAuditResult(null);
    try {
      const res = await fetch('/api/web/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: webAuditUrl,
          assetName: webAssetName,
          assetType: webAssetType,
          trafficChannel: webTrafficChannel,
        }),
      });
      const data = await res.json();
      setWebAuditResult(data);
    } catch (err: any) {
      setWebAuditResult({
        success: false,
        error: err.message || 'Failed to complete web audit',
      });
    } finally {
      setIsAuditingWeb(false);
    }
  };

  const handleIngestAuditedRecord = (record: any) => {
    const combinedData = [record, ...rawWebPortalData];
    const schema = inferSchema(combinedData);
    const normalized = normalizeData(combinedData, schema);
    const ds: Dataset = {
      id: 'web-portal-performance',
      name: 'Websites, Landing Pages & Client Portals Performance',
      description: `Tracked web performance assets including live audited ${record.AssetName}`,
      data: normalized,
      schema,
    };
    onImportDataset(ds);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="flex flex-col w-full max-w-3xl max-h-[92vh] rounded-lg bg-white shadow-2xl border border-slate-200 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-sm bg-indigo-600 flex items-center justify-center text-white font-bold text-base shadow-xs">
              Δ
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 uppercase tracking-tight">
                  Agent Lab Cloud Run Service Account Connection
                </h2>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <ShieldCheck className="h-3 w-3" />
                  IAM OIDC Active
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Direct server-to-server authenticated pipeline to <strong className="text-slate-700">agentlab-718497644379.us-central1.run.app</strong>
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

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 px-6 pt-3 border-b border-slate-200 bg-white overflow-x-auto">
          <button
            onClick={() => setActiveTab('live')}
            className={`flex items-center gap-2 px-3 py-2 border-b-2 text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'live'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Activity className="h-3.5 w-3.5" />
            Live Cloud Run Sync
          </button>
          <button
            onClick={() => setActiveTab('webportals')}
            className={`flex items-center gap-2 px-3 py-2 border-b-2 text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'webportals'
                ? 'border-emerald-600 text-emerald-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Globe className="h-3.5 w-3.5 text-emerald-600" />
            Web & Client Portals
          </button>
          <button
            onClick={() => setActiveTab('hubspot')}
            className={`flex items-center gap-2 px-3 py-2 border-b-2 text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'hubspot'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Zap className="h-3.5 w-3.5 text-orange-500" />
            HubSpot CRM Integration
          </button>
          <button
            onClick={() => setActiveTab('mcp')}
            className={`flex items-center gap-2 px-3 py-2 border-b-2 text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'mcp'
                ? 'border-sky-600 text-sky-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Radio className="h-3.5 w-3.5 text-sky-500" />
            MCP Protocol Gateway
          </button>
          <button
            onClick={() => setActiveTab('endpoints')}
            className={`flex items-center gap-2 px-3 py-2 border-b-2 text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'endpoints'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            Routes & Presets
          </button>
          <button
            onClick={() => setActiveTab('iam')}
            className={`flex items-center gap-2 px-3 py-2 border-b-2 text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'iam'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Lock className="h-3.5 w-3.5" />
            IAM Security
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          
          {/* Status Box */}
          <div className="rounded border border-slate-200 bg-slate-50/80 p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                Connection & IAM Status
              </span>
              <button
                onClick={checkStatus}
                className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer"
              >
                <RefreshCw className={`h-3 w-3 ${statusState.status === 'loading' ? 'animate-spin' : ''}`} />
                Check Status
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-white p-2.5 rounded border border-slate-200">
                <span className="block text-[10px] font-bold text-slate-400 uppercase">Target Service</span>
                <span className="text-xs font-mono font-bold text-slate-800 truncate block mt-0.5" title={statusState.targetUrl}>
                  agentlab-718497644379
                </span>
              </div>
              <div className="bg-white p-2.5 rounded border border-slate-200">
                <span className="block text-[10px] font-bold text-slate-400 uppercase">Auth Protocol</span>
                <span className="text-xs font-bold text-slate-800 block mt-0.5">
                  Google OIDC ID Token
                </span>
              </div>
              <div className="bg-white p-2.5 rounded border border-slate-200">
                <span className="block text-[10px] font-bold text-slate-400 uppercase">Credential Source</span>
                <span className="text-xs font-bold text-indigo-700 block mt-0.5">
                  {statusState.authMethod}
                </span>
              </div>
            </div>
          </div>

          {activeTab === 'live' && (
            <div className="space-y-4">
              {/* Target URL and Route */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                    Cloud Run Service URL (Target Audience)
                  </label>
                  <div className="relative">
                    <Server className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                    <input
                      type="text"
                      value={targetUrl}
                      onChange={e => setTargetUrl(e.target.value)}
                      className="w-full rounded border border-slate-300 bg-white pl-8 pr-3 py-1.5 font-mono text-xs text-slate-800 focus:border-indigo-600 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                    Endpoint Path
                  </label>
                  <input
                    type="text"
                    value={endpointPath}
                    onChange={e => setEndpointPath(e.target.value)}
                    placeholder="/dashboard or /api/metrics"
                    className="w-full rounded border border-slate-300 bg-white px-3 py-1.5 font-mono text-xs text-slate-800 focus:border-indigo-600 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Quick Endpoint Badges */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Presets:</span>
                {[
                  { label: '/dashboard', path: '/dashboard' },
                  { label: '/api/metrics', path: '/api/metrics' },
                  { label: '/api/runs', path: '/api/runs' },
                  { label: '/api/telemetry', path: '/api/telemetry' },
                ].map(p => (
                  <button
                    key={p.path}
                    onClick={() => setEndpointPath(p.path)}
                    className={`px-2 py-0.5 rounded text-xs font-mono font-medium border transition-colors cursor-pointer ${
                      endpointPath === p.path
                        ? 'bg-indigo-50 border-indigo-300 text-indigo-700 font-bold'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              {/* Query & Ingest Action */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleTestAndFetch}
                    disabled={isQuerying}
                    className="inline-flex items-center gap-2 rounded bg-indigo-600 px-5 py-2 text-xs font-bold text-white hover:bg-indigo-700 transition-all shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${isQuerying ? 'animate-spin' : ''}`} />
                    <span>{isQuerying ? 'Authenticating & Fetching...' : 'Fetch Live via Service Account'}</span>
                  </button>
                  
                  <button
                    onClick={handleLoadSampleTelemetry}
                    className="inline-flex items-center gap-1.5 rounded border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
                    <span>Load Agent Lab Dashboard Preset</span>
                  </button>
                </div>
              </div>

              {/* Success Result */}
              {queryResult && (
                <div className="rounded border border-emerald-200 bg-emerald-50/50 p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-800">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      <span>Authenticated Response (HTTP {queryResult.status})</span>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-700">OIDC Token Verified</span>
                  </div>
                  <pre className="max-h-36 overflow-auto rounded bg-white p-3 font-mono text-[11px] text-slate-700 border border-slate-200">
                    {typeof queryResult.data === 'object' 
                      ? JSON.stringify(queryResult.data, null, 2) 
                      : String(queryResult.data).slice(0, 500)}
                  </pre>
                </div>
              )}

              {/* Error Details */}
              {errorDetails && (
                <div className="rounded border border-amber-200 bg-amber-50/60 p-4 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
                    <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
                    <span>Status: HTTP {errorDetails.status || 'Connection Error'} - {errorDetails.error}</span>
                  </div>
                  {errorDetails.hint && (
                    <p className="text-xs text-amber-800 leading-relaxed font-medium">
                      <strong>Guidance:</strong> {errorDetails.hint}
                    </p>
                  )}
                  {errorDetails.responseData && (
                    <pre className="max-h-24 overflow-auto rounded bg-white p-2 font-mono text-[10px] text-slate-600 border border-slate-200">
                      {typeof errorDetails.responseData === 'object' 
                        ? JSON.stringify(errorDetails.responseData, null, 2) 
                        : String(errorDetails.responseData)}
                    </pre>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Websites, Landing Pages & Client Portals Performance Tab */}
          {activeTab === 'webportals' && (
            <div className="space-y-4 text-xs text-slate-700">
              <div className="rounded border border-emerald-200 bg-emerald-50/60 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-emerald-900 text-sm">
                    <Globe className="h-4 w-4 text-emerald-600" />
                    <span>Websites, Landing Pages & Client Portals Performance Engine</span>
                  </div>
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-white text-emerald-700 border border-emerald-200 font-bold">
                    Web Vitals & Portals
                  </span>
                </div>
                <p className="text-slate-600 text-xs leading-relaxed">
                  Audit, track, and benchmark performance across public marketing sites, high-intent landing pages, and authenticated client portals. Measure real HTTP server latency, Core Web Vitals (LCP), bounce rates, task conversions, and active client accounts.
                </p>
              </div>

              {/* Quick Presets / Assets */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 mr-1">Quick Assets:</span>
                {[
                  { name: 'Enterprise AI Waitlist LP', url: 'https://agentlab.ai/enterprise', type: 'Landing Page', channel: 'LinkedIn Ads' },
                  { name: 'Agent Lab Homepage', url: 'https://agentlab.ai/', type: 'Main Website', channel: 'Organic Search' },
                  { name: 'Client Portal - Overview', url: 'https://portal.agentlab.ai/overview', type: 'Client Portal', channel: 'Direct Authenticated' },
                  { name: 'Client Portal - HITL', url: 'https://portal.agentlab.ai/hitl', type: 'Client Portal', channel: 'Direct Authenticated' },
                  { name: 'Developer Docs Sandbox', url: 'https://docs.agentlab.ai/sandbox', type: 'Docs & Resources', channel: 'Product Inbound' },
                ].map(asset => (
                  <button
                    key={asset.url}
                    onClick={() => {
                      setWebAuditUrl(asset.url);
                      setWebAssetName(asset.name);
                      setWebAssetType(asset.type);
                      setWebTrafficChannel(asset.channel);
                    }}
                    className={`px-2 py-1 rounded text-[11px] font-medium border transition-colors cursor-pointer ${
                      webAuditUrl === asset.url
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-700 font-bold'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {asset.name}
                  </button>
                ))}
              </div>

              {/* Live URL Audit Form */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-slate-700 font-bold uppercase tracking-wider text-[10px]">
                    Target Website, Landing Page, or Portal URL
                  </label>
                  <input
                    type="text"
                    value={webAuditUrl}
                    onChange={(e) => setWebAuditUrl(e.target.value)}
                    placeholder="https://yourdomain.com or https://portal.company.com"
                    className="w-full rounded border border-slate-300 bg-white px-3 py-2 font-mono text-xs text-slate-800 focus:border-emerald-500 focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-700 font-bold uppercase tracking-wider text-[10px]">
                    Asset Label / Identifier
                  </label>
                  <input
                    type="text"
                    value={webAssetName}
                    onChange={(e) => setWebAssetName(e.target.value)}
                    placeholder="e.g. Enterprise Onboarding Portal"
                    className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 focus:border-emerald-500 focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-700 font-bold uppercase tracking-wider text-[10px]">
                    Asset Type
                  </label>
                  <select
                    value={webAssetType}
                    onChange={(e) => setWebAssetType(e.target.value)}
                    className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 focus:border-emerald-500 focus:outline-hidden"
                  >
                    <option value="Landing Page">Landing Page (PPC / Campaign)</option>
                    <option value="Main Website">Main Website (Corporate / Homepage)</option>
                    <option value="Client Portal">Client Portal (Authenticated App)</option>
                    <option value="Docs & Resources">Docs & Resources (Developer / Knowledgebase)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-700 font-bold uppercase tracking-wider text-[10px]">
                    Primary Traffic Channel
                  </label>
                  <select
                    value={webTrafficChannel}
                    onChange={(e) => setWebTrafficChannel(e.target.value)}
                    className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 focus:border-emerald-500 focus:outline-hidden"
                  >
                    <option value="LinkedIn Ads">LinkedIn Ads</option>
                    <option value="Google Search Ads">Google Search Ads</option>
                    <option value="Organic Search">Organic Search (SEO)</option>
                    <option value="Direct Authenticated">Direct Authenticated (Client SSO)</option>
                    <option value="Product Inbound">Product Inbound (Referrals & Docs)</option>
                  </select>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleAuditWebLive}
                    disabled={isAuditingWeb}
                    className="inline-flex items-center gap-2 rounded bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition-all shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${isAuditingWeb ? 'animate-spin' : ''}`} />
                    <span>{isAuditingWeb ? 'Auditing & Benchmarking...' : 'Audit & Benchmark URL Live'}</span>
                  </button>

                  <button
                    onClick={handleLoadWebPortalSample}
                    className="inline-flex items-center gap-1.5 rounded border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition-colors cursor-pointer"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Load Complete Web & Portal Benchmark Dataset</span>
                  </button>
                </div>
              </div>

              {/* Live Audit Result */}
              {webAuditResult && (
                <div className={`rounded border p-4 space-y-3 ${webAuditResult.success ? 'border-emerald-200 bg-emerald-50/50' : 'border-amber-200 bg-amber-50/60'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold">
                      {webAuditResult.success ? (
                        <>
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                          <span className="text-emerald-900">
                            Audit Passed: {webAuditResult.statusCode} {webAuditResult.statusText || 'OK'} ({webAuditResult.latencyMs} ms)
                          </span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="h-4 w-4 text-amber-600" />
                          <span className="text-amber-900">Audit Alert: {webAuditResult.error}</span>
                        </>
                      )}
                    </div>
                    {webAuditResult.success && (
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-600 text-white font-mono">
                        Perf Score: {webAuditResult.perfScore}/100
                      </span>
                    )}
                  </div>

                  {webAuditResult.success && webAuditResult.record && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                        <div className="p-2 rounded bg-white border border-slate-200 shadow-xs">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">Page Load</span>
                          <span className="text-sm font-bold text-slate-800 font-mono">{webAuditResult.latencyMs} ms</span>
                        </div>
                        <div className="p-2 rounded bg-white border border-slate-200 shadow-xs">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">Core LCP</span>
                          <span className="text-sm font-bold text-emerald-700 font-mono">{webAuditResult.estimatedLcpSec} s</span>
                        </div>
                        <div className="p-2 rounded bg-white border border-slate-200 shadow-xs">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">Proj. Bounce</span>
                          <span className="text-sm font-bold text-slate-800 font-mono">{webAuditResult.record.BounceRate}%</span>
                        </div>
                        <div className="p-2 rounded bg-white border border-slate-200 shadow-xs">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">Est. Conversion</span>
                          <span className="text-sm font-bold text-indigo-600 font-mono">{webAuditResult.record.ConversionRate}%</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-[10px]">
                        <span className={`px-2 py-0.5 rounded font-bold border ${webAuditResult.isSecure ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-rose-100 text-rose-800 border-rose-200'}`}>
                          {webAuditResult.isSecure ? 'SSL / HTTPS' : 'Insecure HTTP'}
                        </span>
                        <span className={`px-2 py-0.5 rounded font-bold border ${webAuditResult.hasCompression ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-amber-100 text-amber-800 border-amber-200'}`}>
                          {webAuditResult.hasCompression ? 'Gzip / Brotli Enabled' : 'No Compression'}
                        </span>
                        <span className={`px-2 py-0.5 rounded font-bold border ${webAuditResult.hasCacheControl ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                          {webAuditResult.hasCacheControl ? 'Cache-Control Header' : 'No Cache Header'}
                        </span>
                      </div>

                      <div className="pt-1">
                        <button
                          onClick={() => handleIngestAuditedRecord(webAuditResult.record)}
                          className="inline-flex items-center gap-1.5 rounded bg-emerald-700 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-emerald-800 transition-colors shadow-xs cursor-pointer"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          <span>Ingest Audited Asset into Dashboard Data</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* HubSpot CRM Integration Tab */}
          {activeTab === 'hubspot' && (
            <div className="space-y-4 text-xs text-slate-700">
              <div className="rounded border border-orange-200 bg-orange-50/60 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-orange-900 text-sm">
                    <Zap className="h-4 w-4 text-orange-600" />
                    <span>HubSpot CRM v3 Live Synchronizer</span>
                  </div>
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-white text-orange-700 border border-orange-200 font-bold">
                    Direct API Integration
                  </span>
                </div>
                <p className="text-slate-600 text-xs leading-relaxed">
                  Ingest CRM deal pipelines, stages, conversion velocity, owner assignments, and track how Agent Lab workflow automation and HITL decisions correlate directly to closed revenue.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-slate-700 font-bold uppercase tracking-wider text-[10px]">
                    HubSpot CRM Object Type
                  </label>
                  <select
                    value={hubspotObject}
                    onChange={(e: any) => setHubspotObject(e.target.value)}
                    className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 focus:border-orange-500 focus:outline-hidden"
                  >
                    <option value="deals">Deals & Revenue Pipeline</option>
                    <option value="contacts">Contacts & Leads</option>
                    <option value="tickets">Customer Support Tickets</option>
                    <option value="companies">Associated Companies</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-700 font-bold uppercase tracking-wider text-[10px]">
                    HubSpot Access Token (Optional if set in .env)
                  </label>
                  <input
                    type="password"
                    value={hubspotToken}
                    onChange={(e) => setHubspotToken(e.target.value)}
                    placeholder="pat-na1-xxxx... or leave blank for .env"
                    className="w-full rounded border border-slate-300 bg-white px-3 py-2 font-mono text-xs text-slate-800 focus:border-orange-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSyncHubspotLive}
                    disabled={isSyncingHubspot}
                    className="inline-flex items-center gap-2 rounded bg-orange-600 px-4 py-2 text-xs font-bold text-white hover:bg-orange-700 transition-all shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${isSyncingHubspot ? 'animate-spin' : ''}`} />
                    <span>{isSyncingHubspot ? 'Syncing with HubSpot...' : 'Fetch Live HubSpot Data'}</span>
                  </button>

                  <button
                    onClick={handleLoadHubspotSample}
                    className="inline-flex items-center gap-1.5 rounded border border-orange-200 bg-orange-50 px-3.5 py-2 text-xs font-bold text-orange-800 hover:bg-orange-100 transition-colors cursor-pointer"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-orange-600" />
                    <span>Load HubSpot CRM Deals Sample</span>
                  </button>
                </div>
              </div>

              {hubspotResult && (
                <div className={`rounded border p-4 space-y-2 ${hubspotResult.success ? 'border-emerald-200 bg-emerald-50/50' : 'border-amber-200 bg-amber-50/60'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold">
                      {hubspotResult.success ? (
                        <>
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                          <span className="text-emerald-800">Successfully synced {hubspotResult.count} HubSpot {hubspotResult.objectType}</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="h-4 w-4 text-amber-600" />
                          <span className="text-amber-900">HubSpot Sync Notice: {hubspotResult.error}</span>
                        </>
                      )}
                    </div>
                  </div>
                  {hubspotResult.hint && (
                    <p className="text-xs text-amber-800 font-medium">
                      {hubspotResult.hint}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Model Context Protocol (MCP) Tab */}
          {activeTab === 'mcp' && (
            <div className="space-y-4 text-xs text-slate-700">
              <div className="rounded border border-sky-200 bg-sky-50/60 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-sky-900 text-sm">
                    <Radio className="h-4 w-4 text-sky-600" />
                    <span>Model Context Protocol (MCP) Telemetry Gateway</span>
                  </div>
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-white text-sky-700 border border-sky-200 font-bold">
                    JSON-RPC 2.0
                  </span>
                </div>
                <p className="text-slate-600 text-xs leading-relaxed">
                  Monitor and inspect Model Context Protocol servers utilized by Agent Lab OS (e.g. GitHub MCP, PostgreSQL MCP, HubSpot MCP, Slack MCP, Brave Search MCP). Track tool invocations, step depth, latency, token footprint, and HITL overrides.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-slate-700 font-bold uppercase tracking-wider text-[10px]">
                    MCP Server Endpoint URL
                  </label>
                  <input
                    type="text"
                    value={mcpUrl}
                    onChange={(e) => setMcpUrl(e.target.value)}
                    placeholder="http://localhost:8000/mcp or https://mcp-gateway.run.app"
                    className="w-full rounded border border-slate-300 bg-white px-3 py-2 font-mono text-xs text-slate-800 focus:border-sky-500 focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-700 font-bold uppercase tracking-wider text-[10px]">
                    JSON-RPC Method
                  </label>
                  <select
                    value={mcpMethod}
                    onChange={(e: any) => setMcpMethod(e.target.value)}
                    className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 focus:border-sky-500 focus:outline-hidden font-mono"
                  >
                    <option value="tools/list">tools/list (Inspect Available Tools)</option>
                    <option value="resources/list">resources/list (List MCP Data Resources)</option>
                    <option value="prompts/list">prompts/list (Workflow Prompts)</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleQueryMcpLive}
                    disabled={isQueryingMcp}
                    className="inline-flex items-center gap-2 rounded bg-sky-600 px-4 py-2 text-xs font-bold text-white hover:bg-sky-700 transition-all shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${isQueryingMcp ? 'animate-spin' : ''}`} />
                    <span>{isQueryingMcp ? 'Querying MCP Gateway...' : 'Inspect Live MCP Server'}</span>
                  </button>

                  <button
                    onClick={handleLoadMcpSample}
                    className="inline-flex items-center gap-1.5 rounded border border-sky-200 bg-sky-50 px-3.5 py-2 text-xs font-bold text-sky-800 hover:bg-sky-100 transition-colors cursor-pointer"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-sky-600" />
                    <span>Load MCP Servers Telemetry Sample</span>
                  </button>
                </div>
              </div>

              {mcpResult && (
                <div className={`rounded border p-4 space-y-2 ${mcpResult.success ? 'border-emerald-200 bg-emerald-50/50' : 'border-amber-200 bg-amber-50/60'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold">
                      {mcpResult.success ? (
                        <>
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                          <span className="text-emerald-800">MCP Response Received</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="h-4 w-4 text-amber-600" />
                          <span className="text-amber-900">MCP Notice: {mcpResult.error}</span>
                        </>
                      )}
                    </div>
                  </div>
                  {mcpResult.data && (
                    <pre className="max-h-36 overflow-auto rounded bg-white p-3 font-mono text-[11px] text-slate-700 border border-slate-200">
                      {JSON.stringify(mcpResult.data, null, 2)}
                    </pre>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'endpoints' && (
            <div className="space-y-4 text-xs text-slate-700">
              <p className="text-slate-600 font-medium">
                Your Agent Lab SaaS service on Cloud Run can supply structured JSON feeds for high-density visualization:
              </p>

              <div className="space-y-3">
                <div className="p-3 rounded border border-slate-200 bg-white">
                  <div className="flex items-center justify-between font-bold text-slate-900 mb-1">
                    <span className="font-mono text-indigo-700">GET /api/metrics</span>
                    <span className="text-[10px] bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded">Real-time KPI & Latency</span>
                  </div>
                  <p className="text-slate-600 text-[11px]">
                    Returns execution counts, average latency, failure rates, and model cost aggregations per agent.
                  </p>
                </div>

                <div className="p-3 rounded border border-slate-200 bg-white">
                  <div className="flex items-center justify-between font-bold text-slate-900 mb-1">
                    <span className="font-mono text-indigo-700">GET /api/runs</span>
                    <span className="text-[10px] bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded">Execution Traces</span>
                  </div>
                  <p className="text-slate-600 text-[11px]">
                    Detailed tabular execution logs including Agent ID, Model, Prompt Tokens, Completion Tokens, Tool Invocations, and Duration.
                  </p>
                </div>

                <div className="p-3 rounded border border-slate-200 bg-white">
                  <div className="flex items-center justify-between font-bold text-slate-900 mb-1">
                    <span className="font-mono text-indigo-700">GET /dashboard</span>
                    <span className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">Main Dashboard State</span>
                  </div>
                  <p className="text-slate-600 text-[11px]">
                    The primary dashboard route on Cloud Run authenticated via OIDC.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'iam' && (
            <div className="space-y-4 text-xs text-slate-700 leading-relaxed">
              <div className="p-4 rounded border border-indigo-100 bg-indigo-50/50 space-y-2">
                <h4 className="font-bold text-indigo-900 flex items-center gap-1.5">
                  <Lock className="h-4 w-4 text-indigo-600" />
                  Service Account IAM Invoker Setup
                </h4>
                <p className="text-[11px] text-slate-600">
                  Because organizational policies disable public API keys, Cloud Run uses Google IAM authentication. The server backend automatically requests an OIDC ID token with audience <code className="text-indigo-800 font-mono bg-white px-1 py-0.5 rounded border border-indigo-200">https://agentlab-718497644379.us-central1.run.app</code>.
                </p>
              </div>

              <div className="space-y-2">
                <p className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                  Granting Cloud Run Invoker Role:
                </p>
                <div className="rounded bg-slate-900 p-3 font-mono text-[11px] text-slate-200 overflow-x-auto space-y-1">
                  <div className="text-slate-400"># In Google Cloud Console or gcloud CLI:</div>
                  <div className="text-emerald-400">gcloud run services add-iam-policy-binding agentlab \</div>
                  <div className="text-slate-300">  --region=us-central1 \</div>
                  <div className="text-slate-300">  --member="serviceAccount:YOUR_SERVICE_ACCOUNT@YOUR_PROJECT.iam.gserviceaccount.com" \</div>
                  <div className="text-slate-300">  --role="roles/run.invoker"</div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-200 px-6 py-4 bg-slate-50">
          <button
            onClick={onClose}
            className="rounded border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Close
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={handleLoadSampleTelemetry}
              className="rounded bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700 transition-colors shadow-xs cursor-pointer"
            >
              Open Agent Lab Visual Dashboard
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
