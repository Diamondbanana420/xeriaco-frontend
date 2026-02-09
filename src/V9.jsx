import { useState, useEffect, useCallback, useRef, Component } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar, Cell, PieChart, Pie, Legend } from "recharts";
import { Search, Sparkles, LayoutDashboard, Activity, Box, Globe, Settings, Menu, X, RefreshCw, TrendingUp, Target, DollarSign, ChevronDown, ChevronUp, Brain, FileText, Zap, Copy, Check, AlertCircle, Package, Star, StickyNote, Filter, Download, Play, Pause, Send, Bell, Link, ExternalLink, Timer, Rocket, ArrowUpDown, Hash, Grid, Image, Edit, AlertTriangle, Shield, Skull, Repeat, Power, Wifi, WifiOff, ShoppingCart, ArrowRight, Users, Eye, Truck, Clock, Store, Database, Server, Layers, Award, Percent, RotateCcw, Trash2, CheckCircle, XCircle, Radio, Tag } from "lucide-react";

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
//  XERIACO V9 â€” COMBINED OPTIMIZED DROPSHIPPING COMMAND CENTER
//  Merges V8 AI Automation Suite + Railway Production Backend
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

// â”€â”€ Config â”€â”€
const STORAGE_KEY = "xeriaco_state_v9";
const ORDERS_KEY = "xeriaco_orders_v1";
const ANALYTICS_KEY = "xeriaco_analytics_v1";
const STORE_KEY = "xeriaco_store_v2";
const RAILWAY = "https://xeriaco-backend-production.up.railway.app";
const ADMIN_PW = "xeriaco2026";
const DISCORD_WH = "https://discord.com/api/webhooks/1469565950410883195/kjH0T7HosN5G81TASYOifybT2PxhUNmHfonYmZCzKQ3hyIa-kZGozCdmLANEd8nx85FI";
const CLAWDBOT_WH = "https://distracted-borg.preview.emergentagent.com/api/webhook";
const CLAWDBOT_HP = "https://distracted-borg.preview.emergentagent.com/api/webhook/health";
const ORDER_STATUSES = ["pending","processing","supplier_ordered","shipped","in_transit","delivered"];
const STATUS_LABELS = {pending:"Order Placed",processing:"Processing",supplier_ordered:"Ordered from Supplier",shipped:"Shipped",in_transit:"In Transit",delivered:"Delivered"};
const STATUS_ICONS = {pending:"ðŸ“‹",processing:"âš™ï¸",supplier_ordered:"ðŸ“¦",shipped:"ðŸšš",in_transit:"âœˆï¸",delivered:"âœ…"};
const CHANNELS = [{id:"shopify",name:"Shopify",icon:"ðŸŸ¢",c:"#96bf48"},{id:"woocommerce",name:"WooCommerce",icon:"ðŸŸ£",c:"#7f54b3"},{id:"amazon",name:"Amazon AU",icon:"ðŸŸ ",c:"#ff9900"},{id:"ebay",name:"eBay AU",icon:"ðŸ”µ",c:"#0064d2"},{id:"facebook",name:"Facebook",icon:"ðŸ”·",c:"#1877f2"},{id:"temu",name:"Temu",icon:"ðŸŸ¤",c:"#fb7701"}];

const DISC_SYS = `You are an elite dropshipping product research AI. Find 3 products that are: 1. TRENDING RIGHT NOW on TikTok Shop, Instagram, Amazon Movers & Shakers 2. FINANCIALLY PROFITABLE â€” supplier cost low enough for 3x-5x markup, margins 60-80%+ 3. HIGH DEMAND, LOW SATURATION. REJECT below 60% margin. Return ONLY JSON array of 3 objects: title, sourcePlatform ("AliExpress"|"CJ Dropship"), supplierPrice (USD), sellingPrice (USD), profitMargin (%), category, estimatedMonthlySales, rating (1-5), trendReason, competitionLevel ("Low"|"Medium"|"High"). No markdown.`;
const DISC_USR = "Search for the top trending profitable dropshipping products right now. Find what's viral on TikTok Shop, selling fast on Amazon, trending on social media. Pick 3 diverse winning products with high margins.";
const ANAL_SYS = `You are a senior e-commerce analyst. Analyze for REAL dropshipping viability. Be brutally honest. Return ONLY JSON: trendScore (0-100), demandScore (0-100), competitionScore (0-100, 100=low is GOOD), overallScore (0-100), recommendedSellingPrice (USD), targetAudience, marketingAngle, risks (array), reasoning (2-3 sentences). No markdown.`;

// â”€â”€ Default State â”€â”€
const defState = () => ({
  products:[], aiCalls:0, aiCostUsd:0, discoveryLog:[], activityLog:[],
  discordWebhook:DISCORD_WH, autoDiscoveryMin:0,
  customDiscoveryPrompt:"", customAnalysisPrompt:"", customDiscoveryUser:"",
  storeManager:{
    enabled:false, autoKillDays:7, autoKillMinScore:50,
    autoRepriceEnabled:false, autoRepriceMarginFloor:40,
    autoScaleEnabled:false, autoScaleMinScore:80,
    cycleIntervalMin:0, lastCycleTime:null,
    actionLog:[], totalKills:0, totalReprices:0, totalScales:0,
    autoFulfillEnabled:false,
  },
});

// â”€â”€ Storage â”€â”€
const sto = {
  get: async (k) => { try { const r = await window.storage.get(k); return r ? JSON.parse(r.value) : null; } catch { return null; } },
  set: async (k, v) => { try { await window.storage.set(k, JSON.stringify(v)); } catch {} },
};

// â”€â”€ Railway API Client â”€â”€
const api = {
  _f: async (ep, opts={}) => {
    try {
      const r = await fetch(`${RAILWAY}${ep}`, {...opts, headers:{"Content-Type":"application/json","X-Admin-Password":ADMIN_PW,...opts.headers}});
      if (!r.ok) return null;
      return await r.json();
    } catch { return null; }
  },
  health: () => api._f("/api/health"),
  dashboard: () => api._f("/api/admin/dashboard"),
  products: (n=100) => api._f(`/api/admin/products?limit=${n}`),
  orders: (s) => api._f(`/api/admin/orders${s?`?status=${s}`:""}`),
  orderStats: () => api._f("/api/admin/orders/stats"),
  approve: (id) => api._f(`/api/admin/products/${id}/approve`,{method:"POST"}),
  reject: (id,r) => api._f(`/api/admin/products/${id}/reject`,{method:"POST",body:JSON.stringify({reason:r})}),
  reprice: (id,d) => api._f(`/api/admin/products/${id}/reprice`,{method:"POST",body:JSON.stringify(d)}),
  syncShopify: (id) => api._f(`/api/admin/products/${id}/sync-to-shopify`,{method:"POST"}),
  bulkApprove: (d) => api._f("/api/admin/products/bulk-approve",{method:"POST",body:JSON.stringify(d)}),
  bulkSync: (n=50) => api._f("/api/admin/bulk/sync-all-to-shopify",{method:"POST",body:JSON.stringify({limit:n})}),
  fulfill: (id,t) => api._f(`/api/admin/orders/${id}/fulfill`,{method:"POST",body:JSON.stringify(t)}),
  reviewFraud: (id,a,n) => api._f(`/api/admin/orders/${id}/review-fraud`,{method:"POST",body:JSON.stringify({action:a,note:n})}),
  updateStatus: (id,s,n) => api._f(`/api/admin/orders/${id}/status`,{method:"PUT",body:JSON.stringify({status:s,note:n})}),
  fraudQ: () => api._f("/api/admin/orders/fraud-queue"),
  pipeStatus: () => api._f("/api/admin/pipeline/status"),
  runPipe: (t="full") => api._f("/api/admin/pipeline/run",{method:"POST",body:JSON.stringify({type:t})}),
  runTrend: () => api._f("/api/admin/pipeline/trend-scout",{method:"POST"}),
  runSupplier: (n=20) => api._f("/api/admin/pipeline/supplier-source",{method:"POST",body:JSON.stringify({limit:n})}),
  runEnrich: (n=10) => api._f("/api/admin/pipeline/ai-enrich",{method:"POST",body:JSON.stringify({limit:n})}),
  runCompetitor: (n=20) => api._f("/api/admin/pipeline/competitor-scan",{method:"POST",body:JSON.stringify({limit:n})}),
  runAirtable: () => api._f("/api/admin/pipeline/airtable-sync",{method:"POST"}),
  analytics: (d=30) => api._f(`/api/admin/analytics/history?days=${d}`),
  system: () => api._f("/api/admin/system"),
  updatePricing: (d) => api._f("/api/admin/config/pricing",{method:"POST",body:JSON.stringify(d)}),
  marketplace: (id,ch) => api._f(`/api/marketplace/push/${id}`,{method:"POST",body:JSON.stringify({channel:ch})}),
  cancelPipe: () => api._f("/api/admin/pipeline/cancel",{method:"POST"}),
  fixDrafts: () => api._f("/api/admin/bulk/fix-drafts",{method:"POST"}),
  bulkReprice: () => api._f("/api/admin/bulk/reprice-all",{method:"POST"}),
};

// â”€â”€ AI Functions (in-artifact Anthropic API) â”€â”€
const aiCall = async (sys, usr, search=false, retries=2) => {
  const body = {model:"claude-sonnet-4-5-20250929",max_tokens:2048,system:sys,messages:[{role:"user",content:usr}]};
  if (search) body.tools = [{type:"web_search_20250305",name:"web_search"}];
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const r = await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
      const d = await r.json();
      if (d.error) {
        const msg = d.error?.message || d.error?.type || JSON.stringify(d.error);
        if (attempt < retries && (r.status === 429 || r.status >= 500)) {
          await new Promise(ok => setTimeout(ok, (attempt+1)*2000));
          continue;
        }
        throw new Error(`AI API error: ${msg}`);
      }
      const text = d.content?.filter(c=>c.type==="text").map(c=>c.text).join("") || "";
      if (!text) throw new Error("AI returned empty response");
      return text;
    } catch(e) {
      if (attempt < retries && !e.message?.includes("AI API error")) {
        await new Promise(ok => setTimeout(ok, (attempt+1)*2000));
        continue;
      }
      throw e;
    }
  }
  throw new Error("AI call failed after retries");
};
const aiDiscover = (cs,cu) => aiCall(cs||DISC_SYS, cu||DISC_USR, true);
const aiAnalyze = (p,cs) => aiCall(cs||ANAL_SYS, `Analyze: "${p.title}" â€” Cat: ${p.category}, Supplier: $${p.supplierPrice}, Sell: $${p.sellingPrice}, Margin: ${p.profitMargin}%, Competition: ${p.competitionLevel}, Trend: ${p.trendReason}`);
const aiListing = (p,a) => aiCall(`Generate a complete product listing. Return ONLY JSON: shopifyTitle, shopifyDescription (rich HTML 200-400 words), tags (8-12 array), seoTitle (max 60), seoDescription (max 155), bulletPoints (5 array), targetKeywords (5 array), suggestedCollections (array). No markdown.`, `Product: "${p.title}" | Cat: ${p.category} | Price: $${p.sellingPrice} | Analysis: ${JSON.stringify(a)}`);
const aiCompetitor = (p) => aiCall(`Research competitive landscape. Return ONLY JSON: competitors (array {name,price,rating,url}), avgMarketPrice, pricePosition, saturationLevel (0-100), opportunity, threats (array). No markdown.`, `Competitors for: "${p.title}" in ${p.category}`, true);
const aiSupplier = (p) => aiCall(`Find best suppliers. Return ONLY JSON: suppliers (array {name,platform,url,price,moq,shippingDays,rating}), bestOption {name,reason}, alternativeStrategy. No markdown.`, `Suppliers for: "${p.title}" | Cat: ${p.category} | Budget: $${(p.supplierPrice*1.2).toFixed(2)}`, true);
const aiImage = (p) => aiCall(`Find best product image URL. Return ONLY JSON: imageUrl (direct URL), source, altText. No markdown.`, `Product image for: "${p.title}" category "${p.category}"`, true);
const aiInventory = (p) => aiCall(`Check stock/availability. Return ONLY JSON: inStock (bool), stockLevel ("high"|"medium"|"low"|"out"), estimatedShipDays, priceChanged (bool), newPrice (number|null), supplierNotes. No markdown.`, `Check: "${p.title}" on ${p.sourcePlatform||"AliExpress"} ~$${p.supplierPrice}`, true);
const aiReview = (p) => aiCall(`Review product performance. Return ONLY JSON: verdict ("keep"|"reprice"|"kill"|"scale"), confidence (0-100), reasoning, suggestedAction, estimatedImpact. No markdown.`, `"${p.title}" | Days: ${Math.floor((Date.now()-new Date(p.discoveredAt||Date.now()).getTime())/864e5)} | Score: ${p.analysis?.overallScore||"?"} | Margin: ${p.profitMargin}% | Competition: ${p.competitionLevel}`);
const aiReprice = (p) => aiCall(`Suggest optimal price. Return ONLY JSON: currentPrice, suggestedPrice, reasoning, competitorAvg, expectedMarginChange, confidence (0-100). No markdown.`, `"${p.title}" | Current: $${p.sellingPrice} | Cost: $${p.supplierPrice} | Cat: ${p.category}`, true);
const aiScale = (p) => aiCall(`Analyze scaling potential. Return ONLY JSON: scaleScore (0-100), potentialRevenueMultiplier, suggestedChannels (array), bundleIdeas (array), variants (array), reasoning. No markdown.`, `"${p.title}" | Score: ${p.analysis?.overallScore||"?"} | Margin: ${p.profitMargin}% | Est Sales: ${p.estimatedMonthlySales}`);
const aiForecast = (p) => aiCall(`Forecast seasonal trends. Return ONLY JSON: peakMonths (array), lowMonths (array), currentDemand ("rising"|"stable"|"falling"), forecast30d, forecast90d, holidayOpportunities (array), actionNow. No markdown.`, `"${p.title}" | Cat: ${p.category} | Month: ${new Date().toLocaleString("default",{month:"long"})}`, true);
const aiGenOrder = (o) => aiCall(`Generate supplier order. Return ONLY JSON: supplierName, orderItems (array {title,qty,unitPrice,totalPrice}), shippingMethod, estimatedDelivery, totalCost, orderNotes. No markdown.`, `Order for: ${JSON.stringify(o.items)} shipping to ${o.customer?.country||"AU"}`);

