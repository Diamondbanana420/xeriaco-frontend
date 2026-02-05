'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingCart, Search, Star, TrendingUp, Sparkles,
  ChevronRight, Package, Truck, Shield, ArrowRight,
  Menu, X, Heart, Eye, ChevronDown, ArrowUpRight,
  Minus, Plus, Check, Gem, Clock, Zap
} from 'lucide-react';
import { PRODUCTS, CATEGORIES, COLLECTIONS, STORE_CONFIG, fetchLiveProducts, getCheckoutUrl } from '@/lib/store-data';

// ─── Cart State (client-side) ─────────────────────────────────
function useCart() {
  const [items, setItems] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [justAdded, setJustAdded] = useState(null);

  const addItem = (product) => {
    setItems(prev => {
      const existing = prev.find(i => i.id === product.id);
      if (existing) {
        return prev.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { ...product, qty: 1 }];
    });
    setJustAdded(product.id);
    setTimeout(() => setJustAdded(null), 2000);
  };

  const removeItem = (id) => setItems(prev => prev.filter(i => i.id !== id));
  const updateQty = (id, qty) => {
    if (qty <= 0) return removeItem(id);
    setItems(prev => prev.map(i => i.id === id ? { ...i, qty } : i));
  };

  const total = items.reduce((sum, i) => sum + i.price * i.qty, 0);
  const count = items.reduce((sum, i) => sum + i.qty, 0);

  return { items, addItem, removeItem, updateQty, total, count, isOpen, setIsOpen, justAdded };
}

// ─── Navbar ───────────────────────────────────────────────────
function Navbar({ cartCount, onCartClick, onSearchFocus }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? 'glass py-3' : 'py-5 bg-transparent'}`}>
        <div className="max-w-[1400px] mx-auto px-6 flex items-center justify-between">
          {/* Logo */}
          <a href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-sm bg-gradient-to-br from-xeria-gold to-xeria-gold-dark flex items-center justify-center">
              <span className="text-xeria-bg font-display font-bold text-sm">X</span>
            </div>
            <span className="font-display text-2xl font-semibold tracking-wide gold-text">
              XeriaCO
            </span>
          </a>

          {/* Desktop Nav Links */}
          <div className="hidden lg:flex items-center gap-10">
            {['Shop', 'Collections', 'About', 'Contact'].map((link) => (
              <a
                key={link}
                href={link === 'Shop' ? '#shop' : link === 'Collections' ? '#collections' : `/${link.toLowerCase()}`}
                className="text-[13px] font-body font-medium text-xeria-text-secondary hover:text-xeria-gold tracking-[0.12em] uppercase transition-colors duration-300"
              >
                {link}
              </a>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={onSearchFocus}
              className="w-10 h-10 rounded-full flex items-center justify-center text-xeria-text-secondary hover:text-xeria-gold hover:bg-white/5 transition-all"
            >
              <Search className="w-[18px] h-[18px]" />
            </button>

            <button
              onClick={onCartClick}
              className="relative w-10 h-10 rounded-full flex items-center justify-center text-xeria-text-secondary hover:text-xeria-gold hover:bg-white/5 transition-all"
            >
              <ShoppingCart className="w-[18px] h-[18px]" />
              {cartCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-xeria-gold text-xeria-bg text-[10px] font-bold rounded-full flex items-center justify-center"
                >
                  {cartCount}
                </motion.span>
              )}
            </button>

            <button
              onClick={() => setMobileMenu(true)}
              className="lg:hidden w-10 h-10 rounded-full flex items-center justify-center text-xeria-text-secondary hover:text-xeria-gold"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenu && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-xeria-bg/95 backdrop-blur-lg flex flex-col items-center justify-center gap-8"
          >
            <button onClick={() => setMobileMenu(false)} className="absolute top-6 right-6 text-xeria-text-secondary">
              <X className="w-6 h-6" />
            </button>
            {['Shop', 'Collections', 'About', 'Contact'].map((link, i) => (
              <motion.a
                key={link}
                href={link === 'Shop' ? '#shop' : link === 'Collections' ? '#collections' : `/${link.toLowerCase()}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                onClick={() => setMobileMenu(false)}
                className="font-display text-4xl font-light text-xeria-text hover:text-xeria-gold transition-colors"
              >
                {link}
              </motion.a>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ─── Hero Section ─────────────────────────────────────────────
