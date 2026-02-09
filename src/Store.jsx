import { useState, useEffect, useCallback, useRef } from "react";
import { Search, X, Plus, Minus, ChevronRight, Star, Package, ArrowLeft, Check, Heart, Box, ShoppingCart, Clock, Mail, User, AlertCircle, Copy } from "lucide-react";

// ═════════════════════════════════════════
//  XERIACO STOREFRONT — Railway API Connected
// ═════════════════════════════════════════
const API = "https://xeriaco-backend-production.up.railway.app/api";
const DISCORD = "https://discord.com/api/webhooks/1469565950410883195/kjH0T7HosN5G81TASYOifybT2PxhUNmHfonYmZCzKQ3hyIa-kZGozCdmLANEd8nx85FI";
const CLAWDBOT = "https://distracted-borg.preview.emergentagent.com/api/webhook";

// LocalStorage helpers (works in Railway-deployed sites)
function lsGet(k) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : null; } catch { return null; } }
function lsSet(k, d) { try { localStorage.setItem(k, JSON.stringify(d)); } catch {} }

async function apiFetch(path, opts = {}) {
  try {
    const r = await fetch(`${API}${path}`, { headers: { "Content-Type": "application/json" }, ...opts });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return await r.json();
  } catch (e) { console.error(`API ${path}:`, e.message); return null; }
}

async function ping(msg) {
  try { fetch(DISCORD, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content: msg }) }); } catch {}
  try { fetch(CLAWDBOT, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "execute", command: msg }) }); } catch {}
}

const mkStore = () => ({ customers: {}, favorites: [], emailList: [], savedCart: null, savedCartTime: null, returnsRequests: [] });
const mkAnalytics = () => ({ events: [], funnelToday: { views: 0, productViews: 0, addToCart: 0, checkoutStart: 0, purchases: 0 }, dailyStats: [] });

const ORDER_STATUSES = [
  { key: "pending", label: "Order Placed", icon: "📋" },
  { key: "processing", label: "Processing", icon: "⚙️" },
  { key: "supplier_ordered", label: "Ordered from Supplier", icon: "📦" },
  { key: "shipped", label: "Shipped", icon: "🚚" },
  { key: "in_transit", label: "In Transit", icon: "✈️" },
  { key: "delivered", label: "Delivered", icon: "✅" },
];

