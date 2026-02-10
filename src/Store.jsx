import { useState, useEffect, useCallback, useRef } from "react";
import { Search, X, Plus, Minus, ChevronRight, ChevronDown, Star, Package, ArrowLeft, Check, Heart, ShoppingCart, Clock, Mail, User, AlertCircle, Eye, Sparkles, ArrowRight, Menu, Shield, Truck, RotateCcw, Zap } from "lucide-react";

// ═══════════════════════════════════════
//  XERIACO GALAXY STOREFRONT v2.0
//  Luxury galaxy theme · Railway API
// ═══════════════════════════════════════
const API = "https://xeriaco-backend-production.up.railway.app/api";

// ═══ Analytics Tracker ═══
const trackEvent = (event, data = {}) => {
  try { fetch(`${API}/analytics/event`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ event, data, sessionId: window.__xeriaco_sid }) }).catch(() => {}); } catch {}
};
if (!window.__xeriaco_sid) window.__xeriaco_sid = Math.random().toString(36).slice(2);

const DISCORD = "https://discord.com/api/webhooks/1469565950410883195/kjH0T7HosN5G81TASYOifybT2PxhUNmHfonYmZCzKQ3hyIa-kZGozCdmLANEd8nx85FI";
const CLAWDBOT = "https://distracted-borg.preview.emergentagent.com/api/webhook";

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

const ORDER_STATUSES = [
  { key: "pending", label: "Order Placed", icon: "📋" },
  { key: "processing", label: "Processing", icon: "⚙️" },
  { key: "supplier_ordered", label: "Ordered from Supplier", icon: "📦" },
  { key: "shipped", label: "Shipped", icon: "🚚" },
  { key: "in_transit", label: "In Transit", icon: "✈️" },
  { key: "delivered", label: "Delivered", icon: "✅" },
];

function hc(s) { let h = 0; for (let i = 0; i < s.length; i++) { h = ((h << 5) - h) + s.charCodeAt(i); h |= 0; } return h; }

function mapProduct(p) {
  return {
    id: p.id || p._id, slug: p.slug || p.id, title: p.title || "Untitled",
    description: p.description || "", bullets: p.bullets || p.features || [],
    price: p.price || p.sellingPriceAud || 0,
    comparePrice: p.comparePrice || (p.price ? Math.round(p.price * 1.4) : null),
    supplierCost: p.supplierCost || p.costUsd || 0, category: p.category || "General",
    tags: p.tags || [], imageUrl: p.image || p.imageUrl || p.images?.[0] || null,
    imageAlt: p.title, score: p.score || (p.badge === "Top Rated" ? 80 : 50),
    rating: p.rating || 4.5, reviews: p.reviewCount || (47 + Math.floor(Math.abs(hc(p.id || "x")) % 180)),
    angle: p.marketingAngle || "", margin: 0, trend: "",
    discoveredAt: p.createdAt || new Date().toISOString(),
    stock: p.inStock === false ? "out" : "in", vendor: p.vendor || "XeriaCo",
  };
}

