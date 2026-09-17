export interface MetricInterpretation {
  key: string;
  name: string;
  category: 'Agent Lab OS & AI' | 'CRM & Revenue' | 'MCP Servers' | 'Operations & Performance' | 'Web & Client Portals' | 'Financial & Cash Flow' | 'Tech Stack & Architecture';
  formula?: string;
  description: string;
  interpretation: string;
  idealRange: string;
  warningSigns: string;
  operationalImpact: string;
}

export const METRIC_DICTIONARY: Record<string, MetricInterpretation> = {
  monthlycostusd: {
    key: 'monthlycostusd',
    name: 'Monthly Tool & Infrastructure Spend ($)',
    category: 'Tech Stack & Architecture',
    formula: 'Sum of active SaaS licenses + cloud compute consumption + API token commitments',
    description: 'Current monthly recurring expense dedicated to maintaining a specific technology tool in production or fallback state.',
    interpretation: 'Identifies software bloat vs. high-leverage tools. Tools with $0 cost indicate open-source or grandfathered free tiers.',
    idealRange: 'Aligned with productivity ROI; zero zombie subscriptions',
    warningSigns: 'Software spend growing faster than engineering headcount without workload justification.',
    operationalImpact: 'Directly impacts gross margins, EBITDA, and company runway.',
  },
  healthscore: {
    key: 'healthscore',
    name: 'Tech Health & Reliability Score (1-100)',
    category: 'Tech Stack & Architecture',
    formula: 'Weighted index of uptime SLA + API deprecation risk + credential health + vendor viability',
    description: 'A composite health index indicating how secure, maintained, and reliable a tool is within the stack.',
    interpretation: 'Scores > 90 reflect rock-solid production standards. Scores < 50 flag sunsetted tech, revoked access, or deprecated endpoints.',
    idealRange: '>= 90 for core production infrastructure; >= 75 for legacy fallbacks',
    warningSigns: 'Scores dropping below 70 indicate impending deprecation, vendor price shock, or unpatched security vulnerabilities.',
    operationalImpact: 'Guides quarterly technical debt reduction and migration scheduling.',
  },
  lifecyclestatus: {
    key: 'lifecyclestatus',
    name: 'Technology Lifecycle Status',
    category: 'Tech Stack & Architecture',
    formula: 'Active (Production) vs. Legacy Available vs. Lost Access / Deprecated',
    description: 'Current operational stance of the tool: in daily production, maintained as an accessible backup, or permanently retired/lost.',
    interpretation: 'Essential for architecture governance. Knowing what is still accessible prevents re-purchasing tools already available.',
    idealRange: 'Clear separation between active dependencies and dormant fallbacks',
    warningSigns: 'Dormant tech remaining in code repos without verified emergency access procedures.',
    operationalImpact: 'Prevents security blind spots, orphaned API credentials, and duplicate software purchases.',
  },
  inflowusd: {
    key: 'inflowusd',
    name: 'Cash Inflows & Sales Receipts ($)',
    category: 'Financial & Cash Flow',
    formula: 'Sum of collected invoice payments, recurring Stripe transfers & upfront contracts',
    description: 'Total real money entering corporate bank accounts from enterprise customers and subscription billings.',
    interpretation: 'Measures cash collection velocity. High top-line bookings mean nothing if accounts receivable remains uncollected.',
    idealRange: 'Inflows exceeding Outflows (Net Positive Cash Flow) with DSO < 30 days',
    warningSigns: 'Inflow lulls exceeding 45 days despite active closed-won contracts indicate invoicing or collection bottlenecks.',
    operationalImpact: 'Directly finances ongoing cloud infrastructure, GPU token capacity, and payroll.',
  },
  costoutflowusd: {
    key: 'costoutflowusd',
    name: 'Operational Costs & Infrastructure Outflows ($)',
    category: 'Financial & Cash Flow',
    formula: 'Total Compute Costs (Cloud Run, GPUs) + LLM Token Fees + SaaS Subscriptions + Vendor Tooling',
    description: 'All cash departing corporate operating accounts for cloud providers, model APIs, software licenses, and external partners.',
    interpretation: 'Represents the cost of delivering agent workflows and maintaining the SaaS platform. Must be monitored against gross margins.',
    idealRange: 'Infra & LLM COGS < 20% of monthly software revenue (80%+ Gross Margin)',
    warningSigns: 'Sudden jumps in LLM token invoices or unbounded Cloud Run scaling without matching revenue increases.',
    operationalImpact: 'Determines monthly burn rate and shortens runway if variable token consumption spikes without throttling.',
  },
  netcashimpact: {
    key: 'netcashimpact',
    name: 'Net Cash Flow & Burn Rate ($)',
    category: 'Financial & Cash Flow',
    formula: 'Inflows ($) - Outflows ($)',
    description: 'The net monthly cash surplus or operational burn generated across all activities.',
    interpretation: 'A positive number indicates self-sustaining cash generation (default alive). A negative number defines net cash burn rate.',
    idealRange: '> $0 (Cash flow positive) or controlled burn with >= 18 months runway',
    warningSigns: 'Consecutive months of expanding negative cash flow without pipeline expansion.',
    operationalImpact: 'Dictates company runway, hiring freeze triggers, and need for venture or debt financing.',
  },
  daysuntildue: {
    key: 'daysuntildue',
    name: 'Invoice Due Dates & Days Remaining',
    category: 'Financial & Cash Flow',
    formula: 'Target Due Date - Current Calendar Date',
    description: 'Countdown in days until a vendor subscription renews, an invoice is payable, or customer payment is expected.',
    interpretation: 'Enables proactive cash management so treasury accounts are liquid before major vendor autopays trigger.',
    idealRange: 'Bills paid on Net-30 terms; 0 overdue payables or receivables',
    warningSigns: 'Negative values (< 0 days) signify overdue liabilities or uncollected customer receivables.',
    operationalImpact: 'Avoids service disruption from unpaid cloud providers (e.g. Google Cloud, Anthropic, Datadog).',
  },
  trialdaysleft: {
    key: 'trialdaysleft',
    name: 'Customer Trial Periods & Days Left',
    category: 'Financial & Cash Flow',
    formula: 'Trial Expiration Date - Current Date (Days)',
    description: 'The remaining duration on enterprise pilot sandboxes, proof-of-concepts, and trial tiers.',
    interpretation: 'A tight countdown for sales engineering. Customer engagement during the final 5 days of a trial determines 80% of conversion outcomes.',
    idealRange: '14 to 30 days total trial duration; active conversion engagement initiated at <= 5 days remaining',
    warningSigns: 'Trials reaching <= 2 days without decision-maker contract sign-off or executive sponsor check-in.',
    operationalImpact: 'Directly feeds the near-term closed-won revenue pipeline and customer acquisition momentum.',
  },
  trialconversionprob: {
    key: 'trialconversionprob',
    name: 'Trial-to-Paid Conversion Probability (%)',
    category: 'Financial & Cash Flow',
    formula: 'Weighted probability score based on portal activity, API calls, and HITL satisfaction',
    description: 'Statistical likelihood that an active enterprise pilot converts into an annual recurring contract.',
    interpretation: 'High-scoring trials represent high-probability near-term cash inflows.',
    idealRange: '>= 75% for qualified enterprise sandbox pilots',
    warningSigns: 'Trials below 50% indicate low user onboarding or unmet technical requirements during evaluation.',
    operationalImpact: 'Allows finance teams to forecast next quarter ARR with high confidence.',
  },
  arrimpact: {
    key: 'arrimpact',
    name: 'Annual Recurring Revenue (ARR) Impact ($)',
    category: 'Financial & Cash Flow',
    formula: 'Annualized recurring value of contracts (or annualized vendor commitments)',
    description: 'The 12-month normalized run rate contribution of each sales contract, customer trial, or recurring expense.',
    interpretation: 'The ultimate enterprise valuation driver. Positive ARR compounds enterprise SaaS enterprise value.',
    idealRange: 'Net ARR expansion > 120% YoY (Net Dollar Retention)',
    warningSigns: 'Stagnant new contract ARR or cancellations outpacing new enterprise trial conversions.',
    operationalImpact: 'Determines valuation multiple, investor reporting, and annual growth trajectory.',
  },
  hitloverrides: {
    key: 'hitloverrides',
    name: 'Human-in-the-Loop (HITL) Overrides',
    category: 'Agent Lab OS & AI',
    formula: 'Count of runs where a human supervisor modified, corrected, or rejected the agent action',
    description: 'Measures how often human operator intervention was necessary before an agent execution could proceed or conclude.',
    interpretation: 'A lower override count indicates high agent self-sufficiency and trust in deterministic decision paths. Spikes indicate ambiguous prompt conditions or edge cases.',
    idealRange: '< 3% of total workflow runs (or 0 for routine tasks)',
    warningSigns: 'Sudden increases above 5-10% mean prompt drift, unexpected schema variations in upstream APIs, or unhandled tool failures.',
    operationalImpact: 'Each override consumes human staff hours and introduces latency into automated pipelines.',
  },
  avgstepsperrun: {
    key: 'avgstepsperrun',
    name: 'Average Steps Per Run',
    category: 'Agent Lab OS & AI',
    formula: 'Total tool execution steps & sub-agent turns / Total completed runs',
    description: 'The average number of reasoning iterations, tool invocations, or sub-agent handoffs taken to complete a workflow.',
    interpretation: 'Reflects workflow complexity and problem-solving depth. While higher step depth is normal for deep research, high steps on simple tasks suggest agent loops or hallucinations.',
    idealRange: '2.0 – 4.5 steps for operational tasks; 5.0 – 8.0 for deep research/coding',
    warningSigns: 'Runs exceeding 10+ steps on standard tasks usually denote cyclic tool execution (getting stuck on file reads or API errors).',
    operationalImpact: 'Directly dictates LLM token consumption and end-to-end execution latency.',
  },
  totalruns: {
    key: 'totalruns',
    name: 'Total Runs / Executions',
    category: 'Agent Lab OS & AI',
    formula: 'Count of all initiated workflow runs',
    description: 'Volume of workflow tasks dispatched to the Agent Lab OS orchestration engine.',
    interpretation: 'Primary throughput metric demonstrating organizational adoption of automated workflows.',
    idealRange: 'Consistent or steadily climbing week-over-week based on operational load',
    warningSigns: 'Sharp drops indicate broken upstream triggers, webhooks, or scheduled job failures.',
    operationalImpact: 'Determines cloud scaling requirements and concurrency limits on Cloud Run containers.',
  },
  successfulruns: {
    key: 'successfulruns',
    name: 'Successful Runs & Success Rate',
    category: 'Agent Lab OS & AI',
    formula: '(SuccessfulRuns / TotalRuns) * 100%',
    description: 'The percentage of workflow executions that reached a verified completion state without unhandled exceptions.',
    interpretation: 'The baseline reliability indicator for customer-facing or mission-critical workflows.',
    idealRange: '>= 98.0% for enterprise production workflows',
    warningSigns: 'Rates below 95% require immediate audit of tool permissions, API rate limits, or context window overflow.',
    operationalImpact: 'Failed runs cause downstream data inconsistency and trigger support escalation.',
  },
  satisfactionscore: {
    key: 'satisfactionscore',
    name: 'Satisfaction Score (CSAT / Quality)',
    category: 'Agent Lab OS & AI',
    formula: 'Mean rating (1.00 – 5.00) from end-users or automated LLM-as-a-judge evaluations',
    description: 'Evaluates the qualitative accuracy, tone, and usefulness of the agent output.',
    interpretation: 'Confirms whether fast, successful agent execution translates into genuinely high quality output for humans.',
    idealRange: '4.50 – 5.00 / 5.00',
    warningSigns: 'Dips below 4.20 suggest output formatting problems, outdated knowledge context, or hallucinated facts.',
    operationalImpact: 'Directly impacts user retention and customer renewal rates.',
  },
  costusd: {
    key: 'costusd',
    name: 'Inference & Cloud Cost (USD)',
    category: 'Agent Lab OS & AI',
    formula: '(Input Tokens * Input Rate) + (Output Tokens * Output Rate) + Compute Cost',
    description: 'Direct financial expenditure accrued per workflow or agent model.',
    interpretation: 'Enables unit-economics calculation (cost per resolution or cost per qualified lead).',
    idealRange: '< $0.05 per standard resolution; < $0.25 for multi-step agent pipelines',
    warningSigns: 'Linear growth without corresponding volume increase signals excessive context stuffing or oversized prompt system instructions.',
    operationalImpact: 'Maintains gross margins and predicts annual AI infrastructure spend.',
  },
  avglatencyms: {
    key: 'avglatencyms',
    name: 'Average Latency (ms)',
    category: 'Operations & Performance',
    formula: 'Total execution duration (ms) / Total runs',
    description: 'End-to-end turnaround time from user prompt or event trigger to final response delivery.',
    interpretation: 'Determines user perceived speed and suitability for synchronous vs. asynchronous processing.',
    idealRange: '< 1,500 ms for interactive UI agents; < 8,000 ms for complex multi-tool pipelines',
    warningSigns: 'Sudden latency bumps point to external API throttling or large token generation delays.',
    operationalImpact: 'Affects conversion rates and user patience during real-time interactions.',
  },
  amount: {
    key: 'amount',
    name: 'HubSpot Deal Amount / Pipeline Value',
    category: 'CRM & Revenue',
    formula: 'Sum of monetary contract values assigned to CRM deals',
    description: 'Financial pipeline generated, progressed, or closed won through automated workflows.',
    interpretation: 'Demonstrates tangible ROI by correlating agent-assisted interactions to revenue outcomes.',
    idealRange: 'High pipeline coverage with balanced distribution across sales owners',
    warningSigns: 'Stagnant deal amounts in pipeline stages point to follow-up friction or lack of sales rep enablement.',
    operationalImpact: 'Validates executive investment into Agent Lab automation.',
  },
  daystoclose: {
    key: 'daystoclose',
    name: 'Sales Cycle Velocity (Days to Close)',
    category: 'CRM & Revenue',
    formula: 'Close Date timestamp - Deal Creation timestamp',
    description: 'The number of days required to move an opportunity from initial creation to Closed Won.',
    interpretation: 'Directly shows whether AI agent research and automated touchpoints compress sales cycles.',
    idealRange: '< 30 – 45 days for mid-market; < 60 days for enterprise tiers',
    warningSigns: 'Deals sitting > 60 days without agent activity need rep re-engagement or stage disqualification.',
    operationalImpact: 'Faster sales cycles accelerate cash flow and improve forecasting predictability.',
  },
  associatedagentruns: {
    key: 'associatedagentruns',
    name: 'Associated Agent Runs per Deal',
    category: 'CRM & Revenue',
    formula: 'Count of background agent research, briefing, or enrichment runs attached to a specific CRM Deal ID',
    description: 'Measures the depth of AI automation assistance invested into winning each customer account.',
    interpretation: 'Highlights the correlation between agent preparation (dossiers, custom demos) and deal win rates.',
    idealRange: '15 – 35 agent runs per enterprise deal',
    warningSigns: 'Deals with 0 agent runs typically suffer longer close times and lower win probability.',
    operationalImpact: 'Identifies which sales reps are effectively leveraging the Agent Lab ecosystem.',
  },
  invocations: {
    key: 'invocations',
    name: 'MCP Server Invocations',
    category: 'MCP Servers',
    formula: 'Count of JSON-RPC tool calls dispatched to a Model Context Protocol endpoint',
    description: 'Measures activity across external integrations (GitHub, PostgreSQL, HubSpot, Slack, Brave Search, etc.).',
    interpretation: 'Shows which external systems are the critical dependencies for agent operations.',
    idealRange: 'Proportional to workflow complexity (1.0 – 3.0 tool calls per workflow run)',
    warningSigns: 'A single tool dominating 80%+ of calls may need local caching or batching.',
    operationalImpact: 'Assists in rate limit management and external third-party API licensing.',
  },
  successrate: {
    key: 'successrate',
    name: 'MCP Tool Reliability / Success Rate (%)',
    category: 'MCP Servers',
    formula: '(Successful Tool Returns / Total Invocations) * 100%',
    description: 'Percentage of MCP tool executions that returned structured data without socket errors or API exceptions.',
    interpretation: 'Health status of connected MCP server microservices and credential validities.',
    idealRange: '>= 98.5%',
    warningSigns: 'A drop under 97% indicates expired OAuth tokens, changed JSON schemas, or network timeouts.',
    operationalImpact: 'Prevents agent hallucinations that happen when tools return cryptic error strings.',
  },
  stepdepth: {
    key: 'stepdepth',
    name: 'MCP Step Depth & Tool Calling Stack',
    category: 'MCP Servers',
    formula: 'Average sequential tool dependencies traversed in a single chain',
    description: 'How deeply the agent nests external MCP calls (e.g. search -> query database -> post to slack).',
    interpretation: 'Measures autonomous orchestration sophistication versus single-shot lookups.',
    idealRange: '2.0 – 5.0 for multi-hop tool routing',
    warningSigns: 'Excessive depth (> 7) without task completion risks context degradation and exponential token cost.',
    operationalImpact: 'Higher depth increases cumulative error probability.',
  },
    totaltokens: {
    key: 'totaltokens',
    name: 'Total Token Footprint',
    category: 'Operations & Performance',
    formula: 'Sum of prompt tokens + completion tokens consumed across runs and tool payloads',
    description: 'Total textual/multimodal context processed through Gemini models.',
    interpretation: 'Primary cost and context consumption driver for the AI architecture.',
    idealRange: 'Optimized via prompt caching and terse tool return payloads',
    warningSigns: 'Massive token spikes with small record outputs signify uncompressed JSON blobs returned to context.',
    operationalImpact: 'Directly impacts monthly billing and determines whether long-context caching is required.',
  },
  bouncerate: {
    key: 'bouncerate',
    name: 'Bounce Rate (%)',
    category: 'Web & Client Portals',
    formula: '(Single-page sessions without interaction / Total sessions) * 100%',
    description: 'Percentage of visitors who land on a website, landing page, or portal entrance and leave immediately without clicking or navigating.',
    interpretation: 'For marketing & landing pages, high bounce rates indicate poor headline messaging or irrelevant ad targeting. For client portals, high bounce rates suggest authentication confusion or broken deep links.',
    idealRange: '< 35% for SaaS landing pages; < 15% for authenticated client portals',
    warningSigns: 'Bounce rates exceeding 65% on paid landing pages mean ad copy does not match landing page promises.',
    operationalImpact: 'Directly wastes ad spend and reduces customer top-of-funnel lead velocity.',
  },
  conversionrate: {
    key: 'conversionrate',
    name: 'Conversion Rate / Task Completion (%)',
    category: 'Web & Client Portals',
    formula: '(Completed Goal Actions / Total Unique Visitors or Sessions) * 100%',
    description: 'Measures how effectively a page or portal converts traffic into desired outcomes (e.g., demo requested, trial started, or portal task resolved).',
    interpretation: 'The ultimate business efficacy barometer for digital assets. For client portals, tracks autonomous self-serve task completion without human support.',
    idealRange: '5% – 15% for enterprise landing pages; > 60% for client portal workflows',
    warningSigns: 'Dips below 3% on high-intent pages point to form friction, lack of social proof, or sluggish page loads.',
    operationalImpact: 'Higher conversion rates lower Customer Acquisition Cost (CAC) and increase customer lifetime value.',
  },
  pageloadms: {
    key: 'pageloadms',
    name: 'Page Load & Time to Interactive (ms)',
    category: 'Web & Client Portals',
    formula: 'Total network latency + DOM parsing + JS bundle execution until page is interactive',
    description: 'How quickly the web page or client portal UI renders and becomes fully responsive to user input.',
    interpretation: 'Every 100ms of latency reduction directly correlates to a 1% lift in landing page conversion and improved portal UX satisfaction.',
    idealRange: '< 800 ms (Fast); < 1,500 ms (Acceptable)',
    warningSigns: 'Exceeding 2,500 ms causes severe mobile visitor abandonment and degrades SEO ranking.',
    operationalImpact: 'Fast portals improve operational efficiency and customer trust in automated SaaS platforms.',
  },
  lcpseconds: {
    key: 'lcpseconds',
    name: 'Largest Contentful Paint - LCP (sec)',
    category: 'Web & Client Portals',
    formula: 'Time elapsed until the main visual block (hero image, heading, or primary portal table) is rendered',
    description: 'Core Web Vitals primary performance metric benchmarked by Google Chrome and search engines.',
    interpretation: 'Measures perceived loading speed by real end-users.',
    idealRange: '< 2.0s (Good); 2.0s – 3.5s (Needs Improvement); > 3.5s (Poor)',
    warningSigns: 'LCP > 3.0s usually caused by unoptimized hero assets, slow backend SSR, or render-blocking third-party scripts.',
    operationalImpact: 'Affects organic search discoverability and ad Quality Scores in Google Ads.',
  },
  portalactiveusers: {
    key: 'portalactiveusers',
    name: 'Client Portal Monthly Active Users (MAU)',
    category: 'Web & Client Portals',
    formula: 'Count of unique client accounts or users logging in and performing actions in the client portal during the billing cycle',
    description: 'Tracks customer engagement, feature adoption, and retention within dedicated client environments.',
    interpretation: 'High portal active user counts correlate with lower churn and higher expansion revenue.',
    idealRange: '>= 75% of onboarded client accounts active monthly',
    warningSigns: 'Client portals with low MAU (< 30%) indicate customers are still defaulting to email chains instead of self-serve automation.',
    operationalImpact: 'Drives account expansion and drastically reduces repetitive support tickets.',
  },
  avgsessiondurationsec: {
    key: 'avgsessiondurationsec',
    name: 'Average Session Duration (seconds)',
    category: 'Web & Client Portals',
    formula: 'Total active time spent on page / Total visitor sessions',
    description: 'Dwell time spent consuming landing page content, reviewing documentation, or managing client portal dashboards.',
    interpretation: 'Context dependent: high duration on landing pages/blogs indicates deep interest. For transactional portals, moderate duration indicates fast, frictionless task completion.',
    idealRange: '90s – 240s for landing pages; 180s – 400s for client portals',
    warningSigns: 'Extremely short sessions (< 20s) indicate immediate bounce; unusually long sessions (> 15m) without conversion indicate navigation confusion.',
    operationalImpact: 'Reflects content relevance and user intent alignment.',
  },
  clientsatisfactionnps: {
    key: 'clientsatisfactionnps',
    name: 'Client Portal NPS / Experience Rating',
    category: 'Web & Client Portals',
    formula: '% Promoters (9-10) - % Detractors (0-6) from in-portal micro-surveys',
    description: 'Net Promoter Score capturing client satisfaction with the self-serve portal and automated reporting features.',
    interpretation: 'Guages customer sentiment towards your operational transparency and platform usability.',
    idealRange: 'NPS > +50 (Excellent); NPS > +70 (World Class)',
    warningSigns: 'Scores below +30 indicate client frustration with portal workflows, permissions, or navigation.',
    operationalImpact: 'Direct predictor of annual renewal rates and willingness to provide case studies.',
  },
};

