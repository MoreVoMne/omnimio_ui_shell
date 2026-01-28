import React, { useState, useMemo, useEffect } from 'react';
import { Search, RefreshCw, ChevronDown, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCanvasStore } from '../../stores/canvasStore';
import type { Product } from '../../types/canvas';
import StandardLayout, { StandardButton, FooterInfoItem } from '../layout/StandardLayout';


// Seed products data (from MerchantWizardShell)
const seedProducts: Omit<Product, 'status'>[] = [
  {
    id: 'aurora-tote',
    name: 'Aurora Tote',
    price: 320.0,
    category: 'Bags',
    images: [],
    tags: [],
  },
  {
    id: 'mini-crossbody',
    name: 'Mini Crossbody',
    price: 180.0,
    category: 'Bags',
    images: [],
    tags: [],
  },
  {
    id: 'laptop-sleeve',
    name: 'Laptop Sleeve',
    price: 140.0,
    category: 'Accessories',
    images: [],
    tags: [],
  },
  {
    id: 'atlas-backpack',
    name: 'Atlas Backpack',
    price: 420.0,
    category: 'Bags',
    images: [],
    tags: [],
  },
  {
    id: 'leather-wallet',
    name: 'Leather Wallet',
    price: 95.0,
    category: 'Accessories',
    images: [],
    tags: [],
  },
  {
    id: 'travel-duffel',
    name: 'Travel Duffel',
    price: 280.0,
    category: 'Bags',
    images: [],
    tags: [],
  },
  {
    id: 'phone-case',
    name: 'Phone Case',
    price: 45.0,
    category: 'Accessories',
    images: [],
    tags: [],
  },
  {
    id: 'messenger-bag',
    name: 'Messenger Bag',
    price: 195.0,
    category: 'Bags',
    images: [],
    tags: [],
  },
  {
    id: 'keychain',
    name: 'Keychain',
    price: 25.0,
    category: 'Accessories',
    images: [],
    tags: [],
  },
  {
    id: 'weekend-bag',
    name: 'Weekend Bag',
    price: 350.0,
    category: 'Bags',
    images: [],
    tags: [],
  },
  {
    id: 'tablet-cover',
    name: 'Tablet Cover',
    price: 75.0,
    category: 'Accessories',
    images: [],
    tags: [],
  },
];

const containerVariants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.05
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  show: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