const Ico = {
  Shield: ({ size = 16, ...p }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  Zap: ({ size = 16, ...p }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
  Truck: ({ size = 16, ...p }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>,
  RotateCcw: ({ size = 16, ...p }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>,
};

function hc(s) { let h = 0; for (let i = 0; i < s.length; i++) { h = ((h << 5) - h) + s.charCodeAt(i); h |= 0; } return h; }

// Map backend API product → storefront product
function mapProduct(p) {
  return {
    id: p.id || p._id,
    slug: p.slug || p.id,
    title: p.title || "Untitled",
    description: p.description || "",
    bullets: p.bullets || p.features || [],
    price: p.price || p.sellingPriceAud || 0,
    comparePrice: p.comparePrice || (p.price ? Math.round(p.price * 1.35) : null),
    supplierCost: p.supplierCost || p.costUsd || 0,
    category: p.category || "General",
    tags: p.tags || [],
    imageUrl: p.image || p.imageUrl || p.images?.[0] || null,
    imageAlt: p.title,
    score: p.score || p.badge === "Top Rated" ? 80 : 50,
    rating: p.rating || 4.5,
    reviews: p.reviewCount || (47 + Math.floor(Math.abs(hc(p.id || "x")) % 180)),
    angle: p.marketingAngle || "",
    margin: 0,
    trend: "",
    discoveredAt: p.createdAt || new Date().toISOString(),
    stock: p.inStock === false ? "out" : "in",
    vendor: p.vendor || "XeriaCo",
  };
}

export default function XeriaCoStorefront() {
  const [products, setProducts] = useState([]);
  const [store, setStore] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("shop");
  const [selProduct, setSelProduct] = useState(null);
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [addedFx, setAddedFx] = useState(null);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const [sortBy, setSortBy] = useState("featured");
  const [form, setForm] = useState({ name: "", email: "", address: "", city: "", zip: "", country: "Australia", phone: "" });
  const [lastOrder, setLastOrder] = useState(null);
  const [trackId, setTrackId] = useState("");
  const [trackedOrder, setTrackedOrder] = useState(null);
  const [trackError, setTrackError] = useState("");
  const [returnOrderId, setReturnOrderId] = useState("");
  const [returnReason, setReturnReason] = useState("");
  const [returnSubmitted, setReturnSubmitted] = useState(false);
  const [showEmailPopup, setShowEmailPopup] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [emailCaptured, setEmailCaptured] = useState(false);
  const [showCartRecovery, setShowCartRecovery] = useState(false);
  const [recoveredCart, setRecoveredCart] = useState(null);
  const [apiError, setApiError] = useState(false);
  const pollRef = useRef(null);
  const sessionRef = useRef(`s_${Date.now().toString(36)}`);

  const trackEvent = useCallback((type, data = {}) => {
    setAnalytics(prev => {
      if (!prev) return prev;
      const ev = { type, data, time: new Date().toISOString(), session: sessionRef.current };
      const f = { ...prev.funnelToday };
      if (type === "page_view") f.views++;
      if (type === "product_view") f.productViews++;
      if (type === "add_to_cart") f.addToCart++;
      if (type === "checkout_start") f.checkoutStart++;
      if (type === "purchase") f.purchases++;
      const updated = { ...prev, events: [ev, ...prev.events].slice(0, 500), funnelToday: f };
      lsSet("xeriaco_analytics", updated);
      return updated;
    });
  }, []);

  // ── Fetch products from Railway backend API ──
  const pullProducts = useCallback(async () => {
    const data = await apiFetch("/store/products");
    if (data) {
      setApiError(false);
      const rawProducts = data.products || data;
      if (Array.isArray(rawProducts)) {
        const mapped = rawProducts.map(mapProduct).filter(p => p.price > 0);
        setProducts(mapped);
      }
    } else {
      setApiError(true);
    }
  }, []);

  useEffect(() => {
    (async () => {
      await pullProducts();
      const sd = lsGet("xeriaco_store");
      const st = sd || mkStore();
      setStore(st);
      setCart(lsGet("xeriaco_cart") || []);
      setOrders(lsGet("xeriaco_orders") || []);
      setAnalytics(lsGet("xeriaco_analytics") || mkAnalytics());
      setLoading(false);
      if (st.savedCart?.length > 0 && Date.now() - (st.savedCartTime || 0) < 7 * 86400000) {
        setRecoveredCart(st.savedCart); setShowCartRecovery(true);
      }
      if (!st.emailList?.length) setTimeout(() => setShowEmailPopup(true), 15000);
      trackEvent("page_view");
    })();
    pollRef.current = setInterval(pullProducts, 30000); // Poll every 30s
    return () => clearInterval(pollRef.current);
  }, [pullProducts, trackEvent]);

  // Persist to localStorage
  useEffect(() => { if (store && !loading) lsSet("xeriaco_store", store); }, [store, loading]);
  useEffect(() => { if (!loading) lsSet("xeriaco_cart", cart); }, [cart, loading]);
  useEffect(() => { if (cart.length > 0 && store) setStore(p => ({ ...p, savedCart: cart, savedCartTime: Date.now() })); }, [cart]);

  const addToCart = (p, qty = 1) => {
    if (p.stock === "out") return;
    setCart(prev => { const ex = prev.find(i => i.id === p.id); if (ex) return prev.map(i => i.id === p.id ? { ...i, qty: i.qty + qty } : i); return [...prev, { ...p, qty }]; });
    setAddedFx(p.id); setTimeout(() => setAddedFx(null), 1200);
    trackEvent("add_to_cart", { id: p.id, price: p.price });
  };
  const rmCart = (id) => setCart(p => p.filter(i => i.id !== id));
  const setCartQty = (id, q) => { if (q <= 0) return rmCart(id); setCart(p => p.map(i => i.id === id ? { ...i, qty: q } : i)); };
  const cartTotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const cartCount = cart.reduce((s, i) => s + i.qty, 0);
  const toggleFav = (id) => setStore(p => { const f = p.favorites || []; return { ...p, favorites: f.includes(id) ? f.filter(x => x !== id) : [...f, id] }; });
  const isFav = (id) => (store?.favorites || []).includes(id);

  // ── Place order via backend API ──
  const placeOrder = async () => {
    const items = cart.map(i => ({ productId: i.id, title: i.title, quantity: i.qty, price: i.price }));
    const orderData = { items, customer: form, total: cartTotal, shippingAddress: { name: form.name, address: form.address, city: form.city, zip: form.zip, country: form.country, phone: form.phone } };

    // Try backend API first
    const apiResult = await apiFetch("/store/orders", { method: "POST", body: JSON.stringify(orderData) });
    const orderId = apiResult?.orderId || apiResult?.order?.id || `XCO-${Date.now().toString(36).toUpperCase()}`;

    const order = {
      id: orderId, items: cart.map(i => ({ id: i.id, title: i.title, qty: i.qty, price: i.price, supplierCost: i.supplierCost, imageUrl: i.imageUrl })),
      total: cartTotal, profit: cart.reduce((s, i) => s + (i.price - (i.supplierCost || 0)) * i.qty, 0),
      customer: form, date: new Date().toISOString(), status: "pending",
      statusHistory: [{ status: "pending", time: new Date().toISOString(), note: "Order placed" }],
      trackingNumber: null, supplierOrderId: null, estimatedDelivery: null, returnRequested: false,
    };

    const existing = lsGet("xeriaco_orders") || [];
    lsSet("xeriaco_orders", [order, ...existing]);
    setOrders(prev => [order, ...prev]);
    setStore(p => ({
      ...p, customers: { ...p.customers, [form.email]: { name: form.name, email: form.email, address: form.address, city: form.city, zip: form.zip, country: form.country, phone: form.phone, orderIds: [...(p.customers?.[form.email]?.orderIds || []), orderId] } },
      savedCart: null, savedCartTime: null, emailList: p.emailList?.includes(form.email) ? p.emailList : [...(p.emailList || []), form.email],
    }));
    setLastOrder(order); setCart([]); setView("confirmed");
    trackEvent("purchase", { orderId, total: cartTotal, items: cart.length });
    const itemsList = order.items.map(i => `• ${i.title} ×${i.qty} – $${(i.price * i.qty).toFixed(2)}`).join("\n");
    ping(`🛒 **New Order** – ${orderId}\n${itemsList}\n💰 **$${cartTotal.toFixed(2)}** (profit: $${order.profit.toFixed(2)})\n📍 ${form.name} – ${form.city}, ${form.country}\n📧 ${form.email}\n⏳ Pending → Fulfillment pipeline`);
  };

  // ── Track order via backend API ──
  const lookupOrder = async () => {
    setTrackError(""); setTrackedOrder(null);
    // Try backend first
    const apiResult = await apiFetch(`/store/orders/${trackId.trim()}`);
    if (apiResult && !apiResult.error) { setTrackedOrder(apiResult.order || apiResult); return; }
    // Fallback to local
    const all = lsGet("xeriaco_orders") || [];
    const found = all.find(o => o.id.toLowerCase() === trackId.trim().toLowerCase());
    if (found) setTrackedOrder(found); else setTrackError("Order not found. Check your order ID.");
  };

  const submitReturn = async () => {
    if (!returnOrderId || !returnReason) return;
    // Try backend
    await apiFetch("/store/support", { method: "POST", body: JSON.stringify({ type: "return", orderId: returnOrderId, reason: returnReason }) });
    // Local update
    const all = lsGet("xeriaco_orders") || [];
    const idx = all.findIndex(o => o.id.toLowerCase() === returnOrderId.trim().toLowerCase());
    if (idx !== -1) {
      all[idx].returnRequested = true; all[idx].returnReason = returnReason; all[idx].returnRequestedAt = new Date().toISOString();
      all[idx].statusHistory.push({ status: "return_requested", time: new Date().toISOString(), note: `Return: ${returnReason}` });
      lsSet("xeriaco_orders", all);
    }
    setStore(p => ({ ...p, returnsRequests: [...(p.returnsRequests || []), { orderId: returnOrderId, reason: returnReason, date: new Date().toISOString() }] }));
    setReturnSubmitted(true);
    ping(`🔄 **Return Request** – ${returnOrderId}\nReason: ${returnReason}`);
  };

  const captureEmail = () => {
    if (!emailInput.includes("@")) return;
    setStore(p => ({ ...p, emailList: [...(p.emailList || []), emailInput] }));
    setEmailCaptured(true); setShowEmailPopup(false);
    trackEvent("email_capture", { email: emailInput });
    ping(`📧 **Email Captured** – ${emailInput}`);
  };

  const recoverCart = () => { if (recoveredCart) setCart(recoveredCart); setShowCartRecovery(false); trackEvent("cart_recovered"); };

  const categories = ["all", ...new Set(products.map(p => p.category))];
  let filtered = products;
  if (catFilter !== "all") filtered = filtered.filter(p => p.category === catFilter);
  if (search) { const q = search.toLowerCase(); filtered = filtered.filter(p => p.title.toLowerCase().includes(q) || p.category.toLowerCase().includes(q) || p.tags.some(t => t.toLowerCase().includes(q))); }
  filtered = [...filtered].sort((a, b) => { if (sortBy === "low") return a.price - b.price; if (sortBy === "high") return b.price - a.price; if (sortBy === "rating") return b.rating - a.rating; if (sortBy === "new") return (b.discoveredAt || "").localeCompare(a.discoveredAt || ""); return b.score - a.score; });

  const nav = (v) => { setView(v); window.scrollTo(0, 0); };
  const openProduct = (p) => { setSelProduct(p); nav("product"); trackEvent("product_view", { id: p.id }); };
  const goShop = () => { setView("shop"); setSelProduct(null); };

  const StockBadge = ({ stock }) => {
    const cfg = stock === "out" ? { c: "#ef4444", t: "Out of Stock" } : stock === "low" ? { c: "#f59e0b", t: "Low Stock" } : { c: "#4ade80", t: "In Stock" };
    return <span style={{ fontSize: 9, fontWeight: 700, color: cfg.c, padding: "2px 7px", borderRadius: 4, background: `${cfg.c}11`, border: `1px solid ${cfg.c}22` }}>{cfg.t}</span>;
  };

  if (loading || !store) return (
    <div style={{ minHeight: "100vh", background: "#000", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Inter',sans-serif" }}>
      <div style={{ textAlign: "center" }}><div style={{ width: 36, height: 36, border: "2px solid #1a1a1a", borderTopColor: "#fff", borderRadius: "50%", animation: "spin .8s linear infinite", margin: "0 auto 14px" }} /><p style={{ color: "#71717a", fontSize: 10, letterSpacing: 3, textTransform: "uppercase" }}>Loading Store</p></div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#000", color: "#fff", fontFamily: "'Inter',sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Fira+Code:wght@400;500&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:5px}::-webkit-scrollbar-track{background:#000}::-webkit-scrollbar-thumb{background:#222;border-radius:3px}
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes slideIn{from{transform:translateX(100%)}to{transform:translateX(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes pop{0%{transform:scale(1)}50%{transform:scale(1.15)}100%{transform:scale(1)}}
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
        @keyframes slideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        .fu{animation:fadeUp .45s ease both}
        .card{transition:all .35s cubic-bezier(.4,0,.2,1);cursor:pointer;position:relative;overflow:hidden}
        .card::after{content:'';position:absolute;inset:0;background:linear-gradient(180deg,transparent 50%,rgba(0,0,0,.6));opacity:0;transition:opacity .35s;pointer-events:none}
        .card:hover{transform:translateY(-6px);box-shadow:0 20px 60px rgba(0,0,0,.5)}
        .card:hover::after{opacity:1}
        .card:hover .ccta{opacity:1;transform:translateY(0)}
        .ccta{opacity:0;transform:translateY(8px);transition:all .3s ease .05s;position:relative;z-index:2}
        input,select,textarea{font-family:'Inter',sans-serif;background:rgba(255,255,255,.03);border:1px solid #1a1a1a;border-radius:10px;padding:12px 16px;color:#fff;font-size:14px;outline:none;width:100%;transition:border-color .2s;resize:vertical}
        input:focus,select:focus,textarea:focus{border-color:rgba(255,255,255,.25)}
        input::placeholder,textarea::placeholder{color:#3f3f46}
        select{cursor:pointer;-webkit-appearance:none}
        .bw{display:inline-flex;align-items:center;justify-content:center;gap:8px;border:none;cursor:pointer;font-family:inherit;transition:all .25s;font-weight:600;border-radius:10px;background:#fff;color:#000;font-size:14px;padding:12px 24px}
        .bw:hover{box-shadow:0 0 30px rgba(255,255,255,.15);transform:translateY(-1px)}
        .bw:disabled{opacity:.4;cursor:not-allowed;transform:none;box-shadow:none}
        .bg{display:inline-flex;align-items:center;justify-content:center;gap:6px;border:1px solid #27272a;cursor:pointer;font-family:inherit;transition:all .2s;font-weight:500;border-radius:8px;background:transparent;color:#a1a1aa;font-size:12px;padding:8px 16px}
        .bg:hover{border-color:rgba(255,255,255,.2);color:#fff}
        .tag{padding:7px 18px;border-radius:20px;font-size:12px;font-weight:500;border:1px solid;cursor:pointer;font-family:inherit;transition:all .2s}
        .gp{padding:20px;border-radius:14px;background:#0a0a0a;border:1px solid #141414}
        @media(max-width:639px){.hd{display:none!important}.sm{display:block!important}}
        @media(min-width:640px){.sm{display:none!important}}
        @media(min-width:768px){.g2{grid-template-columns:1fr 1fr!important}.g21{grid-template-columns:1.3fr 1fr!important}}
      `}</style>

      {/* API ERROR BANNER */}
      {apiError && products.length === 0 && (
        <div style={{ background: "rgba(239,68,68,.08)", borderBottom: "1px solid rgba(239,68,68,.15)", padding: "10px 24px", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          <AlertCircle size={13} style={{ color: "#f87171" }} />
          <span style={{ fontSize: 12, color: "#fca5a5" }}>Store is loading — connecting to server...</span>
        </div>
      )}

      {/* ABANDONED CART RECOVERY */}
      {showCartRecovery && recoveredCart && view === "shop" && (
        <div style={{ background: "linear-gradient(90deg,rgba(139,92,246,.08),rgba(59,130,246,.08))", borderBottom: "1px solid rgba(139,92,246,.15)", padding: "10px 24px", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, animation: "slideUp .4s ease" }}>
          <ShoppingCart size={13} style={{ color: "#a78bfa" }} />
          <span style={{ fontSize: 12, color: "#c4b5fd" }}>You left {recoveredCart.length} item{recoveredCart.length > 1 ? "s" : ""} in your cart</span>
          <button className="bw" style={{ padding: "5px 14px", fontSize: 11, borderRadius: 7 }} onClick={recoverCart}>Restore Cart</button>
          <button onClick={() => { setShowCartRecovery(false); setStore(p => ({ ...p, savedCart: null })); }} style={{ background: "none", border: "none", cursor: "pointer", color: "#3f3f46" }}><X size={13} /></button>
        </div>
      )}

      {/* NAVBAR */}
      <nav style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(0,0,0,.88)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,.04)" }}>
        <div style={{ maxWidth: 1320, margin: "0 auto", padding: "0 24px", height: 58, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <button onClick={goShop} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 10, color: "#fff" }}>
            <Box size={18} style={{ fill: "#fff", color: "#000" }} />
            <span style={{ fontFamily: "'Fira Code',monospace", fontSize: 16, fontWeight: 800, letterSpacing: -1 }}>XeriaCo</span>
          </button>
          <div className="hd" style={{ flex: 1, maxWidth: 380, margin: "0 24px", position: "relative" }}>
            <Search size={14} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#27272a" }} />
            <input type="text" placeholder="Search products..." value={search} onChange={e => { setSearch(e.target.value); if (view !== "shop") goShop(); }} style={{ paddingLeft: 38, fontSize: 13 }} />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button className="bg hd" onClick={() => nav("tracking")} style={{ padding: "5px 10px" }}><Package size={12} /> Track</button>
            <button className="bg hd" onClick={() => nav("account")} style={{ padding: "5px 10px" }}><User size={12} /> Account</button>
            <button onClick={() => setCartOpen(true)} style={{ position: "relative", background: "none", border: "none", cursor: "pointer", color: "#fff", padding: 6 }}>
              <ShoppingCart size={19} />
              {cartCount > 0 && <span style={{ position: "absolute", top: -2, right: -6, minWidth: 18, height: 18, borderRadius: 9, background: "#fff", color: "#000", fontSize: 10, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Fira Code',monospace", padding: "0 4px", animation: "pop .3s ease" }}>{cartCount}</span>}
            </button>
          </div>
        </div>
      </nav>

      {/* CART DRAWER */}
      {cartOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 60 }}>
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.6)", backdropFilter: "blur(4px)" }} onClick={() => setCartOpen(false)} />
          <div style={{ position: "absolute", top: 0, right: 0, bottom: 0, width: 400, maxWidth: "90vw", background: "#0a0a0a", borderLeft: "1px solid #141414", animation: "slideIn .3s ease", display: "flex", flexDirection: "column" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid #141414", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontWeight: 700, fontSize: 14 }}>Cart ({cartCount})</span>
              <button onClick={() => setCartOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#71717a" }}><X size={16} /></button>
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
              {cart.length === 0 ? <div style={{ textAlign: "center", padding: 36 }}><ShoppingCart size={28} style={{ color: "#141414", margin: "0 auto 10px" }} /><p style={{ color: "#27272a", fontSize: 12 }}>Cart is empty</p></div> : cart.map(i => (
                <div key={i.id} style={{ display: "flex", gap: 12, marginBottom: 14, padding: 10, background: "rgba(255,255,255,.02)", borderRadius: 10, border: "1px solid #111" }}>
                  <div style={{ width: 56, height: 56, borderRadius: 8, background: "#060606", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden" }}>
                    {i.imageUrl ? <img src={i.imageUrl} alt={i.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <Package size={18} style={{ color: "#111" }} />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4, lineHeight: 1.3 }}>{i.title}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <button onClick={() => setCartQty(i.id, i.qty - 1)} style={{ width: 24, height: 24, borderRadius: 5, border: "1px solid #222", background: "transparent", cursor: "pointer", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}><Minus size={10} /></button>
                      <span style={{ fontFamily: "'Fira Code',monospace", fontSize: 12, minWidth: 18, textAlign: "center" }}>{i.qty}</span>
                      <button onClick={() => setCartQty(i.id, i.qty + 1)} style={{ width: 24, height: 24, borderRadius: 5, border: "1px solid #222", background: "transparent", cursor: "pointer", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}><Plus size={10} /></button>
                      <span style={{ marginLeft: "auto", fontFamily: "'Fira Code',monospace", fontWeight: 700, fontSize: 13 }}>${(i.price * i.qty).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {cart.length > 0 && (
              <div style={{ padding: 16, borderTop: "1px solid #141414" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 12, color: "#71717a" }}><span>Subtotal</span><span style={{ fontFamily: "'Fira Code',monospace" }}>${cartTotal.toFixed(2)}</span></div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, fontSize: 10, color: "#27272a" }}><span>Shipping</span><span>FREE</span></div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14, fontSize: 16, fontWeight: 800 }}><span>Total</span><span style={{ fontFamily: "'Fira Code',monospace" }}>${cartTotal.toFixed(2)} AUD</span></div>
                <button className="bw" style={{ width: "100%", fontSize: 13 }} onClick={() => { setCartOpen(false); nav("checkout"); trackEvent("checkout_start"); }}>Checkout <ChevronRight size={14} /></button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* EMAIL POPUP */}
      {showEmailPopup && !emailCaptured && view === "shop" && (
        <div style={{ position: "fixed", inset: 0, zIndex: 90, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.5)", backdropFilter: "blur(4px)" }} onClick={() => setShowEmailPopup(false)} />
          <div style={{ position: "relative", width: 360, maxWidth: "90vw", background: "#0a0a0a", border: "1px solid #1a1a1a", borderRadius: 16, padding: 28, animation: "slideUp .4s ease", textAlign: "center" }}>
            <button onClick={() => setShowEmailPopup(false)} style={{ position: "absolute", top: 12, right: 12, background: "none", border: "none", cursor: "pointer", color: "#3f3f46" }}><X size={14} /></button>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(255,255,255,.03)", border: "1px solid #1a1a1a", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}><Mail size={20} style={{ color: "#71717a" }} /></div>
            <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 5 }}>Get 10% Off</h3>
            <p style={{ fontSize: 12, color: "#3f3f46", marginBottom: 16 }}>Subscribe for exclusive deals and new drops</p>
            <div style={{ display: "flex", gap: 6 }}>
              <input type="email" placeholder="your@email.com" value={emailInput} onChange={e => setEmailInput(e.target.value)} style={{ flex: 1, fontSize: 12 }} onKeyDown={e => e.key === "Enter" && captureEmail()} />
              <button className="bw" style={{ padding: "8px 16px", fontSize: 12, flexShrink: 0 }} onClick={captureEmail}>Subscribe</button>
            </div>
          </div>
        </div>
      )}

      {/* MAIN CONTENT */}
      <main style={{ maxWidth: 1320, margin: "0 auto", padding: "0 24px", minHeight: "calc(100vh - 58px)" }}>

        {/* ═══ SHOP VIEW ═══ */}
        {view === "shop" && (
          <div>
            {!search && catFilter === "all" && (
              <div className="fu" style={{ padding: "56px 0 36px", textAlign: "center", position: "relative" }}>
                <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,.02) 1px, transparent 0)", backgroundSize: "48px 48px", maskImage: "radial-gradient(ellipse 50% 70% at 50% 30%,#000 50%,transparent)", pointerEvents: "none" }} />
                <div style={{ position: "relative" }}>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 12px", borderRadius: 20, background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.06)", marginBottom: 16 }}>
                    <Ico.Zap size={10} style={{ color: "#fbbf24" }} /><span style={{ fontSize: 9, color: "#71717a", letterSpacing: 2, textTransform: "uppercase", fontWeight: 500 }}>AI-Curated</span>
                  </div>
                  <h1 style={{ fontSize: "clamp(28px,5vw,46px)", fontWeight: 300, letterSpacing: -1.5, lineHeight: 1.1, marginBottom: 10 }}>Trending Products,<br /><span style={{ fontWeight: 800 }}>Delivered.</span></h1>
                  <p style={{ color: "#71717a", fontSize: 14, maxWidth: 380, margin: "0 auto 20px", lineHeight: 1.6 }}>Every item verified by AI. New drops added automatically.</p>
                  <div style={{ display: "flex", justifyContent: "center", gap: 20 }}>
                    {[{ i: <Ico.Truck size={13} />, t: "Free Shipping" }, { i: <Ico.Shield size={13} />, t: "30-Day Returns" }, { i: <Ico.Zap size={13} />, t: "AI Verified" }].map((b, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 5, color: "#52525b", fontSize: 11 }}>{b.i} {b.t}</div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div className="sm" style={{ marginBottom: 10, position: "relative" }}>
              <Search size={13} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#27272a" }} />
              <input type="text" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 34, fontSize: 12 }} />
            </div>
            <div className="sm" style={{ display: "flex", gap: 6, marginBottom: 10 }}>
              <button className="bg" onClick={() => nav("tracking")} style={{ flex: 1, justifyContent: "center", fontSize: 11 }}><Package size={11} /> Track</button>
              <button className="bg" onClick={() => nav("account")} style={{ flex: 1, justifyContent: "center", fontSize: 11 }}><User size={11} /> Account</button>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, flexWrap: "wrap", gap: 8 }}>
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                {categories.map(c => <button key={c} onClick={() => setCatFilter(c)} className="tag" style={{ background: catFilter === c ? "#fff" : "transparent", color: catFilter === c ? "#000" : "#52525b", borderColor: catFilter === c ? "#fff" : "#1a1a1a", padding: "5px 14px", fontSize: 11 }}>{c === "all" ? "All" : c}</button>)}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 10, color: "#3f3f46", fontFamily: "'Fira Code',monospace" }}>{filtered.length}</span>
                <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ padding: "6px 10px", fontSize: 11, minWidth: 120 }}>
                  <option value="featured">Featured</option><option value="low">Price: Low → High</option><option value="high">Price: High → Low</option><option value="rating">Top Rated</option><option value="new">Newest</option>
                </select>
              </div>
            </div>
            {filtered.length === 0 ? (
              <div style={{ textAlign: "center", padding: "72px 20px" }}>
                <Package size={44} style={{ margin: "0 auto 14px", color: "#1a1a1a" }} />
                <h3 style={{ fontSize: 17, fontWeight: 600, color: "#a1a1aa", marginBottom: 5 }}>{products.length === 0 ? "Store loading..." : "No matches"}</h3>
                <p style={{ color: "#52525b", fontSize: 12 }}>{products.length === 0 ? "Products are being synced from our system" : "Adjust your filters"}</p>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 14, paddingBottom: 36 }}>
                {filtered.map((p, i) => (
                  <div key={p.id} className="card" onClick={() => openProduct(p)} style={{ borderRadius: 12, background: "#0a0a0a", border: "1px solid #141414", animation: `fadeUp .4s ease ${Math.min(i, 11) * .04}s both`, opacity: p.stock === "out" ? 0.45 : 1 }}>
                    <div style={{ height: 220, position: "relative", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", borderRadius: "12px 12px 0 0", background: "#060606" }}>
                      {p.imageUrl ? <img src={p.imageUrl} alt={p.imageAlt} style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => { e.target.style.display = "none"; }} /> : <Package size={32} style={{ color: "#1a1a1a" }} />}
                      <div style={{ position: "absolute", top: 8, left: 8, display: "flex", gap: 4, zIndex: 2 }}>
                        {p.score >= 75 && <span style={{ padding: "2px 7px", borderRadius: 4, background: "rgba(0,0,0,.75)", backdropFilter: "blur(8px)", border: "1px solid rgba(74,222,128,.2)", fontSize: 9, fontWeight: 700, color: "#4ade80" }}>⚡ Top</span>}
                        {p.comparePrice && p.comparePrice > p.price && <span style={{ padding: "2px 6px", borderRadius: 4, background: "#fff", fontSize: 9, fontWeight: 800, color: "#000" }}>-{Math.round(((p.comparePrice - p.price) / p.comparePrice) * 100)}%</span>}
                      </div>
                      <div style={{ position: "absolute", top: 8, right: 8, display: "flex", gap: 3, zIndex: 2 }}>
                        <StockBadge stock={p.stock} />
                        <button onClick={e => { e.stopPropagation(); toggleFav(p.id); }} style={{ width: 28, height: 28, borderRadius: 7, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", background: isFav(p.id) ? "rgba(248,113,113,.1)" : "rgba(0,0,0,.5)", backdropFilter: "blur(8px)" }}>
                          <Heart size={12} style={{ color: isFav(p.id) ? "#f87171" : "#3f3f46", fill: isFav(p.id) ? "#f87171" : "none" }} />
                        </button>
                      </div>
                      {p.stock !== "out" && <div className="ccta" style={{ position: "absolute", bottom: 10, left: 10, right: 10 }}><button className="bw" style={{ width: "100%", padding: "8px 12px", fontSize: 11, borderRadius: 7 }} onClick={e => { e.stopPropagation(); addToCart(p); }}>{addedFx === p.id ? <><Check size={12} /> Added</> : <><Plus size={12} /> Add to Cart</>}</button></div>}
                    </div>
                    <div style={{ padding: "12px 14px 16px", position: "relative", zIndex: 2 }}>
                      <div style={{ fontSize: 9, color: "#52525b", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 4, fontWeight: 500 }}>{p.category}</div>
                      <h3 style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.35, marginBottom: 7, height: 35, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", color: "#d4d4d8" }}>{p.title}</h3>
                      <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 8 }}>
                        {[1,2,3,4,5].map(s => <Star key={s} size={10} style={{ color: s <= Math.round(p.rating) ? "#fbbf24" : "#27272a", fill: s <= Math.round(p.rating) ? "#fbbf24" : "none" }} />)}
                        <span style={{ fontSize: 9, color: "#3f3f46" }}>({p.reviews})</span>
                      </div>
                      <span style={{ fontSize: 19, fontWeight: 800, fontFamily: "'Fira Code',monospace", letterSpacing: -0.5 }}>${p.price.toFixed(2)}</span>
                      {p.comparePrice && p.comparePrice > p.price && <span style={{ fontSize: 11, color: "#3f3f46", textDecoration: "line-through", marginLeft: 6 }}>${p.comparePrice.toFixed(2)}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {products.length > 0 && <div style={{ textAlign: "center", padding: "2px 0 24px" }}><span style={{ fontSize: 9, color: "#3f3f46", fontFamily: "'Fira Code',monospace" }}>● {products.length} products · live from API</span></div>}
          </div>
        )}

        {/* ═══ PRODUCT DETAIL ═══ */}
        {view === "product" && selProduct && (
          <div className="fu" style={{ padding: "20px 0 50px" }}>
            <button onClick={goShop} className="bg" style={{ marginBottom: 20 }}><ArrowLeft size={12} /> Back</button>
            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 32 }} className="g2">
              <div style={{ borderRadius: 16, overflow: "hidden", background: "#060606", aspectRatio: "1", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #141414" }}>
                {selProduct.imageUrl ? <img src={selProduct.imageUrl} alt={selProduct.imageAlt} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <Package size={64} style={{ color: "#1a1a1a" }} />}
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                  <span style={{ fontSize: 9, color: "#52525b", textTransform: "uppercase", letterSpacing: 2 }}>{selProduct.category}</span>
                  <StockBadge stock={selProduct.stock} />
                </div>
                <h1 style={{ fontSize: "clamp(18px,3vw,28px)", fontWeight: 700, letterSpacing: -0.5, lineHeight: 1.25, marginBottom: 10 }}>{selProduct.title}</h1>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 18 }}>
                  {[1,2,3,4,5].map(s => <Star key={s} size={12} style={{ color: s <= Math.round(selProduct.rating) ? "#fbbf24" : "#27272a", fill: s <= Math.round(selProduct.rating) ? "#fbbf24" : "none" }} />)}
                  <span style={{ fontSize: 11, color: "#52525b" }}>{selProduct.rating}/5 ({selProduct.reviews})</span>
                </div>
                <div className="gp" style={{ marginBottom: 20 }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 34, fontWeight: 800, fontFamily: "'Fira Code',monospace", letterSpacing: -1 }}>${selProduct.price.toFixed(2)}</span>
                    {selProduct.comparePrice && selProduct.comparePrice > selProduct.price && (
                      <><span style={{ fontSize: 15, color: "#3f3f46", textDecoration: "line-through" }}>${selProduct.comparePrice.toFixed(2)}</span>
                      <span style={{ padding: "3px 8px", borderRadius: 5, background: "#fff", fontSize: 10, fontWeight: 800, color: "#000" }}>SAVE ${(selProduct.comparePrice - selProduct.price).toFixed(2)}</span></>
                    )}
                  </div>
                  <div style={{ fontSize: 10, color: "#3f3f46", marginTop: 3 }}>Tax included · Free shipping</div>
                </div>
                {selProduct.bullets?.length > 0 && (
                  <div style={{ marginBottom: 20, display: "flex", flexDirection: "column", gap: 7 }}>
                    {selProduct.bullets.map((b, i) => (
                      <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                        <div style={{ width: 16, height: 16, borderRadius: 4, background: "rgba(74,222,128,.05)", border: "1px solid rgba(74,222,128,.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}><Check size={9} style={{ color: "#4ade80" }} /></div>
                        <span style={{ fontSize: 12, color: "#a1a1aa", lineHeight: 1.5 }}>{b}</span>
                      </div>
                    ))}
                  </div>
                )}
                <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
                  <button className="bw" style={{ flex: 1, padding: "13px 20px" }} onClick={() => addToCart(selProduct)} disabled={selProduct.stock === "out"}>
                    {selProduct.stock === "out" ? "Out of Stock" : addedFx === selProduct.id ? <><Check size={15} /> Added!</> : <><ShoppingCart size={15} /> Add to Cart</>}
                  </button>
                  <button onClick={() => toggleFav(selProduct.id)} style={{ width: 48, height: 48, borderRadius: 10, border: "1px solid #1a1a1a", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Heart size={17} style={{ color: isFav(selProduct.id) ? "#f87171" : "#3f3f46", fill: isFav(selProduct.id) ? "#f87171" : "none" }} />
                  </button>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, padding: "14px 0", borderTop: "1px solid #141414", borderBottom: "1px solid #141414", marginBottom: 20 }}>
                  {[{ i: <Ico.Truck size={13} />, t: "Free Shipping" }, { i: <Ico.Shield size={13} />, t: "30-Day Returns" }, { i: <Package size={13} />, t: "Secure" }].map((b, i) => (
                    <div key={i} style={{ textAlign: "center" }}><div style={{ color: "#27272a", marginBottom: 2, display: "flex", justifyContent: "center" }}>{b.i}</div><div style={{ fontSize: 9, fontWeight: 600 }}>{b.t}</div></div>
                  ))}
                </div>
                {selProduct.description && <div style={{ marginBottom: 16 }}><h3 style={{ fontSize: 9, fontWeight: 700, marginBottom: 7, textTransform: "uppercase", letterSpacing: 2, color: "#52525b" }}>Description</h3><div style={{ fontSize: 12, color: "#a1a1aa", lineHeight: 1.8 }} dangerouslySetInnerHTML={{ __html: selProduct.description }} /></div>}
                {selProduct.tags?.length > 0 && <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 14 }}>{selProduct.tags.map((t, i) => <span key={i} style={{ padding: "3px 8px", borderRadius: 4, background: "rgba(255,255,255,.02)", border: "1px solid #1a1a1a", fontSize: 9, color: "#52525b" }}>{t}</span>)}</div>}
                {selProduct.angle && <div style={{ padding: "12px 16px", borderRadius: 10, background: "rgba(139,92,246,.03)", border: "1px solid rgba(139,92,246,.08)" }}><div style={{ fontSize: 9, color: "#a78bfa", textTransform: "uppercase", letterSpacing: 2, marginBottom: 4, fontWeight: 600 }}>Why This Product</div><div style={{ fontSize: 11, color: "#a1a1aa", lineHeight: 1.6 }}>{selProduct.angle}</div></div>}
              </div>
            </div>
          </div>
        )}

        {/* ═══ CHECKOUT ═══ */}
        {view === "checkout" && (
          <div className="fu" style={{ padding: "24px 0 50px", maxWidth: 540, margin: "0 auto" }}>
            <button onClick={goShop} className="bg" style={{ marginBottom: 20 }}><ArrowLeft size={12} /> Back</button>
            <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 5 }}>Checkout</h2>
            <p style={{ color: "#52525b", fontSize: 12, marginBottom: 24 }}>{cart.length} item{cart.length !== 1 ? "s" : ""} · ${cartTotal.toFixed(2)} AUD</p>
            <div className="gp" style={{ marginBottom: 14 }}>
              <h3 style={{ fontSize: 11, fontWeight: 700, marginBottom: 12, textTransform: "uppercase", letterSpacing: 2, color: "#52525b" }}>Shipping Details</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <input placeholder="Full Name" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} style={{ gridColumn: "1/-1" }} />
                <input placeholder="Email" type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} style={{ gridColumn: "1/-1" }} />
                <input placeholder="Address" value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} style={{ gridColumn: "1/-1" }} />
                <input placeholder="City" value={form.city} onChange={e => setForm(p => ({ ...p, city: e.target.value }))} />
                <input placeholder="Postcode" value={form.zip} onChange={e => setForm(p => ({ ...p, zip: e.target.value }))} />
                <select value={form.country} onChange={e => setForm(p => ({ ...p, country: e.target.value }))}><option>Australia</option><option>New Zealand</option><option>United States</option><option>United Kingdom</option><option>Canada</option></select>
                <input placeholder="Phone (optional)" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
              </div>
            </div>
            <div className="gp" style={{ marginBottom: 14 }}>
              <h3 style={{ fontSize: 11, fontWeight: 700, marginBottom: 10, textTransform: "uppercase", letterSpacing: 2, color: "#52525b" }}>Order Summary</h3>
              {cart.map(i => <div key={i.id} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", fontSize: 12 }}><span style={{ color: "#a1a1aa" }}>{i.title} ×{i.qty}</span><span style={{ fontFamily: "'Fira Code',monospace" }}>${(i.price * i.qty).toFixed(2)}</span></div>)}
              <div style={{ borderTop: "1px solid #141414", marginTop: 8, paddingTop: 8, display: "flex", justifyContent: "space-between", fontWeight: 800 }}><span>Total</span><span style={{ fontFamily: "'Fira Code',monospace", fontSize: 16 }}>${cartTotal.toFixed(2)} AUD</span></div>
            </div>
            <button className="bw" style={{ width: "100%", padding: "14px 24px" }} onClick={placeOrder} disabled={!form.name || !form.email || !form.address || !form.city || !form.zip || cart.length === 0}>Place Order <ChevronRight size={14} /></button>
            <div style={{ display: "flex", justifyContent: "center", gap: 16, marginTop: 14 }}>
              {[{ i: <Ico.Shield size={12} />, t: "Secure" }, { i: <Ico.Truck size={12} />, t: "Free Shipping" }, { i: <Ico.RotateCcw size={12} />, t: "30-Day Returns" }].map((b, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 4, color: "#27272a", fontSize: 10 }}>{b.i} {b.t}</div>
              ))}
            </div>
          </div>
        )}

        {/* ═══ CONFIRMED ═══ */}
        {view === "confirmed" && lastOrder && (
          <div className="fu" style={{ padding: "36px 0 50px", maxWidth: 480, margin: "0 auto", textAlign: "center" }}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(74,222,128,.06)", border: "2px solid rgba(74,222,128,.2)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}><Check size={26} style={{ color: "#4ade80" }} /></div>
            <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 5 }}>Order Confirmed!</h2>
            <p style={{ color: "#52525b", fontSize: 12, marginBottom: 20 }}>Thank you for your order</p>
            <div className="gp" style={{ textAlign: "left", marginBottom: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}><span style={{ fontSize: 10, color: "#52525b" }}>Order ID</span><span style={{ fontFamily: "'Fira Code',monospace", fontSize: 12, fontWeight: 700 }}>{lastOrder.id}</span></div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}><span style={{ fontSize: 10, color: "#52525b" }}>Total</span><span style={{ fontFamily: "'Fira Code',monospace", fontSize: 12, fontWeight: 700 }}>${lastOrder.total.toFixed(2)} AUD</span></div>
              <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ fontSize: 10, color: "#52525b" }}>Items</span><span style={{ fontSize: 12 }}>{lastOrder.items.length}</span></div>
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
              <button className="bw" onClick={goShop}>Continue Shopping</button>
              <button className="bg" onClick={() => { setTrackId(lastOrder.id); nav("tracking"); }}>Track Order</button>
            </div>
          </div>
        )}

        {/* ═══ TRACKING ═══ */}
        {view === "tracking" && (
          <div className="fu" style={{ padding: "24px 0 50px", maxWidth: 480, margin: "0 auto" }}>
            <button onClick={goShop} className="bg" style={{ marginBottom: 20 }}><ArrowLeft size={12} /> Back</button>
            <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 5 }}>Track Your Order</h2>
            <p style={{ color: "#52525b", fontSize: 12, marginBottom: 20 }}>Enter your order ID to check status</p>
            <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
              <input type="text" placeholder="XCO-XXXXXXXX" value={trackId} onChange={e => setTrackId(e.target.value)} style={{ flex: 1, fontFamily: "'Fira Code',monospace" }} onKeyDown={e => e.key === "Enter" && lookupOrder()} />
              <button className="bw" onClick={lookupOrder} style={{ padding: "10px 20px", fontSize: 12, flexShrink: 0 }}>Track</button>
            </div>
            {trackError && <div style={{ padding: "10px 14px", borderRadius: 8, background: "rgba(239,68,68,.05)", border: "1px solid rgba(239,68,68,.1)", color: "#f87171", fontSize: 12, marginBottom: 14, display: "flex", alignItems: "center", gap: 6 }}><AlertCircle size={13} /> {trackError}</div>}
            {trackedOrder && (
              <div className="gp" style={{ animation: "fadeUp .4s ease" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}><span style={{ fontFamily: "'Fira Code',monospace", fontSize: 13, fontWeight: 700 }}>{trackedOrder.id}</span><span style={{ fontSize: 10, color: "#52525b" }}>{new Date(trackedOrder.date).toLocaleDateString()}</span></div>
                <div style={{ display: "flex", gap: 2, marginBottom: 16 }}>
                  {ORDER_STATUSES.map((s, i) => { const activeIdx = ORDER_STATUSES.findIndex(x => x.key === trackedOrder.status); const done = i <= activeIdx; return (
                    <div key={s.key} style={{ flex: 1, textAlign: "center" }}>
                      <div style={{ height: 3, borderRadius: 2, background: done ? "#4ade80" : "#141414", marginBottom: 6, transition: "all .3s" }} />
                      <div style={{ fontSize: 14, marginBottom: 2 }}>{s.icon}</div>
                      <div style={{ fontSize: 7, color: done ? "#4ade80" : "#27272a", fontWeight: done ? 700 : 400 }}>{s.label}</div>
                    </div>
                  ); })}
                </div>
                {trackedOrder.items?.map((it, i) => <div key={i} style={{ fontSize: 11, color: "#71717a", marginBottom: 2 }}>• {it.title} ×{it.qty}</div>)}
                <div style={{ borderTop: "1px solid #141414", marginTop: 10, paddingTop: 8, display: "flex", justifyContent: "space-between" }}><span style={{ fontSize: 12, fontWeight: 700 }}>Total</span><span style={{ fontFamily: "'Fira Code',monospace", fontWeight: 700 }}>${trackedOrder.total?.toFixed(2) || "0.00"} AUD</span></div>
              </div>
            )}
          </div>
        )}

        {/* ═══ ACCOUNT ═══ */}
        {view === "account" && (
          <div className="fu" style={{ padding: "24px 0 50px", maxWidth: 480, margin: "0 auto" }}>
            <button onClick={goShop} className="bg" style={{ marginBottom: 20 }}><ArrowLeft size={12} /> Back</button>
            <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 5 }}>My Account</h2>
            <p style={{ color: "#52525b", fontSize: 12, marginBottom: 20 }}>Order history and saved info</p>
            {orders.length > 0 && (
              <div>
                <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Recent Orders</h3>
                {orders.slice(0, 5).map((o, i) => (
                  <div key={i} className="gp" style={{ marginBottom: 6, cursor: "pointer" }} onClick={() => { setTrackId(o.id); nav("tracking"); }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontFamily: "'Fira Code',monospace", fontSize: 11, fontWeight: 700 }}>{o.id}</span>
                      <span style={{ fontSize: 10, color: "#52525b" }}>{new Date(o.date).toLocaleDateString()}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 10, color: "#71717a" }}>{o.items?.length || 0} items</span>
                      <span style={{ fontSize: 12, fontWeight: 700, fontFamily: "'Fira Code',monospace" }}>${o.total?.toFixed(2) || "0.00"}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {Object.keys(store.customers || {}).length > 0 && (
              <div style={{ marginTop: 24 }}>
                <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Saved Addresses</h3>
                {Object.values(store.customers).map((c, i) => (
                  <div key={i} className="gp" style={{ marginBottom: 6 }}>
                    <div style={{ fontSize: 12, fontWeight: 600 }}>{c.name}</div>
                    <div style={{ fontSize: 11, color: "#52525b" }}>{c.address}, {c.city} {c.zip} · {c.country}</div>
                    <div style={{ fontSize: 10, color: "#3f3f46" }}>{c.email}{c.phone ? ` · ${c.phone}` : ""}</div>
                  </div>
                ))}
              </div>
            )}
            <div style={{ marginTop: 24, display: "flex", gap: 8 }}>
              <button className="bg" style={{ flex: 1, justifyContent: "center" }} onClick={() => nav("tracking")}><Package size={12} /> Track Order</button>
              <button className="bg" style={{ flex: 1, justifyContent: "center" }} onClick={() => nav("returns")}><Ico.RotateCcw size={12} /> Request Return</button>
            </div>
          </div>
        )}

        {/* ═══ RETURNS ═══ */}
        {view === "returns" && (
          <div className="fu" style={{ padding: "24px 0 50px", maxWidth: 460, margin: "0 auto" }}>
            <button onClick={goShop} className="bg" style={{ marginBottom: 20 }}><ArrowLeft size={12} /> Back</button>
            <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 5 }}>Request a Return</h2>
            <p style={{ color: "#52525b", fontSize: 12, marginBottom: 20 }}>Hassle-free 30-day returns on all orders</p>
            {returnSubmitted ? (
              <div className="gp" style={{ textAlign: "center", padding: 36 }}>
                <div style={{ width: 44, height: 44, borderRadius: "50%", background: "rgba(74,222,128,.06)", border: "2px solid rgba(74,222,128,.2)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}><Check size={20} style={{ color: "#4ade80" }} /></div>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 5 }}>Return Requested</h3>
                <p style={{ fontSize: 12, color: "#52525b", marginBottom: 14 }}>We'll review and get back to you shortly</p>
                <button className="bw" onClick={() => { setReturnSubmitted(false); setReturnOrderId(""); setReturnReason(""); goShop(); }}>Back to Shop</button>
              </div>
            ) : (
              <div className="gp">
                <div style={{ marginBottom: 14 }}><label style={{ fontSize: 9, color: "#52525b", textTransform: "uppercase", letterSpacing: 2, marginBottom: 4, display: "block", fontWeight: 600 }}>Order ID</label><input type="text" value={returnOrderId} onChange={e => setReturnOrderId(e.target.value)} placeholder="XCO-XXXXXXXX" style={{ fontFamily: "'Fira Code',monospace" }} /></div>
                <div style={{ marginBottom: 14 }}><label style={{ fontSize: 9, color: "#52525b", textTransform: "uppercase", letterSpacing: 2, marginBottom: 4, display: "block", fontWeight: 600 }}>Reason</label><select value={returnReason} onChange={e => setReturnReason(e.target.value)}><option value="">Select a reason...</option><option value="defective">Defective</option><option value="not_as_described">Not as described</option><option value="wrong_item">Wrong item</option><option value="changed_mind">Changed mind</option><option value="too_late">Arrived late</option><option value="other">Other</option></select></div>
                <button className="bw" style={{ width: "100%" }} onClick={submitReturn} disabled={!returnOrderId || !returnReason}>Submit Return Request</button>
              </div>
            )}
          </div>
        )}

      </main>

      {/* FOOTER */}
      <footer style={{ borderTop: "1px solid #141414", padding: "36px 24px", marginTop: 20, background: "#000" }}>
        <div style={{ maxWidth: 1320, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 24, marginBottom: 24 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 7 }}><Box size={13} style={{ fill: "#fff", color: "#000" }} /><span style={{ fontFamily: "'Fira Code',monospace", fontSize: 13, fontWeight: 800 }}>XeriaCo</span></div>
              <p style={{ fontSize: 10, color: "#3f3f46", maxWidth: 200, lineHeight: 1.5 }}>AI-powered product curation. Selected for demand, quality, and value.</p>
            </div>
            <div style={{ display: "flex", gap: 32 }}>
              <div>
                <h4 style={{ fontSize: 8, color: "#3f3f46", textTransform: "uppercase", letterSpacing: 2, marginBottom: 8, fontWeight: 700 }}>Shop</h4>
                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  {categories.filter(c => c !== "all").slice(0, 4).map(c => <button key={c} onClick={() => { setCatFilter(c); goShop(); }} style={{ background: "none", border: "none", cursor: "pointer", color: "#52525b", fontSize: 10, fontFamily: "inherit", textAlign: "left", padding: 0 }}>{c}</button>)}
                </div>
              </div>
              <div>
                <h4 style={{ fontSize: 8, color: "#3f3f46", textTransform: "uppercase", letterSpacing: 2, marginBottom: 8, fontWeight: 700 }}>Help</h4>
                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  <button onClick={() => nav("tracking")} style={{ background: "none", border: "none", cursor: "pointer", color: "#52525b", fontSize: 10, fontFamily: "inherit", textAlign: "left", padding: 0 }}>Track Order</button>
                  <button onClick={() => nav("returns")} style={{ background: "none", border: "none", cursor: "pointer", color: "#52525b", fontSize: 10, fontFamily: "inherit", textAlign: "left", padding: 0 }}>Returns</button>
                  <button onClick={() => nav("account")} style={{ background: "none", border: "none", cursor: "pointer", color: "#52525b", fontSize: 10, fontFamily: "inherit", textAlign: "left", padding: 0 }}>Account</button>
                </div>
              </div>
            </div>
          </div>
          <div style={{ borderTop: "1px solid #141414", paddingTop: 14, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
            <span style={{ fontSize: 9, color: "#27272a", fontFamily: "'Fira Code',monospace" }}>© 2026 XeriaCo · AI-Powered</span>
            <span style={{ fontSize: 9, color: "#27272a", fontFamily: "'Fira Code',monospace" }}>{products.length} products · auto-synced</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