// â”€â”€ Webhooks â”€â”€
const webhook = async (url,p) => { if(!url) return; try { await fetch(url,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(p)}); } catch {} };
const clawdbot = async (cmd) => { try { await fetch(CLAWDBOT_WH,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({source:"xeriaco-v9",command:cmd,timestamp:new Date().toISOString()})}); } catch {} };
const clawdbotHealth = async () => { try { const r = await fetch(CLAWDBOT_HP,{signal:AbortSignal.timeout(5000)}); return r.ok; } catch { return false; } };

// â”€â”€ Error Boundary â”€â”€
class EB extends Component {
  state={e:null};
  static getDerivedStateFromError(e){return{e};}
  render(){return this.state.e?<div style={{padding:40,color:"#ef4444",background:"#0a0a1a",minHeight:"100vh",fontFamily:"monospace"}}><h2>âš ï¸ V9 Error</h2><pre style={{whiteSpace:"pre-wrap"}}>{this.state.e.message}</pre><button onClick={()=>this.setState({e:null})} style={{marginTop:16,padding:"8px 16px",background:"#ef4444",color:"#fff",border:"none",borderRadius:8,cursor:"pointer"}}>Retry</button></div>:this.props.children;}
}

// â”€â”€ UI Components â”€â”€
const Pill = ({children,active,onClick,count}) => <button onClick={onClick} style={{padding:"5px 13px",borderRadius:20,border:active?"none":"1px solid rgba(255,255,255,0.08)",background:active?"linear-gradient(135deg,#6366f1,#8b5cf6)":"rgba(255,255,255,0.03)",color:active?"#fff":"#94a3b8",fontSize:12,fontWeight:active?600:400,cursor:"pointer",display:"inline-flex",alignItems:"center",gap:5,whiteSpace:"nowrap",transition:"all .2s"}}>{children}{count!=null&&<span style={{background:active?"rgba(255,255,255,.2)":"rgba(255,255,255,.06)",padding:"1px 6px",borderRadius:10,fontSize:10}}>{count}</span>}</button>;

const Metric = ({icon,label,value,sub,color,trend}) => <div style={{background:"rgba(255,255,255,.03)",border:"1px solid rgba(255,255,255,.06)",borderRadius:14,padding:"14px 16px"}}><div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}><span style={{fontSize:11,color:"#64748b",fontWeight:500}}>{label}</span>{icon&&<span style={{color:color||"#6366f1",opacity:.7}}>{icon}</span>}</div><div style={{fontSize:20,fontWeight:700,color:"#e2e8f0",marginTop:2}}>{value}</div>{sub&&<div style={{fontSize:10,color:trend==="up"?"#34d399":trend==="down"?"#f87171":"#64748b",marginTop:2}}>{sub}</div>}</div>;

const Badge = ({status,size}) => {
  const C = {pending:"#f59e0b",processing:"#3b82f6",supplier_ordered:"#8b5cf6",shipped:"#06b6d4",in_transit:"#6366f1",delivered:"#22c55e",cancelled:"#ef4444",new:"#3b82f6",draft:"#64748b",active:"#22c55e",approved:"#22c55e",rejected:"#ef4444",discovered:"#f59e0b",analyzed:"#3b82f6",listed:"#22c55e",killed:"#ef4444"};
  const c = C[status]||"#64748b";
  return <span style={{display:"inline-flex",alignItems:"center",gap:3,padding:`2px ${size==="lg"?10:7}px`,borderRadius:10,background:`${c}15`,color:c,fontSize:size==="lg"?12:10,fontWeight:600,border:`1px solid ${c}25`}}><span style={{width:5,height:5,borderRadius:"50%",background:c}}/>{(STATUS_LABELS[status]||status||"?").replace(/_/g," ")}</span>;
};

const Hdr = ({icon,title,action,actionLabel,loading}) => <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}><div style={{display:"flex",alignItems:"center",gap:8}}>{icon&&<span style={{color:"#6366f1"}}>{icon}</span>}<h3 style={{fontSize:15,fontWeight:700,color:"#e2e8f0",margin:0}}>{title}</h3></div>{action&&<button onClick={action} disabled={loading} style={{padding:"5px 12px",borderRadius:8,background:"rgba(99,102,241,.12)",color:"#818cf8",border:"1px solid #6366f130",fontSize:11,fontWeight:600,cursor:loading?"wait":"pointer",opacity:loading?.5:1,display:"flex",alignItems:"center",gap:4}}>{loading&&<RefreshCw size={11} style={{animation:"spin 1s linear infinite"}}/>}{actionLabel}</button>}</div>;

const Panel = ({children,style}) => <div style={{background:"rgba(255,255,255,.025)",border:"1px solid rgba(255,255,255,.06)",borderRadius:14,padding:16,...style}}>{children}</div>;

const FraudBadge = ({score}) => {const c=score>=60?"#ef4444":score>=30?"#f59e0b":"#22c55e";return <span style={{display:"inline-flex",alignItems:"center",gap:3,padding:"2px 7px",borderRadius:8,background:`${c}12`,color:c,fontSize:10,fontWeight:700}}><Shield size={9}/>{score>=60?"HIGH":score>=30?"MED":"LOW"} ({score})</span>;};

const Btn = ({children,onClick,disabled,variant,size,loading,...p}) => <button onClick={onClick} disabled={disabled||loading} style={{padding:size==="sm"?"4px 10px":"6px 14px",borderRadius:8,border:variant==="ghost"?"1px solid rgba(255,255,255,.08)":"none",background:variant==="ghost"?"transparent":variant==="danger"?"rgba(239,68,68,.15)":"linear-gradient(135deg,#6366f1,#8b5cf6)",color:variant==="danger"?"#f87171":variant==="ghost"?"#94a3b8":"#fff",fontSize:size==="sm"?11:12,fontWeight:600,cursor:disabled||loading?"not-allowed":"pointer",opacity:disabled||loading?.5:1,display:"inline-flex",alignItems:"center",gap:4,transition:"all .15s",...p.style}} {...p}>{loading&&<RefreshCw size={10} style={{animation:"spin 1s linear infinite"}}/>}{children}</button>;


// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
//  MAIN COMPONENT
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
function V9() {
  const [view, setView] = useState("dashboard");
  const [st, setSt] = useState(null);
  const [loading, setLoading] = useState(true);
  // Discovery
  const [discovering, setDiscovering] = useState(false);
  const [analyzingId, setAnalyzingId] = useState(null);
  const [listingId, setListingId] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [autopilotRunning, setAutopilotRunning] = useState(false);
  const [autopilotStep, setAutopilotStep] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [competitorCheckId, setCompetitorCheckId] = useState(null);
  const [supplierSearchId, setSupplierSearchId] = useState(null);
  const [imageSearchId, setImageSearchId] = useState(null);
  const [copiedField, setCopiedField] = useState(null);
  // Manager
  const [managerRunning, setManagerRunning] = useState(false);
  const [managerStep, setManagerStep] = useState("");
  const [reviewingId, setReviewingId] = useState(null);
  const [repricingId, setRepricingId] = useState(null);
  // Operations
  const [orders, setOrders] = useState([]);
  const [storeAnalytics, setStoreAnalytics] = useState(null);
  const [storeData, setStoreData] = useState(null);
  const [fulfillingId, setFulfillingId] = useState(null);
  const [inventorySyncing, setInventorySyncing] = useState(false);
  const [inventoryResults, setInventoryResults] = useState({});
  const [opsFilter, setOpsFilter] = useState("all");
  // Railway
  const [rwOnline, setRwOnline] = useState(false);
  const [rwDash, setRwDash] = useState(null);
  const [rwProds, setRwProds] = useState([]);
  const [rwOrds, setRwOrds] = useState([]);
  const [rwPipe, setRwPipe] = useState(null);
  const [rwSys, setRwSys] = useState(null);
  const [fraudQ, setFraudQ] = useState([]);
  const [pipeRunning, setPipeRunning] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [cbOnline, setCbOnline] = useState(false);
  const autoRef = useRef(null);
  const mgrRef = useRef(null);

  // â”€â”€ Load â”€â”€
  useEffect(()=>{(async()=>{
    let d = await sto.get(STORAGE_KEY);
    if(!d) d = await sto.get("xeriaco_state_v8");
    if(!d) d = await sto.get("xeriaco_state_v7");
    if(d){const def=defState();Object.keys(def).forEach(k=>{if(d[k]===undefined)d[k]=def[k];});if(!d.storeManager)d.storeManager=def.storeManager;else{const sm=def.storeManager;Object.keys(sm).forEach(k=>{if(d.storeManager[k]===undefined)d.storeManager[k]=sm[k];});}setSt(d);}else setSt(defState());
    const o=await sto.get(ORDERS_KEY);if(o)setOrders(o);
    const a=await sto.get(ANALYTICS_KEY);if(a)setStoreAnalytics(a);
    const s=await sto.get(STORE_KEY);if(s)setStoreData(s);
    setLoading(false);
  })();},[]);

  // â”€â”€ Save â”€â”€
  useEffect(()=>{if(st&&!loading)sto.set(STORAGE_KEY,st);},[st,loading]);

  // â”€â”€ Auto Discovery â”€â”€
  useEffect(()=>{
    if(autoRef.current)clearInterval(autoRef.current);
    if(st?.autoDiscoveryMin>0&&!discovering)autoRef.current=setInterval(()=>handleDiscover(true),st.autoDiscoveryMin*6e4);
    return()=>{if(autoRef.current)clearInterval(autoRef.current);};
  },[st?.autoDiscoveryMin,discovering]);

  // â”€â”€ Manager Timer â”€â”€
  useEffect(()=>{
    if(mgrRef.current)clearInterval(mgrRef.current);
    if(st?.storeManager?.cycleIntervalMin>0&&st?.storeManager?.enabled&&!managerRunning)mgrRef.current=setInterval(()=>handleMgrCycle(),st.storeManager.cycleIntervalMin*6e4);
    return()=>{if(mgrRef.current)clearInterval(mgrRef.current);};
  },[st?.storeManager?.cycleIntervalMin,st?.storeManager?.enabled,managerRunning]);

  // â”€â”€ Health Checks â”€â”€
  useEffect(()=>{
    const ck=async()=>{setCbOnline(await clawdbotHealth());const h=await api.health();setRwOnline(!!h&&h.status==="ok");};
    ck();const iv=setInterval(ck,6e4);return()=>clearInterval(iv);
  },[]);

  // â”€â”€ Shared Data Poll â”€â”€
  useEffect(()=>{
    const poll=async()=>{const o=await sto.get(ORDERS_KEY);if(o)setOrders(o);const a=await sto.get(ANALYTICS_KEY);if(a)setStoreAnalytics(a);const s=await sto.get(STORE_KEY);if(s)setStoreData(s);};
    const iv=setInterval(poll,1e4);return()=>clearInterval(iv);
  },[]);

  // â”€â”€ Auto-fulfill â”€â”€
  useEffect(()=>{
    if(!st?.storeManager?.autoFulfillEnabled||!orders.length)return;
    const pend=orders.filter(o=>o.status==="pending");
    if(!pend.length)return;
    const upd=orders.map(o=>{if(o.status!=="pending")return o;const ni=ORDER_STATUSES.indexOf(o.status)+1;if(ni>=ORDER_STATUSES.length)return o;return{...o,status:ORDER_STATUSES[ni],statusHistory:[...(o.statusHistory||[]),{status:ORDER_STATUSES[ni],time:new Date().toISOString(),auto:true}]};});
    setOrders(upd);sto.set(ORDERS_KEY,upd);
  },[st?.storeManager?.autoFulfillEnabled,orders.length]);

  // â”€â”€ Railway Sync â”€â”€
  const syncRw = useCallback(async()=>{
    setSyncing(true);
    const [d,p,o,pi,f,s] = await Promise.allSettled([api.dashboard(),api.products(100),api.orders(),api.pipeStatus(),api.fraudQ(),api.system()]);
    if(d.value)setRwDash(d.value);if(p.value?.products)setRwProds(p.value.products);if(o.value?.orders)setRwOrds(o.value.orders);if(pi.value)setRwPipe(pi.value);if(f.value?.orders)setFraudQ(f.value.orders);if(s.value)setRwSys(s.value);
    setSyncing(false);
  },[]);

  useEffect(()=>{syncRw();const iv=setInterval(syncRw,3e4);return()=>clearInterval(iv);},[syncRw]);

  // â”€â”€ Helpers â”€â”€
  const log = (msg,type="info") => setSt(p=>({...p,activityLog:[{msg,type,time:new Date().toISOString()},...(p.activityLog||[]).slice(0,99)]}));
  const cpClip = (t,f) => {navigator.clipboard?.writeText(t);setCopiedField(f);setTimeout(()=>setCopiedField(null),2e3);};
  const parseAI = (raw) => {
    if (!raw || typeof raw !== "string") throw new Error("No AI response to parse");
    let cleaned = raw.replace(/```json|```/g,"").trim();
    // Try to extract JSON from mixed text
    const jsonMatch = cleaned.match(/[\[{][\s\S]*[\]}]/);
    if (jsonMatch) cleaned = jsonMatch[0];
    try { return JSON.parse(cleaned); } catch(e) { throw new Error(`Failed to parse AI response: ${e.message}\nRaw: ${raw.slice(0,200)}`); }
  };

  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  //  HANDLERS
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

  const handleDiscover = async (auto=false) => {
    if(discovering)return; setDiscovering(true);
    log(auto?"â° Auto-discovery":"ðŸ” Manual discovery");
    try {
      const raw = await aiDiscover(st?.customDiscoveryPrompt,st?.customDiscoveryUser);
      const prods = parseAI(raw);
      if(!Array.isArray(prods)) throw new Error("Bad format");
      const stamped = prods.map(p=>({...p,id:`p_${Date.now()}_${Math.random().toString(36).slice(2,6)}`,discoveredAt:new Date().toISOString(),status:"discovered",notes:""}));
      setSt(p=>({...p,products:[...stamped,...(p.products||[])],aiCalls:(p.aiCalls||0)+1,aiCostUsd:(p.aiCostUsd||0)+.003,discoveryLog:[{time:new Date().toISOString(),count:stamped.length,auto},...(p.discoveryLog||[]).slice(0,49)]}));
      log(`âœ… Found ${stamped.length} products`,"success");
      if(st?.discordWebhook) webhook(st.discordWebhook,{content:`ðŸ” **XeriaCo V9** found ${stamped.length} products:\n${stamped.map(x=>`â€¢ ${x.title} â€” $${x.sellingPrice} (${x.profitMargin}%)`).join("\n")}`});
    } catch(e){log(`âŒ Discovery failed: ${e.message}`,"error");}
    setDiscovering(false);
  };

  const handleAnalyze = async (p) => {
    setAnalyzingId(p.id);log(`ðŸ”¬ Analyzing "${p.title}"`);
    try{const a=parseAI(await aiAnalyze(p,st?.customAnalysisPrompt));setSt(x=>({...x,products:x.products.map(pr=>pr.id===p.id?{...pr,analysis:a,status:"analyzed"}:pr),aiCalls:(x.aiCalls||0)+1,aiCostUsd:(x.aiCostUsd||0)+.003}));log(`ðŸ“Š Score: ${a.overallScore}/100`,"success");}catch(e){log(`âŒ ${e.message}`,"error");}
    setAnalyzingId(null);
  };

  const handleListing = async (p) => {
    setListingId(p.id);log(`ðŸ“ Listing "${p.title}"`);
    try{const l=parseAI(await aiListing(p,p.analysis));setSt(x=>({...x,products:x.products.map(pr=>pr.id===p.id?{...pr,listing:l,status:"listed"}:pr),aiCalls:(x.aiCalls||0)+1,aiCostUsd:(x.aiCostUsd||0)+.003}));log("âœ… Listing ready","success");}catch(e){log(`âŒ ${e.message}`,"error");}
    setListingId(null);
  };

  const handleAutopilot = async () => {
    if(autopilotRunning)return;setAutopilotRunning(true);log("ðŸš€ Autopilot started");
    setAutopilotStep("Discovering...");await handleDiscover();
    const newP=st?.products?.filter(x=>x.status==="discovered").slice(0,3)||[];
    for(const p of newP){setAutopilotStep(`Analyzing "${p.title}"...`);await handleAnalyze(p);}
    const anlz=st?.products?.filter(x=>x.status==="analyzed"&&!x.listing).slice(0,3)||[];
    for(const p of anlz){setAutopilotStep(`Listing "${p.title}"...`);await handleListing(p);}
    setAutopilotStep("");setAutopilotRunning(false);log("ðŸ Autopilot done","success");
  };

  const handleCompetitor = async(p)=>{setCompetitorCheckId(p.id);try{const d=parseAI(await aiCompetitor(p));setSt(x=>({...x,products:x.products.map(pr=>pr.id===p.id?{...pr,competitors:d}:pr),aiCalls:(x.aiCalls||0)+1,aiCostUsd:(x.aiCostUsd||0)+.003}));}catch(e){log(`❌ Competitor check failed: ${e.message}`,"error");}setCompetitorCheckId(null);};
  const handleSupplier = async(p)=>{setSupplierSearchId(p.id);try{const d=parseAI(await aiSupplier(p));setSt(x=>({...x,products:x.products.map(pr=>pr.id===p.id?{...pr,supplierData:d}:pr),aiCalls:(x.aiCalls||0)+1,aiCostUsd:(x.aiCostUsd||0)+.003}));}catch(e){log(`❌ Supplier search failed: ${e.message}`,"error");}setSupplierSearchId(null);};
  const handleImage = async(p)=>{setImageSearchId(p.id);try{const d=parseAI(await aiImage(p));if(d?.imageUrl)setSt(x=>({...x,products:x.products.map(pr=>pr.id===p.id?{...pr,imageUrl:d.imageUrl}:pr),aiCalls:(x.aiCalls||0)+1,aiCostUsd:(x.aiCostUsd||0)+.003}));}catch(e){log(`❌ Image search failed: ${e.message}`,"error");}setImageSearchId(null);};

  const handleReview = async(p)=>{setReviewingId(p.id);try{const r=parseAI(await aiReview(p));setSt(x=>({...x,products:x.products.map(pr=>pr.id===p.id?{...pr,review:r,lastReview:new Date().toISOString()}:pr),aiCalls:(x.aiCalls||0)+1,aiCostUsd:(x.aiCostUsd||0)+.003}));log(`ðŸ“‹ ${p.title}: ${r.verdict}`,"success");}catch(e){log(`❌ Review failed: ${e.message}`,"error");}setReviewingId(null);};
  const handleReprice = async(p)=>{setRepricingId(p.id);try{const rp=parseAI(await aiReprice(p));if(rp.suggestedPrice&&rp.suggestedPrice!==p.sellingPrice){const nm=p.supplierPrice>0?Math.round(((rp.suggestedPrice-p.supplierPrice)/rp.suggestedPrice)*100):p.profitMargin;if(nm>=(st?.storeManager?.autoRepriceMarginFloor||40)){setSt(x=>({...x,products:x.products.map(pr=>pr.id===p.id?{...pr,sellingPrice:rp.suggestedPrice,profitMargin:nm,repriceHistory:[...(pr.repriceHistory||[]),{from:pr.sellingPrice,to:rp.suggestedPrice,time:new Date().toISOString()}]}:pr),storeManager:{...x.storeManager,totalReprices:(x.storeManager.totalReprices||0)+1},aiCalls:(x.aiCalls||0)+1,aiCostUsd:(x.aiCostUsd||0)+.003}));log(`ðŸ’° ${p.title}: $${p.sellingPrice}â†’$${rp.suggestedPrice}`,"success");}}}catch(e){log(`❌ Reprice failed: ${e.message}`,"error");}setRepricingId(null);};
  const handleKill = (p)=>{setSt(x=>({...x,products:x.products.map(pr=>pr.id===p.id?{...pr,status:"killed"}:pr),storeManager:{...x.storeManager,totalKills:(x.storeManager.totalKills||0)+1}}));log(`ðŸ’€ Killed "${p.title}"`,"error");};

  const handleMgrCycle = async()=>{
    if(managerRunning||!st?.storeManager?.enabled)return;setManagerRunning(true);log("ðŸ¤– Manager cycle");
    for(const p of (st?.products||[]).filter(x=>x.status==="listed"||x.status==="analyzed")){setManagerStep(`Reviewing "${p.title}"...`);await handleReview(p);}
    if(st?.storeManager?.autoRepriceEnabled)for(const p of (st?.products||[]).filter(x=>x.review?.verdict==="reprice")){setManagerStep(`Repricing "${p.title}"...`);await handleReprice(p);}
    setManagerStep("");setManagerRunning(false);setSt(p=>({...p,storeManager:{...p.storeManager,lastCycleTime:new Date().toISOString()}}));log("âœ… Cycle done","success");
  };

  // Railway handlers
  const rwRunPipe = async(t="full")=>{setPipeRunning(true);log(`ðŸš‚ Railway ${t} pipeline`);const r=await api.runPipe(t);if(r?.runId)log(`âœ… Started: ${r.runId}`,"success");else log("âŒ Failed","error");setTimeout(()=>{syncRw();setPipeRunning(false);},3e3);};
  const rwTrend = async()=>{log("ðŸ”Ž TrendScout...");await api.runTrend();syncRw();};
  const rwSupplier = async()=>{log("ðŸ“¦ SupplierSource...");await api.runSupplier(20);syncRw();};
  const rwEnrich = async()=>{log("ðŸ§  AI Enrich...");await api.runEnrich(10);syncRw();};
  const rwApprove = async(id)=>{const r=await api.approve(id);if(r?.approved)log(`âœ… Approved: ${r.title}`,"success");syncRw();};
  const rwReject = async(id)=>{const r=await api.reject(id,"V9 Dashboard");if(r?.rejected)log(`âŒ Rejected: ${r.title}`);syncRw();};
  const rwFraud = async(id,action)=>{const r=await api.reviewFraud(id,action);if(r?.reviewed)log(`ðŸ›¡ï¸ ${action}: ${r.orderId}`,"success");syncRw();};
  const rwMarketplace = async(id,ch)=>{log(`ðŸ“¤ Push to ${ch}...`);await api.marketplace(id,ch);syncRw();};

  const handleFulfill = async(id)=>{
    setFulfillingId(id);
    const lo=orders.find(o=>o.id===id);
    if(lo){const ni=ORDER_STATUSES.indexOf(lo.status)+1;if(ni<ORDER_STATUSES.length){const upd=orders.map(o=>o.id===id?{...o,status:ORDER_STATUSES[ni],statusHistory:[...(o.statusHistory||[]),{status:ORDER_STATUSES[ni],time:new Date().toISOString()}]}:o);setOrders(upd);sto.set(ORDERS_KEY,upd);log(`ðŸ“¦ ${STATUS_LABELS[ORDER_STATUSES[ni]]}`,"success");}}
    setFulfillingId(null);
  };

  const handleInvSync = async()=>{
    setInventorySyncing(true);log("ðŸ“Š Inventory sync...");
    for(const p of (st?.products||[]).filter(x=>x.status==="listed").slice(0,5)){try{const d=parseAI(await aiInventory(p));setInventoryResults(prev=>({...prev,[p.id]:d}));}catch(e){log(`❌ Inv check failed: ${e.message}`,"error");}}
    setInventorySyncing(false);log("âœ… Sync done","success");
  };

  // Computed
  const prods = st?.products||[];
  const byS = s => prods.filter(p=>p.status===s).length;
  const analyzed = prods.filter(p=>p.analysis);
  const avgScore = analyzed.length ? Math.round(analyzed.reduce((s,p)=>s+(p.analysis.overallScore||0),0)/analyzed.length) : 0;
  const totalRev = (storeData?.totalRevenue||0) + (rwDash?.orders?.todaysRevenue ? parseFloat(rwDash.orders.todaysRevenue.replace("$","")) : 0);
  const totalOrds = orders.length + rwOrds.length;

  // â”€â”€ Additional UI State â”€â”€
  const [showSettings, setShowSettings] = useState(false);
  const [showPromptEditor, setShowPromptEditor] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [settingsDraft, setSettingsDraft] = useState({});
  const [promptsDraft, setPromptsDraft] = useState({});
  const [rwAnalytics, setRwAnalytics] = useState(null);
  const [analyticsDays, setAnalyticsDays] = useState(30);
  const [showExport, setShowExport] = useState(false);
  const pendingOrders = orders.filter(o=>o.status==="pending"||o.status==="processing").length;
  const listedProds = prods.filter(p=>p.status==="listed");
  const rwFraudCount = fraudQ.length;

  // â”€â”€ Fetch Railway Analytics â”€â”€
  useEffect(()=>{(async()=>{const d=await api.analytics(analyticsDays);if(d)setRwAnalytics(d);})();},[analyticsDays]);

  // â”€â”€ Export â”€â”€
  const exportCSV = () => {
    const rows = [["Title","Status","Supplier$","Sell$","Margin%","Score","Category","Source","Discovered"]];
    prods.forEach(p => rows.push([p.title,p.status,p.supplierPrice,p.sellingPrice,p.profitMargin,p.analysis?.overallScore||"",p.category,p.sourcePlatform,p.discoveredAt]));
    const csv = rows.map(r=>r.map(c=>`"${c}"`).join(",")).join("\n");
    const b = new Blob([csv],{type:"text/csv"});
    const u = URL.createObjectURL(b);
    const a = document.createElement("a");a.href=u;a.download="xeriaco-v9-export.csv";a.click();
  };
  const exportJSON = () => {
    const b = new Blob([JSON.stringify({products:prods,orders,rwProducts:rwProds,rwOrders:rwOrds,analytics:storeAnalytics},null,2)],{type:"application/json"});
    const u = URL.createObjectURL(b);
    const a = document.createElement("a");a.href=u;a.download="xeriaco-v9-data.json";a.click();
  };

  // â”€â”€ NavBtn â”€â”€
  const NavBtn = ({icon:I,label,active,onClick,badge}) => (
    <button onClick={onClick} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 14px",borderRadius:8,border:"none",background:active?"rgba(99,102,241,.12)":"transparent",color:active?"#818cf8":"#71717a",fontSize:13,fontWeight:active?600:400,cursor:"pointer",width:"100%",textAlign:"left",transition:"all .15s"}}>
      <I size={16}/>{label}
      {badge>0&&<span style={{marginLeft:"auto",background:active?"rgba(99,102,241,.25)":"rgba(255,255,255,.06)",color:active?"#a5b4fc":"#94a3b8",padding:"1px 7px",borderRadius:10,fontSize:10,fontWeight:600}}>{badge}</span>}
    </button>
  );

  // â”€â”€ Score Ring â”€â”€
  const ScoreRing = ({score,size=44}) => {
    const r=size/2-3,c=2*Math.PI*r,co=score>=80?"#22c55e":score>=60?"#f59e0b":"#ef4444";
    return <svg width={size} height={size} style={{transform:"rotate(-90deg)"}}><circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,.06)" strokeWidth={3}/><circle cx={size/2} cy={size/2} r={r} fill="none" stroke={co} strokeWidth={3} strokeDasharray={c} strokeDashoffset={c-(score/100)*c} strokeLinecap="round" className="score-ring"/><text x={size/2} y={size/2} textAnchor="middle" dominantBaseline="central" fill="#e2e8f0" fontSize={size/3.5} fontWeight={700} style={{transform:"rotate(90deg)",transformOrigin:"center"}}>{score}</text></svg>;
  };

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "discovery", label: "Discovery", icon: Search },
    { id: "products", label: "Products", icon: Package, badge: prods.length },
    { id: "manager", label: "Store Mgr", icon: Shield, badge: prods.filter(p=>p.review?.verdict==="kill"||p.review?.verdict==="reprice").length || undefined },
    { id: "operations", label: "Operations", icon: ShoppingCart, badge: pendingOrders || undefined },
    { id: "railway", label: "Railway", icon: Server, badge: rwFraudCount || undefined },
    { id: "analytics", label: "Analytics", icon: TrendingUp },
    { id: "activity", label: "Activity", icon: Activity },
  ];
  const nav = (v) => { setView(v); setMobileMenu(false); };

  if(loading || !st) return <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",background:"#000",color:"#6366f1",fontFamily:"'Inter',sans-serif"}}><RefreshCw size={24} style={{animation:"spin 1s linear infinite",marginRight:12}}/>Loading XeriaCo V9...</div>;

  return (
    <div className="min-h-screen bg-black text-white flex" style={{ fontFamily: "'Inter',sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Fira+Code:wght@400;500&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:6px}::-webkit-scrollbar-track{background:#0a0a0a}::-webkit-scrollbar-thumb{background:#333;border-radius:3px}
        .glass{background:rgba(18,18,18,0.7);backdrop-filter:blur(12px);border:1px solid rgba(255,255,255,0.08)}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes slideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        @keyframes slideRight{from{transform:translateX(-100%)}to{transform:translateX(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        .anim-fade{animation:fadeIn .5s ease forwards}
        .anim-slide{animation:slideUp .5s ease forwards}
        input,textarea,select{font-family:'Inter',sans-serif;background:rgba(0,0,0,.5);border:1px solid #27272a;border-radius:6px;padding:6px 10px;color:#fff;font-size:12px;outline:none}
        input:focus,textarea:focus,select:focus{border-color:rgba(255,255,255,.3)}
        textarea{resize:vertical;min-height:60px}
        .range-slider{-webkit-appearance:none;width:100%;height:4px;border-radius:2px;background:#27272a;outline:none}
        .range-slider::-webkit-slider-thumb{-webkit-appearance:none;width:16px;height:16px;border-radius:50%;background:#fff;cursor:pointer}
      `}</style>

      {/* Mobile Menu */}
      {mobileMenu && (
        <div style={{position:"fixed",inset:0,zIndex:50,display:"flex"}}>
          <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,.8)",backdropFilter:"blur(4px)"}} onClick={()=>setMobileMenu(false)}/>
          <aside className="anim-right" style={{width:256,background:"#000",borderRight:"1px solid #1a1a1a",position:"relative",zIndex:10,display:"flex",flexDirection:"column",height:"100%"}}>
            <div style={{padding:24,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div style={{display:"flex",alignItems:"center",gap:8,fontFamily:"'Fira Code',monospace",fontSize:20,fontWeight:700}}><Box size={22} style={{fill:"white",color:"black"}}/> XeriaCo V9</div>
              <button onClick={()=>setMobileMenu(false)} style={{background:"none",border:"none",cursor:"pointer"}}><X size={20} style={{color:"#71717a"}}/></button>
            </div>
            <nav style={{flex:1,padding:"0 16px",display:"flex",flexDirection:"column",gap:4}}>
              {navItems.map(n=><NavBtn key={n.id} icon={n.icon} label={n.label} active={view===n.id} onClick={()=>nav(n.id)} badge={n.badge}/>)}
            </nav>
          </aside>
        </div>
      )}

      {/* Sidebar */}
      <aside style={{width:256,borderRight:"1px solid #1a1a1a",display:"none",flexDirection:"column",position:"fixed",height:"100%",background:"#000",zIndex:10}} className="sidebar-desktop">
        <style>{`@media(min-width:768px){.sidebar-desktop{display:flex!important}.mobile-toggle{display:none!important}}`}</style>
        <div style={{padding:24}}>
          <div style={{display:"flex",alignItems:"center",gap:8,fontFamily:"'Fira Code',monospace",fontSize:20,fontWeight:700,letterSpacing:-1}}>
            <Box size={22} style={{fill:"white",color:"black"}}/> XeriaCo V9
          </div>
          <div style={{fontSize:10,color:"#64748b",marginTop:4}}>Combined Command Center</div>
        </div>
        <nav style={{flex:1,padding:"32px 16px 0",display:"flex",flexDirection:"column",gap:4}}>
          {navItems.map(n=><NavBtn key={n.id} icon={n.icon} label={n.label} active={view===n.id} onClick={()=>setView(n.id)} badge={n.badge}/>)}
        </nav>
        <div style={{padding:16,borderTop:"1px solid #1a1a1a",display:"flex",flexDirection:"column",gap:4}}>
          <NavBtn icon={Settings} label="Settings" onClick={()=>{setShowSettings(true);setSettingsDraft({webhookUrl:st.webhookUrl||"",discordWebhook:st.discordWebhook||"",autoDiscoveryMin:st.autoDiscoveryMin||0});}}/>
          <NavBtn icon={Edit} label="AI Prompts" onClick={()=>{setShowPromptEditor(true);setPromptsDraft({customDiscoveryPrompt:st.customDiscoveryPrompt||"",customAnalysisPrompt:st.customAnalysisPrompt||"",customDiscoveryUser:st.customDiscoveryUser||""});}}/>
          <NavBtn icon={Download} label="Export" onClick={()=>setShowExport(true)}/>
          <div style={{marginTop:8,padding:"10px 16px",background:"rgba(39,39,42,.5)",borderRadius:8}}>
            <div style={{fontSize:11,color:"#71717a",marginBottom:4}}>Status</div>
            <div style={{display:"flex",alignItems:"center",gap:6,fontSize:12,fontWeight:500,color:"#4ade80"}}><span style={{width:7,height:7,background:"#22c55e",borderRadius:"50%",display:"inline-block"}}/> AI Online</div>
            <div style={{display:"flex",alignItems:"center",gap:6,fontSize:11,color:rwOnline?"#4ade80":"#f87171",marginTop:3}}><span style={{width:5,height:5,background:rwOnline?"#22c55e":"#ef4444",borderRadius:"50%",display:"inline-block"}}/>{rwOnline?"Railway":"Railway Offline"}</div>
            <div style={{display:"flex",alignItems:"center",gap:6,fontSize:11,color:cbOnline?"#4ade80":"#f87171",marginTop:3}}><span style={{width:5,height:5,background:cbOnline?"#22c55e":"#ef4444",borderRadius:"50%",display:"inline-block"}}/>{cbOnline?"Clawdbot":"Clawdbot Offline"}</div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{flex:1,marginLeft:0,minHeight:"100vh",background:"#050505"}} className="main-content">
        <style>{`@media(min-width:768px){.main-content{margin-left:256px!important}}`}</style>

        {/* Top Bar */}
        <header style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 20px",borderBottom:"1px solid #1a1a1a",background:"rgba(0,0,0,.5)",backdropFilter:"blur(12px)",position:"sticky",top:0,zIndex:20}}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <button className="mobile-toggle" onClick={()=>setMobileMenu(true)} style={{background:"none",border:"none",cursor:"pointer",padding:4}}><Menu size={20} style={{color:"#71717a"}}/></button>
            <span style={{fontSize:14,fontWeight:600,color:"#e2e8f0"}}>{navItems.find(n=>n.id===view)?.label||"Dashboard"}</span>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            {syncing&&<RefreshCw size={14} style={{color:"#6366f1",animation:"spin 1s linear infinite"}}/>}
            <Btn size="sm" variant="ghost" onClick={syncRw}><RefreshCw size={12}/> Sync</Btn>
            <div style={{fontSize:10,color:"#64748b"}}>AI: {st.aiCalls||0} calls Â· ${(st.aiCostUsd||0).toFixed(3)}</div>
          </div>
        </header>

        <div style={{padding:"20px",maxWidth:1400,margin:"0 auto"}}>
          {/* â•â•â• DASHBOARD â•â•â• */}
          {view === "dashboard" && (
            <div className="anim-fade" style={{display:"flex",flexDirection:"column",gap:16}}>
              {/* Hero Metrics */}
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:12}}>
                <Metric icon={<DollarSign size={16}/>} label="Total Revenue" value={`$${totalRev.toFixed(2)}`} color="#22c55e" sub={`${totalOrds} orders`}/>
                <Metric icon={<Package size={16}/>} label="AI Products" value={prods.length} color="#6366f1" sub={`${byS("listed")} listed Â· ${byS("analyzed")} analyzed`}/>
                <Metric icon={<Database size={16}/>} label="Railway Products" value={rwProds.length} color="#8b5cf6" sub={rwDash?.products?.awaitingApproval?`${rwDash.products.awaitingApproval} pending`:"Synced"}/>
                <Metric icon={<ShoppingCart size={16}/>} label="Total Orders" value={totalOrds} color="#f59e0b" sub={`${pendingOrders} pending`}/>
                <Metric icon={<Target size={16}/>} label="Avg Score" value={avgScore?`${avgScore}/100`:"-"} color={avgScore>=70?"#22c55e":"#f59e0b"} sub={`${analyzed.length} analyzed`}/>
                <Metric icon={<Brain size={16}/>} label="AI Calls" value={st.aiCalls||0} color="#06b6d4" sub={`$${(st.aiCostUsd||0).toFixed(3)} spent`}/>
              </div>

              {/* Quick Actions */}
              <Panel>
                <Hdr icon={<Zap size={16}/>} title="Quick Actions"/>
                <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
                  <Btn onClick={()=>handleDiscover()} loading={discovering}><Search size={13}/> AI Discover</Btn>
                  <Btn onClick={handleAutopilot} loading={autopilotRunning}><Rocket size={13}/> Autopilot</Btn>
                  <Btn onClick={handleMgrCycle} loading={managerRunning}><Shield size={13}/> Run Manager</Btn>
                  <Btn onClick={()=>rwRunPipe("full")} loading={pipeRunning} variant="ghost"><Server size={13}/> Railway Pipeline</Btn>
                  <Btn onClick={handleInvSync} loading={inventorySyncing} variant="ghost"><RefreshCw size={13}/> Inventory Sync</Btn>
                  <Btn onClick={syncRw} loading={syncing} variant="ghost"><Database size={13}/> Sync All</Btn>
                </div>
                {autopilotStep&&<div style={{marginTop:8,fontSize:11,color:"#a5b4fc"}}>{autopilotStep}</div>}
                {managerStep&&<div style={{marginTop:4,fontSize:11,color:"#fbbf24"}}>{managerStep}</div>}
              </Panel>

              {/* Two columns */}
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
                {/* Recent Products */}
                <Panel>
                  <Hdr icon={<Package size={16}/>} title="Recent Products" actionLabel="View All" action={()=>setView("products")}/>
                  {prods.slice(0,5).map(p=>(
                    <div key={p.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 0",borderBottom:"1px solid rgba(255,255,255,.04)"}}>
                      <div>
                        <div style={{fontSize:12,fontWeight:600,color:"#e2e8f0"}}>{p.title?.substring(0,40)}</div>
                        <div style={{fontSize:10,color:"#64748b"}}>${p.sellingPrice} Â· {p.profitMargin}% margin</div>
                      </div>
                      <Badge status={p.status}/>
                    </div>
                  ))}
                  {prods.length===0&&<div style={{fontSize:12,color:"#64748b",textAlign:"center",padding:20}}>No products yet. Run Discovery to start!</div>}
                </Panel>

                {/* System Status */}
                <Panel>
                  <Hdr icon={<Server size={16}/>} title="System Status"/>
                  <div style={{display:"flex",flexDirection:"column",gap:8}}>
                    {[
                      {label:"AI Engine (In-Artifact)",online:true,detail:`${st.aiCalls||0} calls`},
                      {label:"AI Engine (Backend)",online:rwSys?.services?.anthropicAI?.configured||false,detail:"DeepSeek primary"},
                      {label:"Railway Backend",online:rwOnline,detail:rwDash?`${rwDash?.products?.total||0} products`:"Offline"},
                      {label:"Clawdbot",online:cbOnline,detail:cbOnline?"Connected":"Offline"},
                      {label:"Store Manager",online:st.storeManager?.enabled,detail:st.storeManager?.enabled?`${st.storeManager.totalKills||0} kills, ${st.storeManager.totalReprices||0} reprices`:"Disabled"},
                      {label:"Auto-Fulfill",online:st.storeManager?.autoFulfillEnabled,detail:st.storeManager?.autoFulfillEnabled?"Active":"Off"},
                    ].map((s,i)=>(
                      <div key={i} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"6px 0"}}>
                        <div style={{display:"flex",alignItems:"center",gap:8}}>
                          <span style={{width:8,height:8,borderRadius:"50%",background:s.online?"#22c55e":"#ef4444"}}/>
                          <span style={{fontSize:12,color:"#e2e8f0"}}>{s.label}</span>
                        </div>
                        <span style={{fontSize:10,color:"#64748b"}}>{s.detail}</span>
                      </div>
                    ))}
                  </div>
                </Panel>
              </div>

              {/* Recent Activity */}
              <Panel>
                <Hdr icon={<Activity size={16}/>} title="Recent Activity" actionLabel="View All" action={()=>setView("activity")}/>
                <div style={{maxHeight:200,overflowY:"auto"}}>
                  {(st.activityLog||[]).slice(0,8).map((e,i)=>(
                    <div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"5px 0",borderBottom:"1px solid rgba(255,255,255,.03)"}}>
                      <span style={{width:4,height:4,borderRadius:"50%",background:e.type==="success"?"#22c55e":e.type==="error"?"#ef4444":"#6366f1",flexShrink:0}}/>
                      <span style={{fontSize:11,color:"#94a3b8",flex:1}}>{e.msg}</span>
                      <span style={{fontSize:9,color:"#475569",flexShrink:0}}>{new Date(e.time).toLocaleTimeString()}</span>
                    </div>
                  ))}
                </div>
              </Panel>
            </div>
          )}

          {/* â•â•â• DISCOVERY â•â•â• */}
          {view === "discovery" && (
            <div className="anim-fade" style={{display:"flex",flexDirection:"column",gap:16}}>
              <Panel>
                <Hdr icon={<Search size={16}/>} title="AI Product Discovery"/>
                <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:12}}>
                  <Btn onClick={()=>handleDiscover()} loading={discovering}><Sparkles size={13}/> Discover Products</Btn>
                  <Btn onClick={handleAutopilot} loading={autopilotRunning} variant="ghost"><Rocket size={13}/> Full Autopilot</Btn>
                  {rwOnline&&<Btn onClick={()=>rwRunPipe("trendscout")} loading={pipeRunning} variant="ghost"><Globe size={13}/> Railway TrendScout</Btn>}
                </div>
                {autopilotStep&&<div style={{padding:"8px 12px",background:"rgba(99,102,241,.08)",borderRadius:8,fontSize:12,color:"#a5b4fc"}}><Rocket size={12} style={{display:"inline",marginRight:6}}/>{autopilotStep}</div>}
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(120px,1fr))",gap:8,marginTop:8}}>
                  <Metric label="Discovered" value={byS("discovered")} color="#f59e0b"/>
                  <Metric label="Analyzed" value={byS("analyzed")} color="#3b82f6"/>
                  <Metric label="Listed" value={byS("listed")} color="#22c55e"/>
                  <Metric label="Killed" value={byS("killed")} color="#ef4444"/>
                  <Metric label="Avg Score" value={avgScore||"-"} color="#6366f1"/>
                </div>
              </Panel>

              {/* Recently Discovered */}
              <div style={{display:"flex",flexDirection:"column",gap:10}}>
                {prods.filter(p=>p.status==="discovered").slice(0,10).map(p=>(
                  <Panel key={p.id} style={{transition:"all .2s"}}>
                    <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:12}}>
                      <div style={{flex:1}}>
                        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                          <Badge status={p.status}/>
                          <span style={{fontSize:10,color:"#64748b"}}>{p.sourcePlatform}</span>
                        </div>
                        <div style={{fontSize:14,fontWeight:700,color:"#e2e8f0"}}>{p.title}</div>
                        <div style={{display:"flex",gap:12,marginTop:4,fontSize:11,color:"#94a3b8"}}>
                          <span>ðŸ’° ${p.supplierPrice} â†’ ${p.sellingPrice}</span>
                          <span style={{color:p.profitMargin>=60?"#22c55e":"#f59e0b"}}>ðŸ“Š {p.profitMargin}%</span>
                          <span>ðŸ“¦ {p.category}</span>
                          {p.estimatedMonthlySales&&<span>ðŸ“ˆ ~{p.estimatedMonthlySales}/mo</span>}
                        </div>
                        {p.trendReason&&<div style={{fontSize:10,color:"#64748b",marginTop:4}}>ðŸ”¥ {p.trendReason}</div>}
                      </div>
                      <div style={{display:"flex",gap:6,flexShrink:0}}>
                        <Btn size="sm" onClick={()=>handleAnalyze(p)} loading={analyzingId===p.id}><Brain size={11}/> Analyze</Btn>
                        <Btn size="sm" variant="ghost" onClick={()=>handleImage(p)} loading={imageSearchId===p.id}><Image size={11}/></Btn>
                      </div>
                    </div>
                  </Panel>
                ))}
              </div>

              {/* Analyzed products ready for listing */}
              {prods.filter(p=>p.status==="analyzed").length>0&&(
                <Panel>
                  <Hdr icon={<FileText size={16}/>} title="Ready to List"/>
                  {prods.filter(p=>p.status==="analyzed").map(p=>(
                    <div key={p.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 0",borderBottom:"1px solid rgba(255,255,255,.04)"}}>
                      <div style={{display:"flex",alignItems:"center",gap:12}}>
                        <ScoreRing score={p.analysis?.overallScore||0} size={36}/>
                        <div>
                          <div style={{fontSize:13,fontWeight:600,color:"#e2e8f0"}}>{p.title}</div>
                          <div style={{fontSize:10,color:"#64748b"}}>${p.sellingPrice} Â· {p.profitMargin}% Â· {p.analysis?.reasoning?.substring(0,60)}...</div>
                        </div>
                      </div>
                      <div style={{display:"flex",gap:6}}>
                        <Btn size="sm" onClick={()=>handleListing(p)} loading={listingId===p.id}><FileText size={11}/> Generate Listing</Btn>
                        <Btn size="sm" variant="ghost" onClick={()=>handleCompetitor(p)} loading={competitorCheckId===p.id}><Target size={11}/></Btn>
                        <Btn size="sm" variant="ghost" onClick={()=>handleSupplier(p)} loading={supplierSearchId===p.id}><Truck size={11}/></Btn>
                      </div>
                    </div>
                  ))}
                </Panel>
              )}

              {/* Discovery Log */}
              {(st.discoveryLog||[]).length>0&&(
                <Panel>
                  <Hdr icon={<Clock size={16}/>} title="Discovery History"/>
                  {(st.discoveryLog||[]).slice(0,5).map((l,i)=>(
                    <div key={i} style={{fontSize:11,color:"#64748b",padding:"4px 0"}}>{l.auto?"â°":"ðŸ”"} {l.count} products Â· {new Date(l.time).toLocaleString()}</div>
                  ))}
                </Panel>
              )}
            </div>
          )}

          {/* â•â•â• PRODUCTS â•â•â• */}
          {view === "products" && (
            <div className="anim-fade" style={{display:"flex",flexDirection:"column",gap:16}}>
              <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                <Pill active={statusFilter==="all"} onClick={()=>setStatusFilter("all")} count={prods.length}>All</Pill>
                {["discovered","analyzed","listed","killed"].map(s=><Pill key={s} active={statusFilter===s} onClick={()=>setStatusFilter(s)} count={byS(s)}>{s.charAt(0).toUpperCase()+s.slice(1)}</Pill>)}
              </div>

              <div style={{display:"flex",flexDirection:"column",gap:10}}>
                {prods.filter(p=>statusFilter==="all"||p.status===statusFilter).map(p=>(
                  <Panel key={p.id}>
                    <div style={{display:"flex",alignItems:"flex-start",gap:12}}>
                      {/* Image */}
                      {p.imageUrl&&<img src={p.imageUrl} alt="" style={{width:60,height:60,borderRadius:8,objectFit:"cover",background:"#1a1a1a"}} onError={e=>{e.target.style.display="none"}}/>}
                      <div style={{flex:1}}>
                        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                          <Badge status={p.status}/>
                          <span style={{fontSize:10,color:"#64748b"}}>{p.sourcePlatform} Â· {p.category}</span>
                          {p.review?.verdict&&<Badge status={p.review.verdict}/>}
                        </div>
                        <div style={{fontSize:14,fontWeight:700,color:"#e2e8f0",cursor:"pointer"}} onClick={()=>setExpandedId(expandedId===p.id?null:p.id)}>{p.title} <ChevronDown size={12} style={{display:"inline",opacity:.4}}/></div>
                        <div style={{display:"flex",gap:12,marginTop:4,fontSize:11,color:"#94a3b8"}}>
                          <span>ðŸ’° ${p.supplierPrice} â†’ ${p.sellingPrice}</span>
                          <span style={{color:p.profitMargin>=60?"#22c55e":"#f59e0b"}}>{p.profitMargin}%</span>
                          {p.analysis&&<span>Score: {p.analysis.overallScore}/100</span>}
                          {p.competitionLevel&&<span>Competition: {p.competitionLevel}</span>}
                        </div>

                        {/* Expanded Details */}
                        {expandedId===p.id&&(
                          <div className="anim-fade" style={{marginTop:12,padding:12,background:"rgba(0,0,0,.3)",borderRadius:8,border:"1px solid rgba(255,255,255,.04)"}}>
                            {p.analysis&&(
                              <div style={{marginBottom:12}}>
                                <div style={{fontSize:11,fontWeight:600,color:"#a5b4fc",marginBottom:4}}>Analysis</div>
                                <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6}}>
                                  {["trendScore","demandScore","competitionScore","overallScore"].map(k=>
                                    <div key={k} style={{textAlign:"center",padding:"6px",background:"rgba(255,255,255,.03)",borderRadius:6}}>
                                      <div style={{fontSize:9,color:"#64748b"}}>{k.replace("Score","")}</div>
                                      <div style={{fontSize:16,fontWeight:700,color:p.analysis[k]>=70?"#22c55e":p.analysis[k]>=50?"#f59e0b":"#ef4444"}}>{p.analysis[k]}</div>
                                    </div>
                                  )}
                                </div>
                                {p.analysis.reasoning&&<div style={{fontSize:10,color:"#94a3b8",marginTop:6}}>{p.analysis.reasoning}</div>}
                                {p.analysis.marketingAngle&&<div style={{fontSize:10,color:"#a5b4fc",marginTop:2}}>ðŸ’¡ {p.analysis.marketingAngle}</div>}
                              </div>
                            )}
                            {p.listing&&(
                              <div style={{marginBottom:12}}>
                                <div style={{fontSize:11,fontWeight:600,color:"#34d399",marginBottom:4}}>Listing</div>
                                <div style={{fontSize:11,color:"#94a3b8"}}>{p.listing.shopifyTitle}</div>
                                {p.listing.tags&&<div style={{display:"flex",flexWrap:"wrap",gap:4,marginTop:4}}>{p.listing.tags.map((t,i)=><span key={i} style={{fontSize:9,padding:"2px 6px",background:"rgba(99,102,241,.1)",color:"#818cf8",borderRadius:8}}>{t}</span>)}</div>}
                                <div style={{display:"flex",gap:6,marginTop:6}}>
                                  <Btn size="sm" variant="ghost" onClick={()=>cpClip(JSON.stringify(p.listing),"listing-"+p.id)}>{copiedField==="listing-"+p.id?<Check size={10}/>:<Copy size={10}/>} Copy</Btn>
                                </div>
                              </div>
                            )}
                            {p.competitors&&(
                              <div style={{marginBottom:8}}>
                                <div style={{fontSize:11,fontWeight:600,color:"#fbbf24",marginBottom:4}}>Competitors</div>
                                {p.competitors.competitors?.map((c,i)=><div key={i} style={{fontSize:10,color:"#94a3b8"}}>â€¢ {c.name} â€” ${c.price} â­{c.rating}</div>)}
                                <div style={{fontSize:10,color:"#64748b",marginTop:2}}>Saturation: {p.competitors.saturationLevel}/100</div>
                              </div>
                            )}
                            {p.supplierData&&(
                              <div>
                                <div style={{fontSize:11,fontWeight:600,color:"#06b6d4",marginBottom:4}}>Suppliers</div>
                                {p.supplierData.suppliers?.map((s,i)=><div key={i} style={{fontSize:10,color:"#94a3b8"}}>â€¢ {s.name} ({s.platform}) â€” ${s.price} Â· {s.shippingDays}d â­{s.rating}</div>)}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div style={{display:"flex",flexDirection:"column",gap:4,flexShrink:0}}>
                        {p.status==="discovered"&&<Btn size="sm" onClick={()=>handleAnalyze(p)} loading={analyzingId===p.id}><Brain size={11}/></Btn>}
                        {p.status==="analyzed"&&<Btn size="sm" onClick={()=>handleListing(p)} loading={listingId===p.id}><FileText size={11}/></Btn>}
                        <Btn size="sm" variant="ghost" onClick={()=>handleReview(p)} loading={reviewingId===p.id}><Shield size={11}/></Btn>
                        <Btn size="sm" variant="ghost" onClick={()=>handleImage(p)} loading={imageSearchId===p.id}><Image size={11}/></Btn>
                        <Btn size="sm" variant="ghost" onClick={()=>handleCompetitor(p)} loading={competitorCheckId===p.id}><Target size={11}/></Btn>
                        <Btn size="sm" variant="ghost" onClick={()=>handleSupplier(p)} loading={supplierSearchId===p.id}><Truck size={11}/></Btn>
                        {p.status!=="killed"&&<Btn size="sm" variant="danger" onClick={()=>handleKill(p)}><Skull size={11}/></Btn>}
                      </div>
                    </div>

                    {/* Channel Push (for listed products) */}
                    {p.status==="listed"&&p.listing&&(
                      <div style={{display:"flex",gap:6,marginTop:8,paddingTop:8,borderTop:"1px solid rgba(255,255,255,.04)"}}>
                        <span style={{fontSize:10,color:"#64748b",alignSelf:"center"}}>Push to:</span>
                        {CHANNELS.map(ch=><Btn key={ch.id} size="sm" variant="ghost" onClick={()=>cpClip(JSON.stringify({title:p.listing.shopifyTitle,description:p.listing.shopifyDescription,price:p.sellingPrice,tags:p.listing.tags}),"push-"+ch.id+p.id)} style={{borderColor:ch.c+"30",color:ch.c}}>{ch.icon} {ch.name}</Btn>)}
                      </div>
                    )}
                  </Panel>
                ))}
                {prods.filter(p=>statusFilter==="all"||p.status===statusFilter).length===0&&(
                  <Panel style={{textAlign:"center",padding:40}}>
                    <Package size={32} style={{color:"#333",margin:"0 auto 12px"}}/>
                    <div style={{fontSize:14,color:"#64748b"}}>No products found</div>
                    <Btn onClick={()=>{setStatusFilter("all");setView("discovery");}} style={{marginTop:12}}><Search size={13}/> Go to Discovery</Btn>
                  </Panel>
                )}
              </div>
            </div>
          )}

          {/* â•â•â• STORE MANAGER â•â•â• */}
          {view === "manager" && (
            <div className="anim-fade" style={{display:"flex",flexDirection:"column",gap:16}}>
              <Panel>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <Shield size={20} style={{color:"#6366f1"}}/>
                    <div>
                      <h3 style={{fontSize:16,fontWeight:700,color:"#e2e8f0",margin:0}}>AI Store Manager</h3>
                      <div style={{fontSize:11,color:"#64748b"}}>Automated product lifecycle management</div>
                    </div>
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <span style={{fontSize:11,color:st.storeManager?.enabled?"#22c55e":"#64748b"}}>{st.storeManager?.enabled?"Active":"Disabled"}</span>
                    <button onClick={()=>setSt(p=>({...p,storeManager:{...p.storeManager,enabled:!p.storeManager.enabled}}))} style={{width:40,height:22,borderRadius:11,background:st.storeManager?.enabled?"#6366f1":"#27272a",border:"none",cursor:"pointer",position:"relative",transition:"all .2s"}}>
                      <span style={{width:16,height:16,borderRadius:"50%",background:"#fff",position:"absolute",top:3,left:st.storeManager?.enabled?21:3,transition:"all .2s"}}/>
                    </button>
                  </div>
                </div>

                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:10}}>
                  <Metric label="Total Kills" value={st.storeManager?.totalKills||0} color="#ef4444"/>
                  <Metric label="Total Reprices" value={st.storeManager?.totalReprices||0} color="#f59e0b"/>
                  <Metric label="Total Scales" value={st.storeManager?.totalScales||0} color="#22c55e"/>
                  <Metric label="Last Cycle" value={st.storeManager?.lastCycleTime?new Date(st.storeManager.lastCycleTime).toLocaleTimeString():"Never"} color="#6366f1"/>
                </div>

                <div style={{display:"flex",gap:8,marginTop:12}}>
                  <Btn onClick={handleMgrCycle} loading={managerRunning}><Play size={13}/> Run Cycle Now</Btn>
                  <div style={{display:"flex",alignItems:"center",gap:6}}>
                    <span style={{fontSize:11,color:"#64748b"}}>Auto every</span>
                    <input type="number" min={0} max={720} value={st.storeManager?.cycleIntervalMin||0} onChange={e=>setSt(p=>({...p,storeManager:{...p.storeManager,cycleIntervalMin:parseInt(e.target.value)||0}}))} style={{width:60,textAlign:"center"}}/>
                    <span style={{fontSize:11,color:"#64748b"}}>min</span>
                  </div>
                </div>
                {managerStep&&<div style={{marginTop:8,padding:"6px 12px",background:"rgba(99,102,241,.08)",borderRadius:6,fontSize:11,color:"#a5b4fc"}}>{managerStep}</div>}
              </Panel>

              {/* Manager Settings */}
              <Panel>
                <Hdr icon={<Settings size={16}/>} title="Manager Config"/>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                  <label style={{display:"flex",flexDirection:"column",gap:4}}>
                    <span style={{fontSize:11,color:"#64748b"}}>Auto-Reprice</span>
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      <button onClick={()=>setSt(p=>({...p,storeManager:{...p.storeManager,autoRepriceEnabled:!p.storeManager.autoRepriceEnabled}}))} style={{width:36,height:20,borderRadius:10,background:st.storeManager?.autoRepriceEnabled?"#22c55e":"#27272a",border:"none",cursor:"pointer",position:"relative"}}>
                        <span style={{width:14,height:14,borderRadius:"50%",background:"#fff",position:"absolute",top:3,left:st.storeManager?.autoRepriceEnabled?19:3,transition:"all .2s"}}/>
                      </button>
                      <span style={{fontSize:10,color:"#94a3b8"}}>Min margin: {st.storeManager?.autoRepriceMarginFloor||40}%</span>
                    </div>
                  </label>
                  <label style={{display:"flex",flexDirection:"column",gap:4}}>
                    <span style={{fontSize:11,color:"#64748b"}}>Margin Floor</span>
                    <input type="number" min={10} max={90} value={st.storeManager?.autoRepriceMarginFloor||40} onChange={e=>setSt(p=>({...p,storeManager:{...p.storeManager,autoRepriceMarginFloor:parseInt(e.target.value)||40}}))} style={{width:80}}/>
                  </label>
                  <label style={{display:"flex",flexDirection:"column",gap:4}}>
                    <span style={{fontSize:11,color:"#64748b"}}>Auto-Kill Days</span>
                    <input type="number" min={1} max={60} value={st.storeManager?.autoKillDays||7} onChange={e=>setSt(p=>({...p,storeManager:{...p.storeManager,autoKillDays:parseInt(e.target.value)||7}}))} style={{width:80}}/>
                  </label>
                  <label style={{display:"flex",flexDirection:"column",gap:4}}>
                    <span style={{fontSize:11,color:"#64748b"}}>Auto-Fulfill</span>
                    <button onClick={()=>setSt(p=>({...p,storeManager:{...p.storeManager,autoFulfillEnabled:!p.storeManager.autoFulfillEnabled}}))} style={{width:36,height:20,borderRadius:10,background:st.storeManager?.autoFulfillEnabled?"#22c55e":"#27272a",border:"none",cursor:"pointer",position:"relative"}}>
                      <span style={{width:14,height:14,borderRadius:"50%",background:"#fff",position:"absolute",top:3,left:st.storeManager?.autoFulfillEnabled?19:3,transition:"all .2s"}}/>
                    </button>
                  </label>
                </div>
              </Panel>

              {/* Products needing attention */}
              <Panel>
                <Hdr icon={<AlertTriangle size={16}/>} title="Needs Attention"/>
                {prods.filter(p=>p.review?.verdict==="kill"||p.review?.verdict==="reprice"||p.review?.verdict==="scale").map(p=>(
                  <div key={p.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 0",borderBottom:"1px solid rgba(255,255,255,.04)"}}>
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      <span style={{fontSize:16}}>{p.review?.verdict==="kill"?"ðŸ’€":p.review?.verdict==="reprice"?"ðŸ’°":"ðŸš€"}</span>
                      <div>
                        <div style={{fontSize:12,fontWeight:600,color:"#e2e8f0"}}>{p.title}</div>
                        <div style={{fontSize:10,color:"#64748b"}}>{p.review?.reasoning?.substring(0,80)}</div>
                      </div>
                    </div>
                    <div style={{display:"flex",gap:4}}>
                      {p.review?.verdict==="reprice"&&<Btn size="sm" onClick={()=>handleReprice(p)} loading={repricingId===p.id}><DollarSign size={11}/> Reprice</Btn>}
                      {p.review?.verdict==="kill"&&<Btn size="sm" variant="danger" onClick={()=>handleKill(p)}><Skull size={11}/> Kill</Btn>}
                    </div>
                  </div>
                ))}
                {prods.filter(p=>p.review?.verdict==="kill"||p.review?.verdict==="reprice"||p.review?.verdict==="scale").length===0&&(
                  <div style={{fontSize:12,color:"#64748b",textAlign:"center",padding:20}}>No products flagged â€” run a manager cycle to review</div>
                )}
              </Panel>
            </div>
          )}

          {/* â•â•â• OPERATIONS â•â•â• */}
          {view === "operations" && (
            <div className="anim-fade" style={{display:"flex",flexDirection:"column",gap:16}}>
              {/* Order Pipeline Metrics */}
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:10}}>
                {ORDER_STATUSES.map(s=>(
                  <Metric key={s} label={STATUS_LABELS[s]} value={orders.filter(o=>o.status===s).length} color={s==="delivered"?"#22c55e":s==="pending"?"#f59e0b":"#6366f1"} icon={<span>{STATUS_ICONS[s]}</span>}/>
                ))}
              </div>

              {/* Fulfillment Controls */}
              <Panel>
                <Hdr icon={<Truck size={16}/>} title="Fulfillment Pipeline" actionLabel="Inventory Sync" action={handleInvSync} loading={inventorySyncing}/>
                <div style={{display:"flex",gap:8,marginBottom:12}}>
                  <Pill active={opsFilter==="all"} onClick={()=>setOpsFilter("all")} count={orders.length}>All</Pill>
                  {["pending","processing","shipped","delivered"].map(s=><Pill key={s} active={opsFilter===s} onClick={()=>setOpsFilter(s)} count={orders.filter(o=>o.status===s).length}>{STATUS_LABELS[s]||s}</Pill>)}
                </div>

                {orders.filter(o=>opsFilter==="all"||o.status===opsFilter).map(o=>(
                  <div key={o.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 0",borderBottom:"1px solid rgba(255,255,255,.04)"}}>
                    <div>
                      <div style={{display:"flex",alignItems:"center",gap:6}}>
                        <span style={{fontSize:13}}>{STATUS_ICONS[o.status]}</span>
                        <span style={{fontSize:13,fontWeight:600,color:"#e2e8f0"}}>{o.id?.substring(0,12)}</span>
                        <Badge status={o.status} size="lg"/>
                      </div>
                      <div style={{fontSize:10,color:"#64748b",marginTop:2}}>
                        {o.customer?.name||"Customer"} Â· ${o.total?.toFixed(2)||"0.00"} Â· {o.items?.length||0} items
                        {o.statusHistory&&<span> Â· Last: {new Date(o.statusHistory[o.statusHistory.length-1]?.time||o.createdAt).toLocaleString()}</span>}
                      </div>
                      {/* Mini Timeline */}
                      <div style={{display:"flex",gap:2,marginTop:6}}>
                        {ORDER_STATUSES.map((s,i)=>{
                          const active=ORDER_STATUSES.indexOf(o.status)>=i;
                          return <div key={s} style={{height:3,flex:1,borderRadius:2,background:active?"#6366f1":"rgba(255,255,255,.06)",transition:"all .3s"}}/>;
                        })}
                      </div>
                    </div>
                    <Btn size="sm" onClick={()=>handleFulfill(o.id)} loading={fulfillingId===o.id} disabled={o.status==="delivered"}>
                      <ArrowRight size={11}/> {o.status==="delivered"?"Done":"Advance"}
                    </Btn>
                  </div>
                ))}
                {orders.length===0&&<div style={{fontSize:12,color:"#64748b",textAlign:"center",padding:20}}>No local orders yet â€” orders from the storefront will appear here</div>}
              </Panel>

              {/* Railway Orders */}
              {rwOrds.length>0&&(
                <Panel>
                  <Hdr icon={<Server size={16}/>} title={`Railway Orders (${rwOrds.length})`} actionLabel="Sync" action={syncRw} loading={syncing}/>
                  {rwOrds.slice(0,10).map(o=>(
                    <div key={o._id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 0",borderBottom:"1px solid rgba(255,255,255,.04)"}}>
                      <div>
                        <div style={{display:"flex",alignItems:"center",gap:6}}>
                          <span style={{fontSize:12,fontWeight:600,color:"#e2e8f0"}}>{o.shopifyOrderId||o._id?.substring(0,10)}</span>
                          <Badge status={o.status}/>
                          {o.fraud?.score>0&&<FraudBadge score={o.fraud.score}/>}
                        </div>
                        <div style={{fontSize:10,color:"#64748b"}}>{o.customer?.name} Â· ${o.financials?.total?.toFixed(2)||"0"} Â· {o.items?.length||0} items</div>
                      </div>
                      <div style={{display:"flex",gap:4}}>
                        {o.fraud?.score>=30&&!o.fraud?.reviewed&&<>
                          <Btn size="sm" onClick={()=>rwFraud(o._id,"approve")} style={{background:"rgba(34,197,94,.15)",color:"#22c55e"}}><CheckCircle size={11}/></Btn>
                          <Btn size="sm" variant="danger" onClick={()=>rwFraud(o._id,"cancel")}><XCircle size={11}/></Btn>
                        </>}
                      </div>
                    </div>
                  ))}
                </Panel>
              )}

              {/* Inventory Status */}
              {Object.keys(inventoryResults).length>0&&(
                <Panel>
                  <Hdr icon={<Package size={16}/>} title="Inventory Status"/>
                  {Object.entries(inventoryResults).map(([id,inv])=>{
                    const p=prods.find(x=>x.id===id);
                    if(!p)return null;
                    return (
                      <div key={id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"6px 0",borderBottom:"1px solid rgba(255,255,255,.04)"}}>
                        <span style={{fontSize:12,color:"#e2e8f0"}}>{p.title?.substring(0,30)}</span>
                        <div style={{display:"flex",gap:8,alignItems:"center"}}>
                          <span style={{fontSize:10,padding:"2px 8px",borderRadius:8,background:inv.inStock?"rgba(34,197,94,.1)":"rgba(239,68,68,.1)",color:inv.inStock?"#22c55e":"#ef4444"}}>{inv.stockLevel||"?"}</span>
                          <span style={{fontSize:10,color:"#64748b"}}>Ship: {inv.estimatedShipDays}d</span>
                          {inv.priceChanged&&<span style={{fontSize:10,color:"#f59e0b"}}>âš  ${inv.newPrice}</span>}
                        </div>
                      </div>
                    );
                  })}
                </Panel>
              )}
            </div>
          )}

          {/* â•â•â• RAILWAY â•â•â• */}
          {view === "railway" && (
            <div className="anim-fade" style={{display:"flex",flexDirection:"column",gap:16}}>
              {/* Connection Status */}
              <Panel style={{background:rwOnline?"rgba(34,197,94,.05)":"rgba(239,68,68,.05)",borderColor:rwOnline?"rgba(34,197,94,.15)":"rgba(239,68,68,.15)"}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <span style={{width:12,height:12,borderRadius:"50%",background:rwOnline?"#22c55e":"#ef4444",boxShadow:rwOnline?"0 0 12px rgba(34,197,94,.4)":"none"}}/>
                    <div>
                      <h3 style={{fontSize:15,fontWeight:700,color:"#e2e8f0",margin:0}}>Railway Backend</h3>
                      <div style={{fontSize:11,color:"#64748b"}}>{rwOnline?`Connected Â· ${rwSys?.uptime||""}`:RAILWAY}</div>
                    </div>
                  </div>
                  <Btn onClick={syncRw} loading={syncing}><RefreshCw size={12}/> Sync</Btn>
                </div>
              </Panel>

              {!rwOnline&&<Panel style={{textAlign:"center",padding:30}}><WifiOff size={32} style={{color:"#ef4444",margin:"0 auto 8px"}}/><div style={{fontSize:14,color:"#f87171"}}>Railway backend is offline</div><div style={{fontSize:11,color:"#64748b",marginTop:4}}>Check your Railway deployment at railway.app</div></Panel>}

              {rwOnline&&<>
                {/* Dashboard Metrics */}
                {rwDash&&(
                  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:10}}>
                    <Metric icon={<Package size={16}/>} label="Total Products" value={rwDash.products?.total||0} color="#6366f1" sub={`${rwDash.products?.active||0} active Â· ${rwDash.products?.awaitingApproval||0} pending`}/>
                    <Metric icon={<ShoppingCart size={16}/>} label="Orders" value={rwDash.orders?.total||0} color="#f59e0b" sub={`${rwDash.orders?.new||0} new Â· ${rwDash.orders?.fraudAlerts||0} fraud`}/>
                    <Metric icon={<DollarSign size={16}/>} label="Today Revenue" value={rwDash.orders?.todaysRevenue||"$0"} color="#22c55e"/>
                    <Metric icon={<Layers size={16}/>} label="Pipeline" value={rwPipe?.lastCompleted?.type||"Idle"} color="#8b5cf6" sub={rwPipe?.lastCompleted?.completedAt?`Done: ${new Date(rwPipe.lastCompleted.completedAt).toLocaleTimeString()}`:""}/>
                  </div>
                )}

                {/* Pipeline Controls */}
                <Panel>
                  <Hdr icon={<Layers size={16}/>} title="Pipeline Control"/>
                  <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
                    <Btn onClick={()=>rwRunPipe("full")} loading={pipeRunning}><Play size={13}/> Full Pipeline</Btn>
                    <Btn variant="ghost" onClick={rwTrend}><Search size={13}/> TrendScout</Btn>
                    <Btn variant="ghost" onClick={rwSupplier}><Truck size={13}/> SupplierSource</Btn>
                    <Btn variant="ghost" onClick={rwEnrich}><Brain size={13}/> AI Enrich</Btn>
                    <Btn variant="ghost" onClick={async()=>{log("⏹ Cancelling pipeline...");const r=await api.cancelPipe();if(r?.cancelled)log(`✅ Cancelled ${r.cancelled} run(s)`,"success");syncRw();}}><XCircle size={13}/> Cancel Pipeline</Btn>
                    <Btn variant="ghost" onClick={async()=>{log("🔧 Fixing draft products...");const r=await api.fixDrafts();if(r?.fixed)log(`✅ Fixed ${r.fixed} drafts`,"success");syncRw();}}><CheckCircle size={13}/> Fix Drafts</Btn>
                    <Btn variant="ghost" onClick={async()=>{log("💰 Repricing all...");const r=await api.bulkReprice();if(r)log(`✅ Updated ${r.updated}/${r.total}`,"success");syncRw();}}><DollarSign size={13}/> Reprice All</Btn>
                  </div>
                  {rwPipe?.active&&(
                    <div style={{marginTop:10,padding:"8px 12px",background:"rgba(99,102,241,.08)",borderRadius:8}}>
                      <div style={{fontSize:12,color:"#a5b4fc"}}>ðŸ”„ Running: {rwPipe.active.type} â€” {rwPipe.active.status}</div>
                    </div>
                  )}
                  {rwPipe?.history?.slice(0,3).map((h,i)=>(
                    <div key={i} style={{fontSize:10,color:"#64748b",marginTop:4}}>
                      {h.status==="completed"?"âœ…":"âŒ"} {h.type} â€” {h.results?.productsProcessed||0} products Â· {new Date(h.completedAt||h.startedAt).toLocaleString()}
                    </div>
                  ))}
                </Panel>

                {/* Railway Products */}
                <Panel>
                  <Hdr icon={<Database size={16}/>} title={`Products (${rwProds.length})`}/>
                  {rwProds.map(p=>(
                    <div key={p._id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 0",borderBottom:"1px solid rgba(255,255,255,.04)"}}>
                      <div style={{flex:1}}>
                        <div style={{display:"flex",alignItems:"center",gap:6}}>
                          <span style={{fontSize:12,fontWeight:600,color:"#e2e8f0"}}>{p.title?.substring(0,50)}</span>
                          <Badge status={p.pipeline?.status||p.status||"draft"}/>
                        </div>
                        <div style={{fontSize:10,color:"#64748b"}}>
                          Cost: ${p.costUsd?.toFixed(2)} Â· Sell: A${p.sellingPriceAud?.toFixed(2)} Â· Margin: {p.profitMarginPercent?.toFixed(0)}%
                          {p.supplier&&<span> Â· {p.supplier.platform} â­{p.supplier.rating}</span>}
                        </div>
                      </div>
                      <div style={{display:"flex",gap:4}}>
                        <Btn size="sm" onClick={()=>rwApprove(p._id)} style={{background:"rgba(34,197,94,.12)",color:"#22c55e"}}><CheckCircle size={11}/></Btn>
                        <Btn size="sm" variant="danger" onClick={()=>rwReject(p._id)}><XCircle size={11}/></Btn>
                        {CHANNELS.slice(0,2).map(ch=><Btn key={ch.id} size="sm" variant="ghost" onClick={()=>rwMarketplace(p._id,ch.id)} style={{color:ch.c}}>{ch.icon}</Btn>)}
                      </div>
                    </div>
                  ))}
                  {rwProds.length===0&&<div style={{fontSize:12,color:"#64748b",textAlign:"center",padding:16}}>No Railway products â€” run the pipeline to discover products</div>}
                </Panel>

                {/* Fraud Queue */}
                {fraudQ.length>0&&(
                  <Panel style={{borderColor:"rgba(239,68,68,.15)"}}>
                    <Hdr icon={<Shield size={16}/>} title={`Fraud Queue (${fraudQ.length})`}/>
                    {fraudQ.map(o=>(
                      <div key={o._id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 0",borderBottom:"1px solid rgba(255,255,255,.04)"}}>
                        <div>
                          <div style={{display:"flex",alignItems:"center",gap:6}}>
                            <span style={{fontSize:12,fontWeight:600,color:"#e2e8f0"}}>{o.shopifyOrderId||o._id?.substring(0,10)}</span>
                            <FraudBadge score={o.fraud?.score||0}/>
                          </div>
                          <div style={{fontSize:10,color:"#64748b"}}>{o.customer?.name} Â· ${o.financials?.total?.toFixed(2)} Â· Flags: {o.fraud?.flags?.join(", ")||"none"}</div>
                        </div>
                        <div style={{display:"flex",gap:4}}>
                          <Btn size="sm" onClick={()=>rwFraud(o._id,"approve")} style={{background:"rgba(34,197,94,.12)",color:"#22c55e"}}><CheckCircle size={11}/> Approve</Btn>
                          <Btn size="sm" variant="danger" onClick={()=>rwFraud(o._id,"cancel")}><XCircle size={11}/> Cancel</Btn>
                        </div>
                      </div>
                    ))}
                  </Panel>
                )}
              </>}
            </div>
          )}

          {/* â•â•â• ANALYTICS â•â•â• */}
          {view === "analytics" && (
            <div className="anim-fade" style={{display:"flex",flexDirection:"column",gap:16}}>
              {/* Time Range */}
              <div style={{display:"flex",gap:8}}>
                {[7,30,90].map(d=><Pill key={d} active={analyticsDays===d} onClick={()=>setAnalyticsDays(d)}>{d} days</Pill>)}
              </div>

              {/* Revenue Metrics */}
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:10}}>
                <Metric icon={<DollarSign size={16}/>} label="Total Revenue" value={`$${totalRev.toFixed(2)}`} color="#22c55e"/>
                <Metric icon={<ShoppingCart size={16}/>} label="Total Orders" value={totalOrds} color="#f59e0b"/>
                <Metric icon={<Package size={16}/>} label="Products Listed" value={byS("listed")} color="#6366f1"/>
                <Metric icon={<Brain size={16}/>} label="AI Investment" value={`$${(st.aiCostUsd||0).toFixed(3)}`} color="#06b6d4" sub={`${st.aiCalls||0} calls`}/>
                <Metric icon={<Target size={16}/>} label="Avg Product Score" value={avgScore||"-"} color={avgScore>=70?"#22c55e":"#f59e0b"}/>
                <Metric icon={<Percent size={16}/>} label="Avg Margin" value={listedProds.length?`${Math.round(listedProds.reduce((s,p)=>s+p.profitMargin,0)/listedProds.length)}%`:"-"} color="#8b5cf6"/>
              </div>

              {/* Revenue Chart */}
              <Panel>
                <Hdr icon={<TrendingUp size={16}/>} title="Revenue Over Time"/>
                {rwAnalytics?.history?.length>0?(
                  <ResponsiveContainer width="100%" height={250}>
                    <AreaChart data={rwAnalytics.history}>
                      <defs><linearGradient id="gRev" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/><stop offset="95%" stopColor="#6366f1" stopOpacity={0}/></linearGradient></defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.04)"/>
                      <XAxis dataKey="date" tick={{fill:"#64748b",fontSize:10}} tickFormatter={v=>new Date(v).toLocaleDateString("en",{month:"short",day:"numeric"})}/>
                      <YAxis tick={{fill:"#64748b",fontSize:10}} tickFormatter={v=>`$${v}`}/>
                      <Tooltip contentStyle={{background:"#1a1a2e",border:"1px solid #27272a",borderRadius:8,fontSize:11}} labelFormatter={v=>new Date(v).toLocaleDateString()}/>
                      <Area type="monotone" dataKey="revenue" stroke="#6366f1" fill="url(#gRev)" strokeWidth={2}/>
                    </AreaChart>
                  </ResponsiveContainer>
                ):(
                  <div style={{height:200,display:"flex",alignItems:"center",justifyContent:"center"}}>
                    {/* Generate chart from local data */}
                    {(()=>{
                      const days=[];
                      for(let i=analyticsDays-1;i>=0;i--){
                        const d=new Date();d.setDate(d.getDate()-i);
                        const ds=d.toISOString().split("T")[0];
                        const dayOrders=orders.filter(o=>{const od=o.createdAt||o.statusHistory?.[0]?.time;return od&&od.startsWith(ds);});
                        days.push({date:ds,revenue:dayOrders.reduce((s,o)=>s+(o.total||0),0),orders:dayOrders.length});
                      }
                      return days.some(d=>d.revenue>0)?(
                        <ResponsiveContainer width="100%" height={200}>
                          <AreaChart data={days}>
                            <defs><linearGradient id="gRev2" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/><stop offset="95%" stopColor="#6366f1" stopOpacity={0}/></linearGradient></defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.04)"/>
                            <XAxis dataKey="date" tick={{fill:"#64748b",fontSize:10}} tickFormatter={v=>new Date(v).toLocaleDateString("en",{month:"short",day:"numeric"})}/>
                            <YAxis tick={{fill:"#64748b",fontSize:10}}/>
                            <Tooltip contentStyle={{background:"#1a1a2e",border:"1px solid #27272a",borderRadius:8,fontSize:11}}/>
                            <Area type="monotone" dataKey="revenue" stroke="#6366f1" fill="url(#gRev2)" strokeWidth={2}/>
                          </AreaChart>
                        </ResponsiveContainer>
                      ):<div style={{color:"#64748b",fontSize:12}}>No revenue data yet â€” orders will populate the chart</div>;
                    })()}
                  </div>
                )}
              </Panel>

              {/* Product Distribution */}
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
                <Panel>
                  <Hdr icon={<Package size={16}/>} title="Product Pipeline"/>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={[
                        {name:"Discovered",value:byS("discovered"),fill:"#f59e0b"},
                        {name:"Analyzed",value:byS("analyzed"),fill:"#3b82f6"},
                        {name:"Listed",value:byS("listed"),fill:"#22c55e"},
                        {name:"Killed",value:byS("killed"),fill:"#ef4444"},
                      ].filter(d=>d.value>0)} dataKey="value" cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={3}>
                        {[{fill:"#f59e0b"},{fill:"#3b82f6"},{fill:"#22c55e"},{fill:"#ef4444"}].map((e,i)=><Cell key={i} fill={e.fill}/>)}
                      </Pie>
                      <Tooltip contentStyle={{background:"#1a1a2e",border:"1px solid #27272a",borderRadius:8,fontSize:11}}/>
                      <Legend wrapperStyle={{fontSize:11,color:"#94a3b8"}}/>
                    </PieChart>
                  </ResponsiveContainer>
                </Panel>

                <Panel>
                  <Hdr icon={<Award size={16}/>} title="Top Products by Score"/>
                  {analyzed.sort((a,b)=>(b.analysis?.overallScore||0)-(a.analysis?.overallScore||0)).slice(0,5).map((p,i)=>(
                    <div key={p.id} style={{display:"flex",alignItems:"center",gap:10,padding:"6px 0",borderBottom:"1px solid rgba(255,255,255,.04)"}}>
                      <span style={{fontSize:11,color:"#64748b",width:16,textAlign:"center"}}>#{i+1}</span>
                      <ScoreRing score={p.analysis?.overallScore||0} size={28}/>
                      <div style={{flex:1}}>
                        <div style={{fontSize:12,fontWeight:600,color:"#e2e8f0"}}>{p.title?.substring(0,35)}</div>
                        <div style={{fontSize:10,color:"#64748b"}}>${p.sellingPrice} Â· {p.profitMargin}%</div>
                      </div>
                    </div>
                  ))}
                  {analyzed.length===0&&<div style={{fontSize:12,color:"#64748b",textAlign:"center",padding:16}}>Analyze products to see rankings</div>}
                </Panel>
              </div>

              {/* Category Breakdown */}
              <Panel>
                <Hdr icon={<Tag size={16}/>} title="Category Breakdown"/>
                {(()=>{
                  const cats={};prods.forEach(p=>{const c=p.category||"Other";if(!cats[c])cats[c]={count:0,totalMargin:0,listed:0};cats[c].count++;cats[c].totalMargin+=p.profitMargin||0;if(p.status==="listed")cats[c].listed++;});
                  return Object.entries(cats).sort((a,b)=>b[1].count-a[1].count).map(([cat,d])=>(
                    <div key={cat} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"6px 0",borderBottom:"1px solid rgba(255,255,255,.04)"}}>
                      <span style={{fontSize:12,color:"#e2e8f0"}}>{cat}</span>
                      <div style={{display:"flex",gap:12,fontSize:10,color:"#64748b"}}>
                        <span>{d.count} products</span>
                        <span>{d.listed} listed</span>
                        <span>Avg margin: {Math.round(d.totalMargin/d.count)}%</span>
                      </div>
                    </div>
                  ));
                })()}
              </Panel>

              {/* Conversion Funnel */}
              <Panel>
                <Hdr icon={<Filter size={16}/>} title="Conversion Funnel"/>
                <div style={{display:"flex",flexDirection:"column",gap:6}}>
                  {[
                    {label:"Discovered",val:prods.length,color:"#f59e0b"},
                    {label:"Analyzed",val:analyzed.length,color:"#3b82f6"},
                    {label:"Listed",val:byS("listed"),color:"#22c55e"},
                    {label:"Orders Received",val:totalOrds,color:"#8b5cf6"},
                    {label:"Delivered",val:orders.filter(o=>o.status==="delivered").length,color:"#06b6d4"},
                  ].map((step,i)=>(
                    <div key={i} style={{display:"flex",alignItems:"center",gap:10}}>
                      <span style={{fontSize:11,color:"#64748b",width:120}}>{step.label}</span>
                      <div style={{flex:1,height:20,background:"rgba(255,255,255,.04)",borderRadius:4,overflow:"hidden"}}>
                        <div style={{height:"100%",width:`${prods.length>0?Math.max(2,(step.val/prods.length)*100):0}%`,background:step.color,borderRadius:4,transition:"width .5s"}}/>
                      </div>
                      <span style={{fontSize:12,fontWeight:600,color:step.color,width:40,textAlign:"right"}}>{step.val}</span>
                    </div>
                  ))}
                </div>
              </Panel>
            </div>
          )}

          {/* â•â•â• ACTIVITY â•â•â• */}
          {view === "activity" && (
            <div className="anim-fade" style={{display:"flex",flexDirection:"column",gap:16}}>
              <Panel>
                <Hdr icon={<Activity size={16}/>} title="Activity Log" actionLabel="Clear" action={()=>setSt(p=>({...p,activityLog:[]}))}/>
                <div style={{display:"flex",flexDirection:"column",gap:2}}>
                  {(st.activityLog||[]).map((e,i)=>(
                    <div key={i} style={{display:"flex",alignItems:"flex-start",gap:10,padding:"6px 0",borderBottom:"1px solid rgba(255,255,255,.03)"}}>
                      <span style={{width:6,height:6,borderRadius:"50%",background:e.type==="success"?"#22c55e":e.type==="error"?"#ef4444":"#6366f1",flexShrink:0,marginTop:4}}/>
                      <div style={{flex:1}}>
                        <div style={{fontSize:12,color:"#e2e8f0"}}>{e.msg}</div>
                        <div style={{fontSize:9,color:"#475569"}}>{new Date(e.time).toLocaleString()}</div>
                      </div>
                    </div>
                  ))}
                  {(st.activityLog||[]).length===0&&<div style={{fontSize:12,color:"#64748b",textAlign:"center",padding:20}}>No activity yet</div>}
                </div>
              </Panel>

              {/* Discovery Log */}
              <Panel>
                <Hdr icon={<Search size={16}/>} title="Discovery Log"/>
                {(st.discoveryLog||[]).map((l,i)=>(
                  <div key={i} style={{fontSize:11,color:"#94a3b8",padding:"4px 0",borderBottom:"1px solid rgba(255,255,255,.03)"}}>
                    {l.auto?"â° Auto":"ðŸ” Manual"} Â· {l.count} products Â· {new Date(l.time).toLocaleString()}
                  </div>
                ))}
              </Panel>

              {/* System Info */}
              <Panel>
                <Hdr icon={<Server size={16}/>} title="System Info"/>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,fontSize:11,color:"#94a3b8"}}>
                  <div>Products (local): {prods.length}</div>
                  <div>Products (Railway): {rwProds.length}</div>
                  <div>Orders (local): {orders.length}</div>
                  <div>Orders (Railway): {rwOrds.length}</div>
                  <div>AI Calls: {st.aiCalls||0}</div>
                  <div>AI Cost: ${(st.aiCostUsd||0).toFixed(4)}</div>
                  <div>Railway: {rwOnline?"Online":"Offline"}</div>
                  <div>Clawdbot: {cbOnline?"Online":"Offline"}</div>
                  <div>Manager: {st.storeManager?.enabled?"Active":"Off"}</div>
                  <div>Auto-Discovery: {st.autoDiscoveryMin>0?`${st.autoDiscoveryMin}min`:"Off"}</div>
                </div>
              </Panel>
            </div>
          )}

        </div>{/* end padding div */}
      </main>{/* end main */}

      {/* â•â•â• SETTINGS MODAL â•â•â• */}
      {showSettings&&(
        <div style={{position:"fixed",inset:0,zIndex:100,display:"flex",alignItems:"center",justifyContent:"center"}}>
          <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,.7)",backdropFilter:"blur(4px)"}} onClick={()=>setShowSettings(false)}/>
          <div className="anim-fade" style={{position:"relative",width:480,maxHeight:"80vh",overflowY:"auto",background:"#0a0a1a",border:"1px solid #27272a",borderRadius:16,padding:24}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:16}}>
              <h3 style={{fontSize:16,fontWeight:700,color:"#e2e8f0",margin:0}}>Settings</h3>
              <button onClick={()=>setShowSettings(false)} style={{background:"none",border:"none",cursor:"pointer"}}><X size={18} style={{color:"#71717a"}}/></button>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:14}}>
              <label style={{display:"flex",flexDirection:"column",gap:4}}>
                <span style={{fontSize:11,color:"#64748b"}}>Discord Webhook</span>
                <input value={settingsDraft.discordWebhook||""} onChange={e=>setSettingsDraft(d=>({...d,discordWebhook:e.target.value}))} placeholder="https://discord.com/api/webhooks/..."/>
              </label>
              <label style={{display:"flex",flexDirection:"column",gap:4}}>
                <span style={{fontSize:11,color:"#64748b"}}>Clawdbot Webhook</span>
                <input value={settingsDraft.webhookUrl||""} onChange={e=>setSettingsDraft(d=>({...d,webhookUrl:e.target.value}))} placeholder="https://..."/>
              </label>
              <label style={{display:"flex",flexDirection:"column",gap:4}}>
                <span style={{fontSize:11,color:"#64748b"}}>Auto-Discovery Interval (min, 0=off)</span>
                <input type="number" min={0} max={720} value={settingsDraft.autoDiscoveryMin||0} onChange={e=>setSettingsDraft(d=>({...d,autoDiscoveryMin:parseInt(e.target.value)||0}))}/>
              </label>
            </div>
            <div style={{display:"flex",gap:8,marginTop:20,justifyContent:"flex-end"}}>
              <Btn variant="ghost" onClick={()=>setShowSettings(false)}>Cancel</Btn>
              <Btn onClick={()=>{setSt(p=>({...p,...settingsDraft}));setShowSettings(false);log("âš™ï¸ Settings saved","success");}}>Save</Btn>
            </div>
          </div>
        </div>
      )}

      {/* â•â•â• PROMPT EDITOR MODAL â•â•â• */}
      {showPromptEditor&&(
        <div style={{position:"fixed",inset:0,zIndex:100,display:"flex",alignItems:"center",justifyContent:"center"}}>
          <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,.7)",backdropFilter:"blur(4px)"}} onClick={()=>setShowPromptEditor(false)}/>
          <div className="anim-fade" style={{position:"relative",width:560,maxHeight:"80vh",overflowY:"auto",background:"#0a0a1a",border:"1px solid #27272a",borderRadius:16,padding:24}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:16}}>
              <h3 style={{fontSize:16,fontWeight:700,color:"#e2e8f0",margin:0}}>AI Prompts</h3>
              <button onClick={()=>setShowPromptEditor(false)} style={{background:"none",border:"none",cursor:"pointer"}}><X size={18} style={{color:"#71717a"}}/></button>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:14}}>
              <label style={{display:"flex",flexDirection:"column",gap:4}}>
                <span style={{fontSize:11,color:"#64748b"}}>Discovery System Prompt (blank = default)</span>
                <textarea rows={4} value={promptsDraft.customDiscoveryPrompt||""} onChange={e=>setPromptsDraft(d=>({...d,customDiscoveryPrompt:e.target.value}))} placeholder="Custom system prompt for product discovery..."/>
              </label>
              <label style={{display:"flex",flexDirection:"column",gap:4}}>
                <span style={{fontSize:11,color:"#64748b"}}>Discovery User Prompt (blank = default)</span>
                <textarea rows={3} value={promptsDraft.customDiscoveryUser||""} onChange={e=>setPromptsDraft(d=>({...d,customDiscoveryUser:e.target.value}))} placeholder="Custom user prompt for discovery..."/>
              </label>
              <label style={{display:"flex",flexDirection:"column",gap:4}}>
                <span style={{fontSize:11,color:"#64748b"}}>Analysis System Prompt (blank = default)</span>
                <textarea rows={4} value={promptsDraft.customAnalysisPrompt||""} onChange={e=>setPromptsDraft(d=>({...d,customAnalysisPrompt:e.target.value}))} placeholder="Custom system prompt for analysis..."/>
              </label>
            </div>
            <div style={{display:"flex",gap:8,marginTop:20,justifyContent:"flex-end"}}>
              <Btn variant="ghost" onClick={()=>setShowPromptEditor(false)}>Cancel</Btn>
              <Btn onClick={()=>{setSt(p=>({...p,...promptsDraft}));setShowPromptEditor(false);log("ðŸ“ Prompts saved","success");}}>Save</Btn>
            </div>
          </div>
        </div>
      )}

      {/* â•â•â• EXPORT MODAL â•â•â• */}
      {showExport&&(
        <div style={{position:"fixed",inset:0,zIndex:100,display:"flex",alignItems:"center",justifyContent:"center"}}>
          <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,.7)",backdropFilter:"blur(4px)"}} onClick={()=>setShowExport(false)}/>
          <div className="anim-fade" style={{position:"relative",width:400,background:"#0a0a1a",border:"1px solid #27272a",borderRadius:16,padding:24}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:16}}>
              <h3 style={{fontSize:16,fontWeight:700,color:"#e2e8f0",margin:0}}>Export Data</h3>
              <button onClick={()=>setShowExport(false)} style={{background:"none",border:"none",cursor:"pointer"}}><X size={18} style={{color:"#71717a"}}/></button>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              <Btn onClick={()=>{exportCSV();setShowExport(false);}}><Download size={13}/> Export as CSV</Btn>
              <Btn variant="ghost" onClick={()=>{exportJSON();setShowExport(false);}}><Download size={13}/> Export as JSON</Btn>
              <Btn variant="ghost" onClick={()=>{cpClip(JSON.stringify(st,null,2),"state");setShowExport(false);}}><Copy size={13}/> Copy State to Clipboard</Btn>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default function App() {
  return <EB><V9 /></EB>;
}