/**
 * Helper to look up metric definition by column key or fuzzy term
 */
export function getMetricInterpretation(keyOrName: string): MetricInterpretation | null {
  if (!keyOrName) return null;
  const clean = keyOrName.toLowerCase().replace(/[^a-z0-9]/g, '');
  
  if (METRIC_DICTIONARY[clean]) {
    return METRIC_DICTIONARY[clean];
  }

  // Fuzzy match keywords
  for (const [dictKey, def] of Object.entries(METRIC_DICTIONARY)) {
    if (clean.includes(dictKey) || dictKey.includes(clean)) {
      return def;
    }
  }

  if (/hitl|override|human/i.test(keyOrName)) return METRIC_DICTIONARY.hitloverrides;
  if (/step/i.test(keyOrName)) return METRIC_DICTIONARY.avgstepsperrun;
  if (/run|execution/i.test(keyOrName)) return METRIC_DICTIONARY.totalruns;
  if (/success/i.test(keyOrName)) return METRIC_DICTIONARY.successrate;
  if (/satisfaction|csat|score/i.test(keyOrName)) return METRIC_DICTIONARY.satisfactionscore;
  if (/cost|price|usd/i.test(keyOrName)) return METRIC_DICTIONARY.costusd;
  if (/latency|time|ms|duration/i.test(keyOrName)) return METRIC_DICTIONARY.avglatencyms;
  if (/amount|deal|revenue/i.test(keyOrName)) return METRIC_DICTIONARY.amount;
  if (/close|days/i.test(keyOrName)) return METRIC_DICTIONARY.daystoclose;
  if (/invoke|call/i.test(keyOrName)) return METRIC_DICTIONARY.invocations;
  if (/token/i.test(keyOrName)) return METRIC_DICTIONARY.totaltokens;
  if (/bounce/i.test(keyOrName)) return METRIC_DICTIONARY.bouncerate;
  if (/convert|conversion/i.test(keyOrName)) return METRIC_DICTIONARY.conversionrate;
  if (/load|speed|ttfb/i.test(keyOrName)) return METRIC_DICTIONARY.pageloadms;
  if (/lcp/i.test(keyOrName)) return METRIC_DICTIONARY.lcpseconds;
  if (/portal.*user|active.*user|client.*user/i.test(keyOrName)) return METRIC_DICTIONARY.portalactiveusers;
  if (/session.*duration|dwell/i.test(keyOrName)) return METRIC_DICTIONARY.avgsessiondurationsec;
  if (/nps|promoter/i.test(keyOrName)) return METRIC_DICTIONARY.clientsatisfactionnps;
  if (/monthlycost|techcost|toolcost/i.test(keyOrName)) return METRIC_DICTIONARY.monthlycostusd;
  if (/health|reliability|riskscore/i.test(keyOrName)) return METRIC_DICTIONARY.healthscore;
  if (/lifecycle|stackstatus/i.test(keyOrName)) return METRIC_DICTIONARY.lifecyclestatus;
  if (/inflow|sales.*rev|receipt/i.test(keyOrName)) return METRIC_DICTIONARY.inflowusd;
  if (/outflow|expense|costoutflow/i.test(keyOrName)) return METRIC_DICTIONARY.costoutflowusd;
  if (/netcash|burn/i.test(keyOrName)) return METRIC_DICTIONARY.netcashimpact;
  if (/due|daysuntildue/i.test(keyOrName)) return METRIC_DICTIONARY.daysuntildue;
  if (/trial.*day|trialdaysleft/i.test(keyOrName)) return METRIC_DICTIONARY.trialdaysleft;
  if (/trial.*prob|trialconversionprob/i.test(keyOrName)) return METRIC_DICTIONARY.trialconversionprob;
  if (/arr/i.test(keyOrName)) return METRIC_DICTIONARY.arrimpact;

  return null;
}