function HeroSection() {
  return (
    <section className="relative min-h-[92vh] flex items-center justify-center overflow-hidden noise-overlay">
      {/* Ambient glows */}
      <div className="hero-glow top-1/4 left-1/4 -translate-x-1/2 animate-glow-pulse" />
      <div className="hero-glow bottom-1/4 right-1/4 translate-x-1/2 animate-glow-pulse" style={{ animationDelay: '1.5s' }} />

      {/* Fine grid */}
      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage: `linear-gradient(rgba(201,168,76,.3) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(201,168,76,.3) 1px, transparent 1px)`,
          backgroundSize: '80px 80px'
        }}
      />

      <div className="relative z-10 max-w-[1400px] mx-auto px-6 text-center">
        {/* Top badge */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-xeria-gold/20 bg-xeria-gold/5 mb-8"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-xeria-gold animate-pulse" />
          <span className="text-[11px] font-body font-medium text-xeria-gold tracking-[0.15em] uppercase">
            AI-Curated Collection
          </span>
        </motion.div>

        {/* Heading */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.15 }}
          className="font-display text-[clamp(3rem,8vw,7.5rem)] leading-[0.9] font-light tracking-tight mb-6"
        >
          <span className="block text-xeria-cream">Curated for</span>
          <span className="block gold-text font-medium italic">the discerning.</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.35 }}
          className="font-body text-lg text-xeria-text-secondary max-w-lg mx-auto mb-10 leading-relaxed"
        >
          Premium lifestyle essentials — discovered by AI, curated for you. Each product handpicked for quality, design, and value.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <a href="#shop" className="btn-primary rounded-none flex items-center gap-2">
            Explore Collection <ArrowRight className="w-4 h-4" />
          </a>
          <a href="#trending" className="btn-outline rounded-none flex items-center gap-2">
            Trending Now <TrendingUp className="w-3.5 h-3.5" />
          </a>
        </motion.div>

        {/* Trust indicators */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.8 }}
          className="flex flex-wrap items-center justify-center gap-8 mt-16 text-xeria-text-muted"
        >
          {[
            { icon: Truck, text: 'Free Shipping Over $100' },
            { icon: Shield, text: '30-Day Returns' },
            { icon: Gem, text: 'Premium Quality' },
            { icon: Zap, text: 'AI-Powered Picks' },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-2.5">
              <Icon className="w-4 h-4 text-xeria-gold/50" />
              <span className="text-[12px] font-body tracking-[0.05em] uppercase">{text}</span>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
      >
        <span className="text-[10px] font-body text-xeria-text-muted tracking-[0.2em] uppercase">Scroll</span>
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="w-px h-8 bg-gradient-to-b from-xeria-gold/40 to-transparent"
        />
      </motion.div>
    </section>
  );
}