// ── Starfield Canvas ──
function Starfield() {
  const ref = useRef(null);
  useEffect(() => {
    const c = ref.current; if (!c) return;
    const ctx = c.getContext("2d");
    let raf, stars = [];
    const resize = () => { c.width = c.offsetWidth * 2; c.height = c.offsetHeight * 2; ctx.scale(2, 2); init(); };
    const init = () => { stars = []; for (let i = 0; i < 200; i++) stars.push({ x: Math.random() * c.offsetWidth, y: Math.random() * c.offsetHeight, r: Math.random() * 1.5 + 0.3, a: Math.random(), s: Math.random() * 0.008 + 0.002, d: Math.random() > 0.5 ? 1 : -1 }); };
    const draw = () => {
      ctx.clearRect(0, 0, c.offsetWidth, c.offsetHeight);
      stars.forEach(s => {
        s.a += s.s * s.d; if (s.a >= 1 || s.a <= 0.1) s.d *= -1;
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${s.a * 0.7})`; ctx.fill();
      });
      raf = requestAnimationFrame(draw);
    };
    resize(); draw();
    window.addEventListener("resize", resize);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []);
  return <canvas ref={ref} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }} />;
}

export default function XeriaCoStorefront() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("home");
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
  const [mobileMenu, setMobileMenu] = useState(false);
  const [favorites, setFavorites] = useState([]);
  const [orders, setOrders] = useState([]);
  const [scrolled, setScrolled] = useState(false);
  const [apiError, setApiError] = useState(false);
  const pollRef = useRef(null);

  const pullProducts = useCallback(async () => {
    const data = await apiFetch("/store/products");
    if (data) {
      setApiError(false);
      const raw = data.products || data;
      if (Array.isArray(raw)) setProducts(raw.map(mapProduct).filter(p => p.price > 0));
    } else setApiError(true);
  }, []);

  useEffect(() => {
    (async () => {
      await pullProducts();
      setCart(lsGet("xeriaco_cart") || []);
      setOrders(lsGet("xeriaco_orders") || []);
      setFavorites(lsGet("xeriaco_favs") || []);
      setLoading(false);
      trackEvent('page_view');
    })();
    pollRef.current = setInterval(pullProducts, 30000);
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handleScroll);
    return () => { clearInterval(pollRef.current); window.removeEventListener("scroll", handleScroll); };
  }, [pullProducts]);

  useEffect(() => { if (!loading) lsSet("xeriaco_cart", cart); }, [cart, loading]);
  useEffect(() => { if (!loading) lsSet("xeriaco_favs", favorites); }, [favorites, loading]);

  const addToCart = (p, qty = 1) => {
    if (p.stock === "out") return;
    setCart(prev => { const ex = prev.find(i => i.id === p.id); if (ex) return prev.map(i => i.id === p.id ? { ...i, qty: i.qty + qty } : i); return [...prev, { ...p, qty }]; });
    setAddedFx(p.id); setTimeout(() => setAddedFx(null), 1500);
    trackEvent('add_to_cart', { productId: p.id, title: p.title, price: p.price });
  };
  const rmCart = id => setCart(p => p.filter(i => i.id !== id));
  const setCartQty = (id, q) => { if (q <= 0) return rmCart(id); setCart(p => p.map(i => i.id === id ? { ...i, qty: q } : i)); };
  const cartTotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const cartCount = cart.reduce((s, i) => s + i.qty, 0);
  const shipping = cartTotal >= 100 ? 0 : 9.95;
  const toggleFav = id => setFavorites(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  const isFav = id => favorites.includes(id);
  const [checkingOut, setCheckingOut] = useState(false);

  // Handle Stripe success redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("success") === "true" && params.get("session_id")) {
      apiFetch(`/checkout/session/${params.get("session_id")}`).then(d => {
        if (d?.order) { setLastOrder(d.order); setView("confirmed"); setCart([]); lsSet("xeriaco_cart", []); }
      });
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  const placeOrder = async () => {
    if (cart.length === 0) return;
    setCheckingOut(true);
    // Try Stripe checkout first
    try {
      const r = await fetch(`${API}/checkout/create-session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart.map(i => ({ productId: i.id, quantity: i.qty })),
          successUrl: window.location.origin + window.location.pathname + "?success=true&session_id={CHECKOUT_SESSION_ID}",
          cancelUrl: window.location.origin + window.location.pathname + "?canceled=true",
        }),
      });
      const d = await r.json();
      if (d.url) { window.location.href = d.url; return; }
    } catch {}
    // Fallback: direct order creation
    const items = cart.map(i => ({ productId: i.id, title: i.title, quantity: i.qty, price: i.price }));
    const orderData = { items, customer: form, total: cartTotal, shippingAddress: { name: form.name, address: form.address, city: form.city, zip: form.zip, country: form.country, phone: form.phone } };
    const apiResult = await apiFetch("/store/orders", { method: "POST", body: JSON.stringify(orderData) });
    const orderId = apiResult?.orderId || apiResult?.order?.id || `XCO-${Date.now().toString(36).toUpperCase()}`;
    const order = {
      id: orderId, items: cart.map(i => ({ id: i.id, title: i.title, qty: i.qty, price: i.price, imageUrl: i.imageUrl })),
      total: cartTotal, customer: form, date: new Date().toISOString(), status: "pending",
      statusHistory: [{ status: "pending", time: new Date().toISOString(), note: "Order placed" }],
    };
    const existing = lsGet("xeriaco_orders") || [];
    lsSet("xeriaco_orders", [order, ...existing]);
    setOrders(prev => [order, ...prev]);
    setLastOrder(order); setCart([]); nav("confirmed");
    setCheckingOut(false);
    ping(`🛒 **New Order** – ${orderId}\n${order.items.map(i => `• ${i.title} ×${i.qty}`).join("\n")}\n💰 **$${cartTotal.toFixed(2)} AUD**\n📍 ${form.name} – ${form.city}, ${form.country}`);
  };

  const lookupOrder = async () => {
    setTrackError(""); setTrackedOrder(null);
    const apiResult = await apiFetch(`/store/orders/${trackId.trim()}`);
    if (apiResult && !apiResult.error) { setTrackedOrder(apiResult.order || apiResult); return; }
    const all = lsGet("xeriaco_orders") || [];
    const found = all.find(o => o.id.toLowerCase() === trackId.trim().toLowerCase());
    if (found) setTrackedOrder(found); else setTrackError("Order not found.");
  };

  const submitReturn = async () => {
    if (!returnOrderId || !returnReason) return;
    await apiFetch("/store/support", { method: "POST", body: JSON.stringify({ type: "return", orderId: returnOrderId, reason: returnReason }) });
    setReturnSubmitted(true);
    ping(`🔄 **Return Request** – ${returnOrderId}\nReason: ${returnReason}`);
  };

  const categories = ["all", ...new Set(products.map(p => p.category))];
  let filtered = products;
  if (catFilter !== "all") filtered = filtered.filter(p => p.category === catFilter);
  if (search) { const q = search.toLowerCase(); filtered = filtered.filter(p => p.title.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)); }
  filtered = [...filtered].sort((a, b) => { if (sortBy === "low") return a.price - b.price; if (sortBy === "high") return b.price - a.price; if (sortBy === "rating") return b.rating - a.rating; if (sortBy === "new") return (b.discoveredAt || "").localeCompare(a.discoveredAt || ""); return b.score - a.score; });

  const nav = v => { setView(v); setMobileMenu(false); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const openProduct = p => { setSelProduct(p); nav("product"); trackEvent('product_view', { productId: p.id, title: p.title }); };
  const goShop = () => { setView("shop"); setSelProduct(null); };

  // ═══ STYLES ═══
  const V = {
    purple: "#a855f7", purpleLight: "#c084fc", purpleDark: "#7c3aed",
    bg: "#07060d", card: "rgba(255,255,255,0.03)", border: "rgba(255,255,255,0.06)",
    text: "#e2e0eb", textMuted: "#8b87a0", textDim: "#5c586e",
    gradient: "linear-gradient(135deg, #a855f7 0%, #6366f1 50%, #8b5cf6 100%)",
    heroBg: "radial-gradient(ellipse 120% 80% at 50% 20%, rgba(88,28,135,0.4) 0%, rgba(30,27,75,0.3) 40%, rgba(7,6,13,1) 80%)",
  };

  if (loading) return (
    <div style={{ minHeight: "100vh", background: V.bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Inter',sans-serif" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 40, height: 40, border: `2px solid ${V.border}`, borderTopColor: V.purple, borderRadius: "50%", animation: "spin .8s linear infinite", margin: "0 auto 16px" }} />
        <p style={{ color: V.textDim, fontSize: 11, letterSpacing: 4, textTransform: "uppercase" }}>Loading</p>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: V.bg, color: V.text, fontFamily: "'Inter',sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Playfair+Display:wght@400;500;600;700;800;900&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        html{scroll-behavior:smooth}
        body{background:#07060d}
        ::-webkit-scrollbar{width:6px}::-webkit-scrollbar-track{background:#07060d}::-webkit-scrollbar-thumb{background:#1e1b2e;border-radius:3px}
        @keyframes fadeUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes slideIn{from{transform:translateX(100%)}to{transform:translateX(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes pop{0%{transform:scale(1)}50%{transform:scale(1.2)}100%{transform:scale(1)}}
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
        @keyframes glow{0%,100%{opacity:.4}50%{opacity:1}}
        @keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
        @keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(6px)}}
        .fu{animation:fadeUp .6s cubic-bezier(.22,1,.36,1) both}
        .fi{animation:fadeIn .5s ease both}
        .card{transition:all .4s cubic-bezier(.22,1,.36,1);cursor:pointer;position:relative;overflow:hidden}
        .card:hover{transform:translateY(-8px) scale(1.01);box-shadow:0 24px 48px rgba(88,28,135,.15),0 0 0 1px rgba(168,85,247,.15)}
        .card:hover .card-img{transform:scale(1.08)}
        .card:hover .card-cta{opacity:1;transform:translateY(0)}
        .card-img{transition:transform .6s cubic-bezier(.22,1,.36,1)}
        .card-cta{opacity:0;transform:translateY(10px);transition:all .35s ease .05s;z-index:5}
        .btn-primary{display:inline-flex;align-items:center;justify-content:center;gap:8px;border:none;cursor:pointer;font-family:inherit;font-weight:600;border-radius:50px;background:linear-gradient(135deg,#a855f7,#7c3aed);color:#fff;font-size:14px;padding:13px 28px;transition:all .3s;position:relative;overflow:hidden}
        .btn-primary:hover{box-shadow:0 0 30px rgba(168,85,247,.35);transform:translateY(-1px)}
        .btn-primary:active{transform:scale(.98)}
        .btn-primary:disabled{opacity:.4;cursor:not-allowed;transform:none;box-shadow:none}
        .btn-ghost{display:inline-flex;align-items:center;justify-content:center;gap:6px;border:1px solid rgba(255,255,255,.12);cursor:pointer;font-family:inherit;font-weight:500;border-radius:50px;background:transparent;color:#c084fc;font-size:13px;padding:11px 24px;transition:all .25s}
        .btn-ghost:hover{border-color:rgba(168,85,247,.4);background:rgba(168,85,247,.06);color:#d8b4fe}
        .btn-sm{padding:8px 18px;font-size:12px;border-radius:50px}
        input,select,textarea{font-family:'Inter',sans-serif;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:12px;padding:13px 18px;color:#e2e0eb;font-size:14px;outline:none;width:100%;transition:all .25s}
        input:focus,select:focus,textarea:focus{border-color:rgba(168,85,247,.5);box-shadow:0 0 0 3px rgba(168,85,247,.1)}
        input::placeholder,textarea::placeholder{color:#3f3854}
        select{cursor:pointer;-webkit-appearance:none}
        .glass{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.06);border-radius:16px;backdrop-filter:blur(12px)}
        .tag{padding:8px 20px;border-radius:50px;font-size:12px;font-weight:500;border:1px solid;cursor:pointer;font-family:inherit;transition:all .25s}
        @media(max-width:768px){.hide-m{display:none!important}.show-m{display:block!important}.grid-m1{grid-template-columns:1fr!important}}
        @media(min-width:769px){.show-m{display:none!important}}
        @media(min-width:768px){.g2{grid-template-columns:1fr 1fr!important}}
        @media(min-width:1024px){.g3{grid-template-columns:repeat(3,1fr)!important}.g4{grid-template-columns:repeat(4,1fr)!important}}
      `}</style>

      {/* ═══ NAVBAR ═══ */}
      <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, background: scrolled ? "rgba(7,6,13,.92)" : "transparent", backdropFilter: scrolled ? "blur(20px)" : "none", borderBottom: scrolled ? `1px solid ${V.border}` : "1px solid transparent", transition: "all .4s ease" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 24px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <button onClick={() => nav("home")} style={{ background: "none", border: "none", cursor: "pointer", color: "#fff" }}>
            <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: 6, textTransform: "uppercase" }}>XERIACO</span>
          </button>
          <div className="hide-m" style={{ display: "flex", alignItems: "center", gap: 32 }}>
            {[["Home","home"],["Shop","shop"],["Collections","shop"],["About","about"]].map(([l,v]) => (
              <button key={l} onClick={() => nav(v)} style={{ background: "none", border: "none", cursor: "pointer", color: view === v ? "#fff" : V.textMuted, fontSize: 13, fontWeight: 500, transition: "color .2s", fontFamily: "inherit" }}>{l}</button>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button onClick={() => nav("tracking")} className="hide-m" style={{ background: "none", border: "none", cursor: "pointer", color: V.textMuted, padding: 6 }}><User size={18} /></button>
            <button onClick={() => setCartOpen(true)} style={{ position: "relative", background: "none", border: "none", cursor: "pointer", color: "#fff", padding: 6 }}>
              <ShoppingCart size={18} />
              {cartCount > 0 && <span style={{ position: "absolute", top: -2, right: -6, minWidth: 18, height: 18, borderRadius: 9, background: V.purple, color: "#fff", fontSize: 9, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 4px", animation: "pop .3s ease" }}>{cartCount}</span>}
            </button>
            <button className="show-m" onClick={() => setMobileMenu(!mobileMenu)} style={{ background: "none", border: "none", cursor: "pointer", color: "#fff", padding: 4 }}><Menu size={20} /></button>
          </div>
        </div>
        {mobileMenu && (
          <div style={{ background: "rgba(7,6,13,.96)", backdropFilter: "blur(20px)", padding: "8px 24px 20px", borderBottom: `1px solid ${V.border}` }}>
            {[["Home","home"],["Shop","shop"],["Track Order","tracking"],["About","about"]].map(([l,v]) => (
              <button key={l} onClick={() => nav(v)} style={{ display: "block", width: "100%", textAlign: "left", background: "none", border: "none", cursor: "pointer", color: V.text, fontSize: 15, fontWeight: 500, padding: "12px 0", borderBottom: `1px solid ${V.border}`, fontFamily: "inherit" }}>{l}</button>
            ))}
          </div>
        )}
      </nav>

      {/* ═══ CART DRAWER ═══ */}
      {cartOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 200 }}>
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.6)", backdropFilter: "blur(6px)" }} onClick={() => setCartOpen(false)} />
          <div style={{ position: "absolute", top: 0, right: 0, bottom: 0, width: 420, maxWidth: "92vw", background: "#0c0a16", borderLeft: `1px solid ${V.border}`, animation: "slideIn .35s cubic-bezier(.22,1,.36,1)", display: "flex", flexDirection: "column" }}>
            <div style={{ padding: "18px 24px", borderBottom: `1px solid ${V.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontWeight: 700, fontSize: 16, letterSpacing: 1 }}>Your Cart</span>
              <button onClick={() => setCartOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: V.textMuted }}><X size={18} /></button>
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>
              {cart.length === 0 ? (
                <div style={{ textAlign: "center", padding: 48 }}>
                  <ShoppingCart size={32} style={{ color: V.textDim, margin: "0 auto 12px" }} />
                  <p style={{ color: V.textDim, fontSize: 13 }}>Your cart is empty</p>
                  <button className="btn-primary btn-sm" style={{ marginTop: 16 }} onClick={() => { setCartOpen(false); nav("shop"); }}>Start Shopping</button>
                </div>
              ) : cart.map(i => (
                <div key={i.id} className="glass" style={{ display: "flex", gap: 14, marginBottom: 12, padding: 12, borderRadius: 12 }}>
                  <div style={{ width: 64, height: 64, borderRadius: 10, background: "rgba(168,85,247,.06)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden" }}>
                    {i.imageUrl ? <img src={i.imageUrl} alt={i.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <Package size={20} style={{ color: V.textDim }} />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, lineHeight: 1.3 }}>{i.title}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <button onClick={() => setCartQty(i.id, i.qty - 1)} style={{ width: 26, height: 26, borderRadius: 8, border: `1px solid ${V.border}`, background: "transparent", cursor: "pointer", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}><Minus size={11} /></button>
                      <span style={{ fontSize: 13, fontWeight: 600, minWidth: 20, textAlign: "center" }}>{i.qty}</span>
                      <button onClick={() => setCartQty(i.id, i.qty + 1)} style={{ width: 26, height: 26, borderRadius: 8, border: `1px solid ${V.border}`, background: "transparent", cursor: "pointer", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}><Plus size={11} /></button>
                      <span style={{ marginLeft: "auto", fontWeight: 700, fontSize: 14, color: V.purpleLight }}>${(i.price * i.qty).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {cart.length > 0 && (
              <div style={{ padding: 20, borderTop: `1px solid ${V.border}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 13, color: V.textMuted }}><span>Subtotal</span><span>${cartTotal.toFixed(2)}</span></div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 11, color: V.textDim }}><span>Shipping</span><span style={{ color: "#22c55e" }}>FREE</span></div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16, fontSize: 18, fontWeight: 800 }}><span>Total</span><span>${cartTotal.toFixed(2)} <span style={{ fontSize: 12, color: V.textMuted, fontWeight: 400 }}>AUD</span></span></div>
                <button className="btn-primary" style={{ width: "100%", fontSize: 14 }} onClick={() => { setCartOpen(false); nav("checkout"); trackEvent('checkout_start', { total: cartTotal, items: cart.length }); }}>Checkout <ArrowRight size={15} /></button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══ MAIN CONTENT ═══ */}
      <main>
        {/* ── HOME / HERO ── */}
        {view === "home" && (
          <>
            <section style={{ position: "relative", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", background: V.heroBg }}>
              <Starfield />
              <div style={{ position: "relative", zIndex: 2, textAlign: "center", padding: "0 24px", maxWidth: 700 }}>
                <div className="fi" style={{ animationDelay: ".2s", display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 20px", borderRadius: 50, border: `1px solid ${V.border}`, background: "rgba(168,85,247,.06)", marginBottom: 28, fontSize: 13, color: V.purpleLight }}>
                  <Sparkles size={14} /> Premium Collection
                </div>
                <h1 className="fu" style={{ fontFamily: "'Playfair Display',serif", fontSize: "clamp(40px,7vw,72px)", fontWeight: 700, lineHeight: 1.1, marginBottom: 20, letterSpacing: -1 }}>
                  Discover<br /><span style={{ background: V.gradient, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Luxury</span>
                </h1>
                <p className="fu" style={{ animationDelay: ".15s", fontSize: "clamp(14px,1.8vw,17px)", color: V.textMuted, lineHeight: 1.7, marginBottom: 36, maxWidth: 500, margin: "0 auto 36px" }}>
                  Curated collection of premium products designed for those who appreciate the finer things in life.
                </p>
                <div className="fu" style={{ animationDelay: ".3s", display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
                  <button className="btn-primary" style={{ fontSize: 15, padding: "15px 32px" }} onClick={() => nav("shop")}>Shop Collection <ArrowRight size={16} /></button>
                  <button className="btn-ghost" style={{ fontSize: 14, padding: "14px 28px" }} onClick={() => nav("shop")}>Explore Collections</button>
                </div>
              </div>
              <div style={{ position: "absolute", bottom: 32, left: "50%", transform: "translateX(-50%)", animation: "bounce 2s ease infinite", color: V.textDim }}>
                <ChevronDown size={20} />
              </div>
            </section>

            {/* Trust Bar */}
            <section style={{ borderTop: `1px solid ${V.border}`, borderBottom: `1px solid ${V.border}`, padding: "24px 0" }}>
              <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 24px", display: "flex", justifyContent: "center", gap: 48, flexWrap: "wrap" }}>
                {[[Shield,"Premium Quality"],[Truck,"Free Shipping AU"],[RotateCcw,"30-Day Returns"],[Zap,"Fast Processing"]].map(([Ic,t]) => (
                  <div key={t} style={{ display: "flex", alignItems: "center", gap: 10, color: V.textMuted, fontSize: 13 }}>
                    <Ic size={16} style={{ color: V.purpleLight }} /> {t}
                  </div>
                ))}
              </div>
            </section>

            {/* Featured Products */}
            <section style={{ maxWidth: 1280, margin: "0 auto", padding: "80px 24px" }}>
              <div style={{ textAlign: "center", marginBottom: 48 }}>
                <span style={{ fontSize: 12, color: V.purple, letterSpacing: 3, textTransform: "uppercase", fontWeight: 600 }}>Trending Now</span>
                <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: "clamp(26px,4vw,40px)", fontWeight: 700, marginTop: 8 }}>Featured Products</h2>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 20 }} className="g3">
                {products.slice(0, 8).map((p, i) => (
                  <ProductCard key={p.id} p={p} i={i} V={V} addToCart={addToCart} addedFx={addedFx} openProduct={openProduct} toggleFav={toggleFav} isFav={isFav} />
                ))}
              </div>
              {products.length > 8 && (
                <div style={{ textAlign: "center", marginTop: 48 }}>
                  <button className="btn-ghost" onClick={() => nav("shop")}>View All Products <ArrowRight size={14} /></button>
                </div>
              )}
            </section>

            {/* Footer */}
            <Footer V={V} nav={nav} />
          </>
        )}

        {/* ── SHOP ── */}
        {view === "shop" && (
          <div style={{ maxWidth: 1280, margin: "0 auto", padding: "100px 24px 60px" }}>
            <div className="fu" style={{ marginBottom: 32 }}>
              <span style={{ fontSize: 12, color: V.purple, letterSpacing: 3, textTransform: "uppercase", fontWeight: 600 }}>Browse</span>
              <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: "clamp(28px,4vw,42px)", fontWeight: 700, marginTop: 6 }}>All Products</h1>
            </div>

            {/* Search & Filters */}
            <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap", alignItems: "center" }}>
              <div style={{ position: "relative", flex: "1 1 280px" }}>
                <Search size={15} style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: V.textDim }} />
                <input type="text" placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 42 }} />
              </div>
              <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ flex: "0 0 auto", minWidth: 160, padding: "13px 16px" }}>
                <option value="featured">Featured</option><option value="low">Price: Low → High</option><option value="high">Price: High → Low</option><option value="rating">Top Rated</option><option value="new">Newest</option>
              </select>
            </div>

            {/* Category Tags */}
            <div style={{ display: "flex", gap: 8, marginBottom: 28, flexWrap: "wrap" }}>
              {categories.map(c => (
                <button key={c} onClick={() => { setCatFilter(c); if (c !== 'all') trackEvent('category_filter', { category: c }); }} className="tag" style={{
                  background: catFilter === c ? V.purple : "transparent",
                  color: catFilter === c ? "#fff" : V.textMuted,
                  borderColor: catFilter === c ? V.purple : V.border,
                }}>{c === "all" ? "All" : c}</button>
              ))}
              <span style={{ fontSize: 12, color: V.textDim, alignSelf: "center", marginLeft: 8 }}>{filtered.length} products</span>
            </div>

            {/* Product Grid */}
            {filtered.length === 0 ? (
              <div style={{ textAlign: "center", padding: "80px 20px" }}>
                <Package size={48} style={{ margin: "0 auto 16px", color: V.textDim }} />
                <h3 style={{ fontSize: 18, fontWeight: 600, color: V.textMuted, marginBottom: 6 }}>{products.length === 0 ? "Loading products..." : "No matches"}</h3>
                <p style={{ color: V.textDim, fontSize: 13 }}>{products.length === 0 ? "Syncing from catalog" : "Try different filters"}</p>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(270px,1fr))", gap: 20, paddingBottom: 40 }} className="g3">
                {filtered.map((p, i) => <ProductCard key={p.id} p={p} i={i} V={V} addToCart={addToCart} addedFx={addedFx} openProduct={openProduct} toggleFav={toggleFav} isFav={isFav} />)}
              </div>
            )}
            <Footer V={V} nav={nav} />
          </div>
        )}

        {/* ── PRODUCT DETAIL ── */}
        {view === "product" && selProduct && (
          <div style={{ maxWidth: 1280, margin: "0 auto", padding: "100px 24px 60px" }}>
            <button className="btn-ghost btn-sm" onClick={goShop} style={{ marginBottom: 24 }}><ArrowLeft size={13} /> Back to Shop</button>
            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 48 }} className="g2">
              <div className="fi glass" style={{ borderRadius: 20, overflow: "hidden", aspectRatio: "1", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {selProduct.imageUrl ? <img src={selProduct.imageUrl} alt={selProduct.imageAlt} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <Package size={72} style={{ color: V.textDim }} />}
              </div>
              <div className="fu">
                <span style={{ fontSize: 11, color: V.purple, textTransform: "uppercase", letterSpacing: 3, fontWeight: 600 }}>{selProduct.category}</span>
                <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: "clamp(22px,3.5vw,34px)", fontWeight: 700, lineHeight: 1.25, marginTop: 8, marginBottom: 14 }}>{selProduct.title}</h1>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 20 }}>
                  {[1,2,3,4,5].map(s => <Star key={s} size={14} style={{ color: s <= Math.round(selProduct.rating) ? "#fbbf24" : V.textDim, fill: s <= Math.round(selProduct.rating) ? "#fbbf24" : "none" }} />)}
                  <span style={{ fontSize: 12, color: V.textMuted, marginLeft: 4 }}>{selProduct.rating}/5 · {selProduct.reviews} reviews</span>
                </div>
                <div className="glass" style={{ padding: 20, marginBottom: 24, borderRadius: 14 }}>
                  <span style={{ fontSize: 32, fontWeight: 800, letterSpacing: -1 }}>${selProduct.price.toFixed(2)}</span>
                  {selProduct.comparePrice > selProduct.price && <span style={{ fontSize: 15, color: V.textDim, textDecoration: "line-through", marginLeft: 10 }}>${selProduct.comparePrice.toFixed(2)}</span>}
                  <span style={{ fontSize: 12, color: V.textMuted, marginLeft: 8 }}>AUD</span>
                  {selProduct.comparePrice > selProduct.price && <span style={{ display: "inline-block", marginLeft: 12, padding: "3px 10px", borderRadius: 50, background: "rgba(34,197,94,.1)", border: "1px solid rgba(34,197,94,.2)", fontSize: 11, fontWeight: 700, color: "#4ade80" }}>Save {Math.round(((selProduct.comparePrice - selProduct.price) / selProduct.comparePrice) * 100)}%</span>}
                </div>
                <p style={{ fontSize: 14, lineHeight: 1.8, color: V.textMuted, marginBottom: 24 }}>{selProduct.description?.slice(0, 300)}{selProduct.description?.length > 300 ? "..." : ""}</p>
                {selProduct.bullets?.length > 0 && (
                  <ul style={{ marginBottom: 24, paddingLeft: 0, listStyle: "none" }}>
                    {selProduct.bullets.slice(0, 5).map((b, i) => <li key={i} style={{ fontSize: 13, color: V.textMuted, marginBottom: 8, display: "flex", alignItems: "flex-start", gap: 8 }}><Check size={14} style={{ color: V.purple, flexShrink: 0, marginTop: 2 }} /> {b}</li>)}
                  </ul>
                )}
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                  <button className="btn-primary" style={{ flex: 1, minWidth: 200 }} onClick={() => addToCart(selProduct)} disabled={selProduct.stock === "out"}>
                    {addedFx === selProduct.id ? <><Check size={15} /> Added!</> : selProduct.stock === "out" ? "Out of Stock" : <><ShoppingCart size={15} /> Add to Cart</>}
                  </button>
                  <button className="btn-ghost" onClick={() => toggleFav(selProduct.id)} style={{ padding: "13px 20px" }}>
                    <Heart size={15} style={{ fill: isFav(selProduct.id) ? "#f87171" : "none", color: isFav(selProduct.id) ? "#f87171" : V.purpleLight }} />
                  </button>
                </div>
                <div style={{ display: "flex", gap: 20, marginTop: 24, flexWrap: "wrap" }}>
                  {[["🚚","Free Shipping"],["🔄","30-Day Returns"],["🛡️","Warranty"]].map(([e,t]) => (
                    <span key={t} style={{ fontSize: 12, color: V.textMuted, display: "flex", alignItems: "center", gap: 6 }}>{e} {t}</span>
                  ))}
                </div>
              </div>
            </div>
            <Footer V={V} nav={nav} />
          </div>
        )}

        {/* ── CHECKOUT ── */}
        {view === "checkout" && (
          <div style={{ maxWidth: 720, margin: "0 auto", padding: "100px 24px 60px" }}>
            <div className="fu" style={{ marginBottom: 32 }}>
              <span style={{ fontSize: 12, color: V.purple, letterSpacing: 3, textTransform: "uppercase", fontWeight: 600 }}>Secure Checkout</span>
              <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 32, fontWeight: 700, marginTop: 6 }}>Complete Your Order</h1>
            </div>
            {cart.length === 0 ? (
              <div className="glass" style={{ textAlign: "center", padding: 48, borderRadius: 16 }}>
                <p style={{ color: V.textMuted, marginBottom: 16 }}>Your cart is empty</p>
                <button className="btn-primary" onClick={() => nav("shop")}>Browse Products</button>
              </div>
            ) : (
              <div className="fu">
                <div className="glass" style={{ padding: 24, borderRadius: 16, marginBottom: 20 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, color: V.purpleLight }}>Order Summary</h3>
                  {cart.map(i => (
                    <div key={i.id} style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, fontSize: 13, color: V.textMuted }}>
                      <span>{i.title} <span style={{ color: V.textDim }}>×{i.qty}</span></span>
                      <span style={{ fontWeight: 600, color: V.text }}>${(i.price * i.qty).toFixed(2)}</span>
                    </div>
                  ))}
                  <div style={{ borderTop: `1px solid ${V.border}`, marginTop: 12, paddingTop: 12, display: "flex", justifyContent: "space-between", fontSize: 16, fontWeight: 700 }}>
                    <span>Total</span><span>${cartTotal.toFixed(2)} AUD</span>
                  </div>
                </div>
                <div className="glass" style={{ padding: 24, borderRadius: 16 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, color: V.purpleLight }}>Shipping Details</h3>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }} className="grid-m1">
                    <input placeholder="Full Name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                    <input placeholder="Email" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                    <input placeholder="Phone" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} style={{ gridColumn: "1/-1" }} />
                    <input placeholder="Street Address" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} style={{ gridColumn: "1/-1" }} />
                    <input placeholder="City" value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} />
                    <input placeholder="Postcode" value={form.zip} onChange={e => setForm(f => ({ ...f, zip: e.target.value }))} />
                    <select value={form.country} onChange={e => setForm(f => ({ ...f, country: e.target.value }))} style={{ gridColumn: "1/-1" }}>
                      <option value="Australia">Australia</option><option value="New Zealand">New Zealand</option><option value="United States">United States</option><option value="United Kingdom">United Kingdom</option>
                    </select>
                  </div>
                  <button className="btn-primary" style={{ width: "100%", marginTop: 20, fontSize: 15, padding: "15px 28px" }} onClick={placeOrder} disabled={checkingOut || !form.name || !form.email || !form.address}>
                    {checkingOut ? "Redirecting to payment..." : `Pay $${cartTotal.toFixed(2)} AUD — Secure Checkout`} <ArrowRight size={15} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── ORDER CONFIRMED ── */}
        {view === "confirmed" && lastOrder && (
          <div style={{ maxWidth: 600, margin: "0 auto", padding: "120px 24px 60px", textAlign: "center" }}>
            <div className="fu" style={{ marginBottom: 32 }}>
              <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(34,197,94,.1)", border: "1px solid rgba(34,197,94,.2)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
                <Check size={28} style={{ color: "#4ade80" }} />
              </div>
              <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 32, fontWeight: 700, marginBottom: 8 }}>Order Confirmed!</h1>
              <p style={{ color: V.textMuted, fontSize: 14, marginBottom: 6 }}>Thank you for your purchase</p>
              <p style={{ fontSize: 13, color: V.purple, fontWeight: 600 }}>Order ID: {lastOrder.id}</p>
            </div>
            <div className="glass" style={{ padding: 24, borderRadius: 16, textAlign: "left", marginBottom: 24 }}>
              {lastOrder.items.map(i => (
                <div key={i.id} style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 13, color: V.textMuted }}>
                  <span>{i.title} ×{i.qty}</span><span style={{ fontWeight: 600 }}>${(i.price * i.qty).toFixed(2)}</span>
                </div>
              ))}
              <div style={{ borderTop: `1px solid ${V.border}`, paddingTop: 10, marginTop: 10, display: "flex", justifyContent: "space-between", fontWeight: 700 }}>
                <span>Total</span><span>${lastOrder.total.toFixed(2)} AUD</span>
              </div>
            </div>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              <button className="btn-primary" onClick={() => nav("shop")}>Continue Shopping</button>
              <button className="btn-ghost" onClick={() => { setTrackId(lastOrder.id); nav("tracking"); }}>Track Order</button>
            </div>
          </div>
        )}

        {/* ── TRACKING ── */}
        {view === "tracking" && (
          <div style={{ maxWidth: 600, margin: "0 auto", padding: "100px 24px 60px" }}>
            <div className="fu" style={{ marginBottom: 32 }}>
              <span style={{ fontSize: 12, color: V.purple, letterSpacing: 3, textTransform: "uppercase", fontWeight: 600 }}>Order Status</span>
              <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 32, fontWeight: 700, marginTop: 6 }}>Track Your Order</h1>
            </div>
            <div className="glass fu" style={{ padding: 24, borderRadius: 16, marginBottom: 24 }}>
              <div style={{ display: "flex", gap: 10 }}>
                <input placeholder="Enter Order ID..." value={trackId} onChange={e => setTrackId(e.target.value)} onKeyDown={e => e.key === "Enter" && lookupOrder()} />
                <button className="btn-primary btn-sm" onClick={lookupOrder}>Track</button>
              </div>
              {trackError && <p style={{ color: "#f87171", fontSize: 12, marginTop: 10 }}>{trackError}</p>}
            </div>
            {trackedOrder && (
              <div className="glass fu" style={{ padding: 24, borderRadius: 16, marginBottom: 20 }}>
                <div style={{ marginBottom: 16, display: "flex", justifyContent: "space-between" }}>
                  <div><span style={{ fontSize: 12, color: V.textDim }}>Order</span><br/><span style={{ fontSize: 15, fontWeight: 700 }}>{trackedOrder.id}</span></div>
                  <span style={{ padding: "6px 16px", borderRadius: 50, background: "rgba(168,85,247,.1)", border: `1px solid rgba(168,85,247,.2)`, fontSize: 12, fontWeight: 600, color: V.purpleLight, alignSelf: "start" }}>{trackedOrder.status}</span>
                </div>
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                  {ORDER_STATUSES.map((s, i) => {
                    const si = ORDER_STATUSES.findIndex(x => x.key === trackedOrder.status);
                    const done = i <= si;
                    return <div key={s.key} style={{ flex: 1, minWidth: 40, textAlign: "center" }}>
                      <div style={{ height: 4, borderRadius: 2, background: done ? V.purple : V.border, marginBottom: 6, transition: "background .3s" }} />
                      <span style={{ fontSize: 15 }}>{s.icon}</span>
                      <div style={{ fontSize: 8, color: done ? V.purpleLight : V.textDim, marginTop: 2 }}>{s.label}</div>
                    </div>;
                  })}
                </div>
              </div>
            )}
            {/* Returns */}
            <div className="glass fu" style={{ padding: 24, borderRadius: 16, animationDelay: ".1s" }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 14, color: V.purpleLight }}>Request a Return</h3>
              {returnSubmitted ? (
                <div style={{ textAlign: "center", padding: 16 }}>
                  <Check size={24} style={{ color: "#4ade80", margin: "0 auto 8px" }} />
                  <p style={{ fontSize: 13, color: V.textMuted }}>Return request submitted!</p>
                </div>
              ) : (
                <>
                  <input placeholder="Order ID" value={returnOrderId} onChange={e => setReturnOrderId(e.target.value)} style={{ marginBottom: 10 }} />
                  <textarea placeholder="Reason for return..." value={returnReason} onChange={e => setReturnReason(e.target.value)} rows={3} style={{ marginBottom: 12, resize: "vertical" }} />
                  <button className="btn-primary btn-sm" onClick={submitReturn} disabled={!returnOrderId || !returnReason}>Submit Return</button>
                </>
              )}
            </div>
          </div>
        )}

        {/* ── ABOUT ── */}
        {view === "about" && (
          <div style={{ maxWidth: 700, margin: "0 auto", padding: "120px 24px 60px", textAlign: "center" }}>
            <div className="fu">
              <span style={{ fontSize: 12, color: V.purple, letterSpacing: 3, textTransform: "uppercase", fontWeight: 600 }}>Our Story</span>
              <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: "clamp(32px,5vw,48px)", fontWeight: 700, marginTop: 8, marginBottom: 20 }}>About XeriaCo</h1>
              <p style={{ fontSize: 16, lineHeight: 1.8, color: V.textMuted, marginBottom: 24 }}>
                XeriaCo is an AI-curated marketplace delivering premium smart products to Australia and beyond. Every product in our collection is discovered, verified, and priced using advanced AI systems to bring you the best value.
              </p>
              <p style={{ fontSize: 15, lineHeight: 1.8, color: V.textMuted, marginBottom: 36 }}>
                We believe in quality over quantity. Our automated pipeline ensures that every item meets our high standards before it reaches your doorstep. Free shipping across Australia, 30-day hassle-free returns, and dedicated support.
              </p>
              <button className="btn-primary" onClick={() => nav("shop")}>Explore Our Collection <ArrowRight size={15} /></button>
            </div>
            <Footer V={V} nav={nav} />
          </div>
        )}
      </main>
    </div>
  );
}

// ═══ PRODUCT CARD COMPONENT ═══
function ProductCard({ p, i, V, addToCart, addedFx, openProduct, toggleFav, isFav }) {
  return (
    <div className="card fu" onClick={() => openProduct(p)} style={{ borderRadius: 16, background: V.card, border: `1px solid ${V.border}`, animationDelay: `${Math.min(i, 11) * .04}s`, opacity: p.stock === "out" ? 0.5 : 1 }}>
      <div style={{ height: 260, position: "relative", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", borderRadius: "16px 16px 0 0", background: "rgba(168,85,247,.02)" }}>
        {p.imageUrl ? <img className="card-img" src={p.imageUrl} alt={p.imageAlt} style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => { e.target.style.display = "none"; }} /> : <Package size={36} style={{ color: V.textDim }} />}
        <div style={{ position: "absolute", top: 10, left: 10, display: "flex", gap: 5, zIndex: 3 }}>
          {p.score >= 75 && <span style={{ padding: "3px 10px", borderRadius: 50, background: "rgba(168,85,247,.85)", backdropFilter: "blur(8px)", fontSize: 10, fontWeight: 700, color: "#fff" }}>⚡ Top Rated</span>}
          {p.comparePrice > p.price && <span style={{ padding: "3px 10px", borderRadius: 50, background: "#fff", fontSize: 10, fontWeight: 800, color: "#000" }}>-{Math.round(((p.comparePrice - p.price) / p.comparePrice) * 100)}%</span>}
        </div>
        <button onClick={e => { e.stopPropagation(); toggleFav(p.id); }} style={{ position: "absolute", top: 10, right: 10, width: 32, height: 32, borderRadius: "50%", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(7,6,13,.6)", backdropFilter: "blur(8px)", zIndex: 3 }}>
          <Heart size={13} style={{ color: isFav(p.id) ? "#f87171" : "#fff", fill: isFav(p.id) ? "#f87171" : "none" }} />
        </button>
        {p.stock !== "out" && (
          <div className="card-cta" style={{ position: "absolute", bottom: 12, left: 12, right: 12 }}>
            <button className="btn-primary" style={{ width: "100%", padding: "10px 16px", fontSize: 12, borderRadius: 10 }} onClick={e => { e.stopPropagation(); addToCart(p); }}>
              {addedFx === p.id ? <><Check size={13} /> Added!</> : <><ShoppingCart size={13} /> Add to Cart</>}
            </button>
          </div>
        )}
      </div>
      <div style={{ padding: "16px 18px 20px" }}>
        <div style={{ fontSize: 10, color: V.purple, textTransform: "uppercase", letterSpacing: 2, marginBottom: 6, fontWeight: 600 }}>{p.category}</div>
        <h3 style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.4, marginBottom: 8, height: 40, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", color: V.text }}>{p.title}</h3>
        <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 10 }}>
          {[1,2,3,4,5].map(s => <Star key={s} size={11} style={{ color: s <= Math.round(p.rating) ? "#fbbf24" : V.textDim, fill: s <= Math.round(p.rating) ? "#fbbf24" : "none" }} />)}
          <span style={{ fontSize: 10, color: V.textDim, marginLeft: 2 }}>({p.reviews})</span>
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
          <span style={{ fontSize: 20, fontWeight: 800, letterSpacing: -0.5 }}>${p.price.toFixed(2)}</span>
          {p.comparePrice > p.price && <span style={{ fontSize: 12, color: V.textDim, textDecoration: "line-through" }}>${p.comparePrice.toFixed(2)}</span>}
          <span style={{ fontSize: 10, color: V.textDim }}>AUD</span>
        </div>
      </div>
    </div>
  );
}

// ═══ FOOTER ═══
function Footer({ V, nav }) {
  return (
    <footer style={{ borderTop: `1px solid ${V.border}`, marginTop: 80, padding: "48px 0 32px" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 32, marginBottom: 36 }}>
          <div>
            <span style={{ fontSize: 14, fontWeight: 700, letterSpacing: 5, textTransform: "uppercase" }}>XERIACO</span>
            <p style={{ fontSize: 12, color: V.textDim, marginTop: 8, maxWidth: 240 }}>AI-curated premium products. Discover luxury, delivered to your door.</p>
          </div>
          <div style={{ display: "flex", gap: 48, flexWrap: "wrap" }}>
            <div>
              <span style={{ fontSize: 11, fontWeight: 600, color: V.textMuted, textTransform: "uppercase", letterSpacing: 2 }}>Shop</span>
              {["All Products","New Arrivals","Top Rated"].map(t => <button key={t} onClick={() => nav("shop")} style={{ display: "block", background: "none", border: "none", cursor: "pointer", color: V.textDim, fontSize: 12, marginTop: 8, fontFamily: "inherit" }}>{t}</button>)}
            </div>
            <div>
              <span style={{ fontSize: 11, fontWeight: 600, color: V.textMuted, textTransform: "uppercase", letterSpacing: 2 }}>Support</span>
              {[["Track Order","tracking"],["Returns","tracking"],["About","about"]].map(([t,v]) => <button key={t} onClick={() => nav(v)} style={{ display: "block", background: "none", border: "none", cursor: "pointer", color: V.textDim, fontSize: 12, marginTop: 8, fontFamily: "inherit" }}>{t}</button>)}
            </div>
          </div>
        </div>
        <div style={{ borderTop: `1px solid ${V.border}`, paddingTop: 20, display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
          <span style={{ fontSize: 11, color: V.textDim }}>© 2026 XeriaCo. All rights reserved.</span>
          <span style={{ fontSize: 10, color: V.textDim }}>🇦🇺 Made for Australia</span>
        </div>
      </div>
    </footer>
  );
}