// Product Card Component
const ProductCard: React.FC<{
  product: Product;
  onClick: () => void;
  index: number;
}> = ({ product, onClick, index }) => {
  return (
    <motion.div
      variants={itemVariants}
      className="flex flex-col gap-2"
    >
      <motion.button
        onClick={onClick}
        className="group relative w-full aspect-square bg-cream border border-charcoal hover:border-charcoal transition-all duration-300 overflow-hidden rounded-[12px]"
      >
        {/* Background Image */}
        {product.images.length > 0 && product.images[0] ? (
          <div 
            className="absolute inset-0 z-0 transition-all duration-500 group-hover:scale-110"
            style={{
              backgroundImage: `url(${product.images[0]})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
        ) : (
          <div className="absolute inset-0 bg-desk flex items-center justify-center">
            <span className="font-mono text-[10px] uppercase tracking-widest text-charcoal/60">
              {product.name.charAt(0)}
            </span>
          </div>
        )}
        
        {/* Status badge */}
        <div className="absolute top-3 right-3 z-10">
          <div className={`px-1.5 py-0.5 border bg-cream ${
            product.status === 'active' 
              ? 'border-charcoal text-charcoal' 
              : 'border-charcoal/40 text-charcoal/40'
          } font-mono text-[8px] sm:text-[9px] uppercase tracking-widest`}>
            {product.status}
          </div>
        </div>

        {/* Hover visual */}
        <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
          <div className="bg-cream p-1.5 rounded-full border border-charcoal">
            <ArrowRight size={12} />
          </div>
        </div>
      </motion.button>
      
      {/* Product Info Below Card */}
      <div className="space-y-1">
        <h3 className="font-serif text-sm sm:text-base italic text-charcoal leading-tight">
          {product.name}
        </h3>
        <div className="flex gap-3 font-mono text-[8px] uppercase tracking-widest text-charcoal/50">
          <span>£{product.price.toFixed(2)}</span>
          <span>•</span>
          <span>{product.category}</span>
        </div>
      </div>
    </motion.div>
  );
};

interface ProductSelectionScreenProps {
  onNext: () => void;
  onBack?: () => void;
}

const ProductSelectionScreen: React.FC<ProductSelectionScreenProps> = ({ onNext, onBack }) => {
  const { selectedProduct, setProduct, setScreen } = useCanvasStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'draft' | 'not-setup'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isSyncing, setIsSyncing] = useState(false);
  const [shopifyStatus, setShopifyStatus] = useState<
    'idle' | 'loading' | 'connected' | 'unauthorized' | 'error'
  >('idle');
  const [showStatusFilters, setShowStatusFilters] = useState(false);
  const [showCategoryFilters, setShowCategoryFilters] = useState(false);

  // Load products on mount
  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setShopifyStatus('loading');
    setIsSyncing(true);
    try {
      const response = await fetch('/api/shopify/products');
      if (response.status === 401) {
        setShopifyStatus('unauthorized');
        // Use seed data as fallback - this is expected, not an error
        setProducts(
          seedProducts.map((p) => ({ ...p, status: 'not-setup' as const }))
        );
        return;
      }
      if (!response.ok) {
        setShopifyStatus('error');
        // Use seed data as fallback
        setProducts(
          seedProducts.map((p) => ({ ...p, status: 'not-setup' as const }))
        );
        return;
      }
      const data = await response.json();
      if (Array.isArray(data.products) && data.products.length > 0) {
        setProducts(data.products);
      } else {
        // Use seed data as fallback
        setProducts(
          seedProducts.map((p) => ({ ...p, status: 'not-setup' as const }))
        );
      }
      setShopifyStatus('connected');
    } catch (error) {
      // Silently handle network errors - use seed data as fallback
      setShopifyStatus('unauthorized');
      setProducts(seedProducts.map((p) => ({ ...p, status: 'not-setup' as const })));
    } finally {
      setIsSyncing(false);
    }
  };

  const categories = useMemo(() => {
    const unique = Array.from(new Set(products.map((product) => product.category)));
    return ['all', ...unique];
  }, [products]);

  const filteredProducts = useMemo(() => {
    const normalizedQuery = searchTerm.trim().toLowerCase();
    return products.filter((product) => {
      const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
      const matchesSearch =
        normalizedQuery.length === 0 || product.name.toLowerCase().includes(normalizedQuery);
      const matchesStatus = statusFilter === 'all' || product.status === statusFilter;
      return matchesCategory && matchesSearch && matchesStatus;
    });
  }, [products, searchTerm, categoryFilter, statusFilter]);

  const handleProductSelect = (product: Product) => {
    setProduct(product);
    setScreen('assets');
    onNext();
  };

  const handleSync = () => {
    loadProducts();
  };

  return (
    <StandardLayout
      header={{
        title: 'Select Product',
        showBack: !!onBack,
        onBack: onBack,
      }}
      footer={{
        leftContent: (
          <>
            <FooterInfoItem label="SYNCED" value={`${products.length} Products`} />
            {filteredProducts.length < products.length && (
              <FooterInfoItem label="SHOWING" value={`${filteredProducts.length} Filtered`} />
            )}
            <FooterInfoItem 
              label="STATUS" 
              value={
                shopifyStatus === 'loading' ? 'Loading...' :
                shopifyStatus === 'connected' ? 'Connected' :
                shopifyStatus === 'unauthorized' ? 'Not connected' :
                shopifyStatus === 'error' ? 'Error' :
                'Demo data'
              }
              valueClassName={
                shopifyStatus === 'connected' ? 'text-green' :
                shopifyStatus === 'error' ? 'text-accent' :
                shopifyStatus === 'unauthorized' ? 'text-yellow' :
                undefined
              }
            />
          </>
        ),
        rightContent: (
          <StandardButton
            onClick={handleSync}
            disabled={isSyncing}
          >
            <RefreshCw size={10} className={isSyncing ? "animate-spin" : ""} />
            <span>{isSyncing ? 'Syncing...' : 'Sync with Shopify'}</span>
          </StandardButton>
        ),
      }}
      stickyContent={
        <>
          <div className="mb-2.5 text-left">
            <p className="text-mono-body text-charcoal">
              Products synced from your Shopify store. Select one to configure 3D customization.
            </p>
          </div>
          {/* Search and Filters */}
          <div className="mt-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3 sm:gap-4">
            {/* Search Input */}
            <div className="flex-1 md:flex-none md:w-auto relative group">
              <Search
                size={12}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal/40 group-hover:text-charcoal transition-colors"
              />
              <input
                type="text"
                placeholder="SEARCH PRODUCTS..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full md:w-auto md:min-w-[300px] bg-cream border border-charcoal/20 px-3 pl-9 py-2 font-mono text-[9px] uppercase tracking-widest text-charcoal placeholder:text-charcoal/30 focus:outline-none focus:border-charcoal transition-all rounded-none"
              />
            </div>

            {/* Filters */}
            <div className="flex gap-2 justify-start md:justify-end">
              {/* Category Filter */}
              <div className="relative">
                <button
                  onClick={() => setShowCategoryFilters(!showCategoryFilters)}
                  className={`h-full px-3 py-2 border ${
                    showCategoryFilters
                      ? 'bg-charcoal text-cream border-charcoal'
                      : 'bg-cream border-charcoal/20 text-charcoal hover:border-charcoal'
                  } font-mono text-[9px] uppercase tracking-widest flex items-center gap-2 transition-all whitespace-nowrap min-w-[100px] justify-between`}
                >
                  <span>{categoryFilter === 'all' ? 'Category' : categoryFilter}</span>
                  <ChevronDown size={10} className={`transition-transform ${showCategoryFilters ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {showCategoryFilters && (
                    <motion.div
                      initial={{ y: 10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: 10, opacity: 0 }}
                      className="absolute top-full right-0 mt-2 bg-cream border border-charcoal shadow-xl z-30 min-w-[140px]"
                    >
                      {categories.map((category) => (
                  <button
                          key={category}
                          onClick={() => {
                            setCategoryFilter(category);
                            setShowCategoryFilters(false);
                          }}
                          className="w-full text-left px-3 py-2 font-mono text-[9px] uppercase tracking-widest hover:bg-charcoal hover:text-cream transition-colors border-b last:border-0 border-charcoal/10 flex justify-between"
                        >
                          {category}
                          {categoryFilter === category && <span className="text-accent">●</span>}
                  </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Status Filter */}
              <div className="relative">
                <button
                  onClick={() => setShowStatusFilters(!showStatusFilters)}
                  className={`h-full px-3 py-2 border ${
                    showStatusFilters
                      ? 'bg-charcoal text-cream border-charcoal'
                      : 'bg-cream border-charcoal/20 text-charcoal hover:border-charcoal'
                  } font-mono text-[9px] uppercase tracking-widest flex items-center gap-2 transition-all whitespace-nowrap min-w-[100px] justify-between`}
                >
                  <span>{statusFilter === 'all' ? 'Status' : statusFilter}</span>
                  <ChevronDown size={10} className={`transition-transform ${showStatusFilters ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {showStatusFilters && (
                    <motion.div
                      initial={{ y: 10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: 10, opacity: 0 }}
                      className="absolute top-full right-0 mt-2 bg-cream border border-charcoal shadow-xl z-30 min-w-[140px]"
                    >
                      {['all', 'active', 'draft', 'not-setup'].map((status) => (
                        <button
                          key={status}
                          onClick={() => {
                            setStatusFilter(status as any);
                            setShowStatusFilters(false);
                          }}
                          className="w-full text-left px-3 py-2 font-mono text-[9px] uppercase tracking-widest hover:bg-charcoal hover:text-cream transition-colors border-b last:border-0 border-charcoal/10 flex justify-between"
                        >
                          {status}
                          {statusFilter === status && <span className="text-accent">●</span>}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </>
      }
    >
      {/* Products Grid */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 lg:gap-5"
      >
        {filteredProducts.map((product, idx) => (
          <ProductCard
            key={product.id}
            product={product}
            index={idx}
            onClick={() => handleProductSelect(product)}
          />
        ))}
      </motion.div>
      
      {/* Empty State */}
      {filteredProducts.length === 0 && (
        <div className="w-full h-64 flex flex-col items-center justify-center">
          <Search size={32} className="mb-4 text-charcoal/40" />
          <span className="font-mono text-[10px] uppercase tracking-widest mb-2 text-charcoal/60">No products found</span>
          <span className="font-mono text-[9px] uppercase tracking-widest text-charcoal/40">
            {searchTerm || statusFilter !== 'all' || categoryFilter !== 'all' 
              ? 'Try adjusting your filters' 
              : 'Click Sync to fetch from Shopify'}
          </span>
        </div>
      )}
    </StandardLayout>
  );
};

export default ProductSelectionScreen;