// ─── Product Card ─────────────────────────────────────────────
function ProductCard({ product, onAddToCart, index = 0, justAdded }) {
  const hasDiscount = product.compareAt && product.price < product.compareAt;
  const discountPercent = hasDiscount ? Math.round((1 - product.price / product.compareAt) * 100) : 0;
  const isAdded = justAdded === product.id;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.6, delay: index * 0.08 }}
      className="product-card group relative bg-xeria-surface border border-xeria-border rounded-sm overflow-hidden gold-glow-hover"
    >
      {/* Badges */}
      <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5">
        {product.trending && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-xeria-gold/90 text-xeria-bg text-[10px] font-body font-bold tracking-[0.1em] uppercase">
            <TrendingUp className="w-3 h-3" /> Trending
          </span>
        )}
        {hasDiscount && (
          <span className="inline-flex items-center px-2.5 py-1 bg-white text-xeria-bg text-[10px] font-body font-bold tracking-[0.1em]">
            -{discountPercent}%
          </span>
        )}
      </div>

      {/* Image */}
      <div className="relative aspect-[4/5] overflow-hidden bg-xeria-surface-light">
        <img
          src={product.image}
          alt={product.title}
          className="w-full h-full object-cover"
          loading="lazy"
        />

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        {/* Quick add */}
        <div className="absolute bottom-4 left-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-400 transform translate-y-3 group-hover:translate-y-0">
          <button
            onClick={() => onAddToCart(product)}
            className="w-full btn-primary rounded-none text-[11px] py-3 flex items-center justify-center gap-2"
          >
            {isAdded ? (
              <><Check className="w-4 h-4" /> Added</>
            ) : (
              <><ShoppingCart className="w-3.5 h-3.5" /> Add to Cart</>
            )}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 space-y-3">
        <span className="text-[10px] font-body font-medium text-xeria-gold tracking-[0.15em] uppercase">
          {product.category}
        </span>

        <h3 className="font-display text-[17px] font-medium text-xeria-cream leading-snug group-hover:text-xeria-gold transition-colors duration-300 line-clamp-2">
          {product.title}
        </h3>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5">
          {product.tags.slice(0, 2).map((tag) => (
            <span key={tag} className="text-[10px] font-body px-2 py-0.5 border border-xeria-border text-xeria-text-muted tracking-wide uppercase">
              {tag}
            </span>
          ))}
        </div>

        {/* Rating */}
        <div className="flex items-center gap-2">
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-3 h-3 ${i < Math.round(product.rating) ? 'text-xeria-gold fill-xeria-gold' : 'text-xeria-border'}`}
              />
            ))}
          </div>
          <span className="text-[11px] font-body text-xeria-text-muted">
            ({product.reviews.toLocaleString()})
          </span>
        </div>

        {/* Price */}
        <div className="flex items-center gap-3 pt-1">
          <span className="font-body font-semibold text-lg text-xeria-cream">
            ${product.price.toFixed(2)}
          </span>
          {hasDiscount && (
            <span className="text-sm text-xeria-text-muted line-through">
              ${product.compareAt.toFixed(2)}
            </span>
          )}
        </div>

        {/* Stock warning */}
        {product.stock <= 20 && (
          <p className="text-[11px] font-body text-xeria-gold/70 flex items-center gap-1">
            <Clock className="w-3 h-3" /> Only {product.stock} left
          </p>
        )}
      </div>
    </motion.div>
  );
}

// ─── Trending Section ─────────────────────────────────────────
function TrendingSection({ products = PRODUCTS, onAddToCart, justAdded }) {
  const trending = products.filter(p => p.trending).slice(0, 4);

  return (
    <section id="trending" className="py-20 relative">
      <div className="max-w-[1400px] mx-auto px-6">
        <div className="flex items-end justify-between mb-12">
          <div>
            <span className="text-[11px] font-body text-xeria-gold tracking-[0.2em] uppercase block mb-3">
              What&apos;s Hot
            </span>
            <h2 className="font-display text-4xl sm:text-5xl font-light text-xeria-cream">
              Trending <span className="italic gold-text">Now</span>
            </h2>
          </div>
          <a href="#shop" className="hidden sm:flex items-center gap-2 text-[12px] font-body text-xeria-text-secondary hover:text-xeria-gold tracking-[0.1em] uppercase transition-colors">
            View All <ArrowUpRight className="w-3.5 h-3.5" />
          </a>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {trending.map((product, idx) => (
            <ProductCard key={product.id} product={product} onAddToCart={onAddToCart} index={idx} justAdded={justAdded} />
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Collections Banner ───────────────────────────────────────
function CollectionsBanner({ products = PRODUCTS }) {
  const featured = COLLECTIONS.slice(0, 3);

  return (
    <section id="collections" className="py-20">
      <div className="max-w-[1400px] mx-auto px-6">
        <div className="text-center mb-14">
          <span className="text-[11px] font-body text-xeria-gold tracking-[0.2em] uppercase block mb-3">
            Browse By
          </span>
          <h2 className="font-display text-4xl sm:text-5xl font-light text-xeria-cream">
            Collections
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {featured.map((col, i) => {
            const colProducts = products.filter(col.filter);
            const hero = colProducts[0];
            return (
              <motion.a
                key={col.slug}
                href="#shop"
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                className="group relative aspect-[3/4] overflow-hidden bg-xeria-surface border border-xeria-border rounded-sm gold-glow-hover"
              >
                {hero && (
                  <img
                    src={hero.image}
                    alt={col.name}
                    className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:opacity-50 group-hover:scale-105 transition-all duration-700"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-xeria-bg via-xeria-bg/40 to-transparent" />
                <div className="relative h-full flex flex-col justify-end p-8">
                  <span className="text-[10px] font-body text-xeria-gold tracking-[0.2em] uppercase mb-2">
                    {colProducts.length} Products
                  </span>
                  <h3 className="font-display text-3xl font-light text-xeria-cream mb-2">
                    {col.name}
                  </h3>
                  <p className="text-sm font-body text-xeria-text-secondary mb-5 line-clamp-2">
                    {col.description}
                  </p>
                  <span className="inline-flex items-center gap-2 text-[11px] font-body text-xeria-gold tracking-[0.1em] uppercase group-hover:gap-3 transition-all">
                    Shop Now <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </motion.a>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ─── Full Product Grid ────────────────────────────────────────
function ShopSection({ products = PRODUCTS, onAddToCart, justAdded, searchQuery }) {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [sortBy, setSortBy] = useState('trending');

  const allCategories = useMemo(() => [...new Set(products.map(p => p.category))], [products]);

  const filteredProducts = useMemo(() => {
    let results = [...products];

    if (selectedCategory) {
      results = results.filter(p => p.category === selectedCategory);
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      results = results.filter(p =>
        p.title.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.tags.some(t => t.toLowerCase().includes(q))
      );
    }

    switch (sortBy) {
      case 'price_low': results.sort((a, b) => a.price - b.price); break;
      case 'price_high': results.sort((a, b) => b.price - a.price); break;
      case 'rating': results.sort((a, b) => b.rating - a.rating); break;
      case 'trending': results.sort((a, b) => (b.trending ? 1 : 0) - (a.trending ? 1 : 0)); break;
      default: break;
    }

    return results;
  }, [selectedCategory, sortBy, searchQuery]);

  return (
    <section id="shop" className="py-20">
      <div className="max-w-[1400px] mx-auto px-6">
        {/* Section header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-10">
          <div>
            <span className="text-[11px] font-body text-xeria-gold tracking-[0.2em] uppercase block mb-3">
              Full Catalog
            </span>
            <h2 className="font-display text-4xl sm:text-5xl font-light text-xeria-cream">
              All <span className="italic gold-text">Products</span>
            </h2>
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2.5 bg-xeria-surface border border-xeria-border rounded-sm text-xeria-text-secondary text-sm font-body focus:outline-none focus:border-xeria-gold/40 cursor-pointer"
          >
            <option value="trending">Trending First</option>
            <option value="price_low">Price: Low → High</option>
            <option value="price_high">Price: High → Low</option>
            <option value="rating">Highest Rated</option>
          </select>
        </div>

        {/* Category filter */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-8 scrollbar-hide">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-5 py-2 rounded-sm whitespace-nowrap text-[11px] font-body font-medium tracking-[0.1em] uppercase transition-all duration-300 border ${
              !selectedCategory
                ? 'bg-xeria-gold text-xeria-bg border-xeria-gold'
                : 'bg-transparent text-xeria-text-secondary border-xeria-border hover:border-xeria-gold/40 hover:text-xeria-gold'
            }`}
          >
            All
          </button>
          {allCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-5 py-2 rounded-sm whitespace-nowrap text-[11px] font-body font-medium tracking-[0.1em] uppercase transition-all duration-300 border ${
                selectedCategory === cat
                  ? 'bg-xeria-gold text-xeria-bg border-xeria-gold'
                  : 'bg-transparent text-xeria-text-secondary border-xeria-border hover:border-xeria-gold/40 hover:text-xeria-gold'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Product grid */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-24">
            <Package className="w-12 h-12 text-xeria-text-muted mx-auto mb-4" />
            <h3 className="font-display text-xl text-xeria-cream mb-2">No products found</h3>
            <p className="text-sm font-body text-xeria-text-secondary">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredProducts.map((product, idx) => (
              <ProductCard key={product.id} product={product} onAddToCart={onAddToCart} index={idx} justAdded={justAdded} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

// ─── Brand Story Strip ────────────────────────────────────────
function BrandStory() {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="gold-line" />
      <div className="max-w-[1400px] mx-auto px-6 py-20">
        <div className="max-w-3xl mx-auto text-center">
          <motion.span
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-[11px] font-body text-xeria-gold tracking-[0.2em] uppercase block mb-6"
          >
            Our Philosophy
          </motion.span>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-display text-3xl sm:text-4xl font-light text-xeria-cream/90 leading-relaxed italic"
          >
            &ldquo;We believe in fewer, better things. Every product in our collection has been evaluated by AI for quality, value, and design — so you don&apos;t have to wade through the noise.&rdquo;
          </motion.p>
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="mt-8 flex items-center justify-center gap-3"
          >
            <div className="w-10 h-px bg-xeria-gold/40" />
            <span className="text-[11px] font-body text-xeria-gold tracking-[0.15em] uppercase">XeriaCO Team</span>
            <div className="w-10 h-px bg-xeria-gold/40" />
          </motion.div>
        </div>
      </div>
      <div className="gold-line" />
    </section>
  );
}

// ─── Cart Drawer ──────────────────────────────────────────────
function CartDrawer({ items, total, count, isOpen, onClose, onUpdateQty, onRemove }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70]"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-xeria-bg border-l border-xeria-border z-[80] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-xeria-border">
              <h2 className="font-display text-xl text-xeria-cream">
                Cart <span className="text-xeria-text-muted font-body text-sm font-normal">({count})</span>
              </h2>
              <button onClick={onClose} className="text-xeria-text-muted hover:text-xeria-cream transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {items.length === 0 ? (
                <div className="text-center py-16">
                  <ShoppingCart className="w-10 h-10 text-xeria-text-muted mx-auto mb-4" />
                  <p className="font-body text-xeria-text-secondary">Your cart is empty</p>
                </div>
              ) : (
                items.map((item) => (
                  <div key={item.id} className="flex gap-4 group">
                    <div className="w-20 h-24 rounded-sm overflow-hidden bg-xeria-surface flex-shrink-0">
                      <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-body text-sm text-xeria-cream truncate">{item.title}</h4>
                      <p className="text-[11px] text-xeria-text-muted uppercase tracking-wider mt-0.5">{item.category}</p>
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center border border-xeria-border rounded-sm">
                          <button onClick={() => onUpdateQty(item.id, item.qty - 1)} className="w-7 h-7 flex items-center justify-center text-xeria-text-muted hover:text-xeria-cream">
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-7 h-7 flex items-center justify-center text-xs font-body text-xeria-cream">{item.qty}</span>
                          <button onClick={() => onUpdateQty(item.id, item.qty + 1)} className="w-7 h-7 flex items-center justify-center text-xeria-text-muted hover:text-xeria-cream">
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <span className="font-body font-semibold text-sm text-xeria-cream">${(item.price * item.qty).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="p-6 border-t border-xeria-border space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-body text-xeria-text-secondary text-sm uppercase tracking-wider">Total</span>
                  <span className="font-display text-2xl text-xeria-cream">${total.toFixed(2)}</span>
                </div>
                <p className="text-[11px] font-body text-xeria-text-muted">Shipping & taxes calculated at checkout</p>
                <a
                  href={getCheckoutUrl(items)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full btn-primary rounded-none py-4 text-sm block text-center"
                >
                  Proceed to Checkout
                </a>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ─── Search Overlay ───────────────────────────────────────────
function SearchOverlay({ isOpen, onClose, onSearch }) {
  const [query, setQuery] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch(query);
    onClose();
    const el = document.getElementById('shop');
    el?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[70] bg-xeria-bg/95 backdrop-blur-xl flex items-start justify-center pt-[20vh]"
          onClick={onClose}
        >
          <motion.form
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleSubmit}
            className="w-full max-w-2xl px-6"
          >
            <div className="relative">
              <Search className="absolute left-0 top-1/2 -translate-y-1/2 w-6 h-6 text-xeria-gold" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search products..."
                autoFocus
                className="w-full pl-10 pr-4 py-4 bg-transparent border-b border-xeria-gold/30 text-xeria-cream font-display text-3xl font-light placeholder:text-xeria-text-muted focus:outline-none focus:border-xeria-gold"
              />
            </div>
            <p className="mt-4 text-[12px] font-body text-xeria-text-muted tracking-wider">Press Enter to search · Esc to close</p>
          </motion.form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Footer ───────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="border-t border-xeria-border">
      <div className="max-w-[1400px] mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-7 h-7 rounded-sm bg-gradient-to-br from-xeria-gold to-xeria-gold-dark flex items-center justify-center">
                <span className="text-xeria-bg font-display font-bold text-xs">X</span>
              </div>
              <span className="font-display text-xl font-semibold gold-text">XeriaCO</span>
            </div>
            <p className="font-body text-sm text-xeria-text-secondary leading-relaxed">
              AI-curated premium lifestyle products. Quality over quantity, always.
            </p>
          </div>

          {/* Links */}
          {[
            { title: 'Shop', links: ['All Products', 'Trending', 'New Arrivals', 'On Sale'] },
            { title: 'Support', links: ['Contact Us', 'FAQ', 'Shipping Info', 'Returns & Refunds'] },
            { title: 'Company', links: ['About XeriaCO', 'Our Story', 'Privacy Policy', 'Terms of Service'] },
          ].map((group) => (
            <div key={group.title}>
              <h4 className="text-[11px] font-body font-semibold text-xeria-gold tracking-[0.15em] uppercase mb-5">{group.title}</h4>
              <ul className="space-y-3">
                {group.links.map((link) => (
                  <li key={link}>
                    <a href="#" className="font-body text-sm text-xeria-text-secondary hover:text-xeria-cream transition-colors duration-300">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="gold-line" />

        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="font-body text-[12px] text-xeria-text-muted">
            © {new Date().getFullYear()} XeriaCO. All rights reserved.
          </p>
          <p className="font-body text-[11px] text-xeria-text-muted flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-xeria-gold/50" /> Powered by XeriaCO AI
          </p>
        </div>
      </div>
    </footer>
  );
}

// ─── Main Page ────────────────────────────────────────────────
export default function Home() {
  const cart = useCart();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [liveProducts, setLiveProducts] = useState(PRODUCTS);
  const [isLive, setIsLive] = useState(false);

  // Fetch live products from Railway backend
  useEffect(() => {
    fetchLiveProducts().then(products => {
      setLiveProducts(products);
      // If products came from API (different IDs than fallback), mark as live
      if (products.length > 0 && products[0].id !== 'xco-001') {
        setIsLive(true);
      }
    });
  }, []);

  // Escape key handler
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') {
        setSearchOpen(false);
        cart.setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [cart]);

  return (
    <>
      <Navbar cartCount={cart.count} onCartClick={() => cart.setIsOpen(true)} onSearchFocus={() => setSearchOpen(true)} />

      <HeroSection />

      <div className="gold-line" />

      <TrendingSection products={liveProducts} onAddToCart={cart.addItem} justAdded={cart.justAdded} />

      <CollectionsBanner products={liveProducts} />

      <BrandStory />

      <ShopSection products={liveProducts} onAddToCart={cart.addItem} justAdded={cart.justAdded} searchQuery={searchQuery} />

      <Footer />

      <CartDrawer
        items={cart.items}
        total={cart.total}
        count={cart.count}
        isOpen={cart.isOpen}
        onClose={() => cart.setIsOpen(false)}
        onUpdateQty={cart.updateQty}
        onRemove={cart.removeItem}
      />

      <SearchOverlay isOpen={searchOpen} onClose={() => setSearchOpen(false)} onSearch={setSearchQuery} />
    </>
  );
}
