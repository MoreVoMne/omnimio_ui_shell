import React, { useMemo, useState } from 'react';

type WizardStep = 0 | 1 | 2 | 3;
type PurchaseMode = 'individual' | 'kit' | 'batch';
type VariantMode = 'all_same' | 'per_variant';

interface MerchantWizardShellProps {
  onExit: () => void;
}

const steps = [
  { id: 0, label: 'Select Product', hint: 'Bind a Shopify product' },
  { id: 1, label: 'Capabilities', hint: 'Define what can change' },
  { id: 2, label: 'Assets (if needed)', hint: 'Validate the model' },
  { id: 3, label: 'Name Parts', hint: 'Map meshes to parts' },
] as const;

type ProductItem = {
  id: string;
  title: string;
  price: string;
  category: string;
  variants: number;
  hasCustomization: boolean;
  tags?: string[];
  image?: string | null;
  variantOptions?: { id: string; title: string; sku?: string | null }[];
};

const seedProducts: ProductItem[] = [
  {
    id: 'aurora-tote',
    title: 'Aurora Tote',
    price: '320.00',
    category: 'Bags',
    variants: 3,
    hasCustomization: false,
    variantOptions: [
      { id: 'aurora-black', title: 'Black' },
      { id: 'aurora-tan', title: 'Tan' },
      { id: 'aurora-navy', title: 'Navy' },
    ],
  },
  {
    id: 'mini-crossbody',
    title: 'Mini Crossbody',
    price: '180.00',
    category: 'Bags',
    variants: 2,
    hasCustomization: true,
    variantOptions: [
      { id: 'mini-crossbody-black', title: 'Black' },
      { id: 'mini-crossbody-tan', title: 'Tan' },
    ],
  },
  { id: 'laptop-sleeve', title: 'Laptop Sleeve', price: '140.00', category: 'Accessories', variants: 0, hasCustomization: false },
  {
    id: 'atlas-backpack',
    title: 'Atlas Backpack',
    price: '420.00',
    category: 'Bags',
    variants: 4,
    hasCustomization: false,
    variantOptions: [
      { id: 'atlas-black', title: 'Black' },
      { id: 'atlas-olive', title: 'Olive' },
      { id: 'atlas-sand', title: 'Sand' },
      { id: 'atlas-charcoal', title: 'Charcoal' },
    ],
  },
];

const capabilityGroups = [
  {
    id: 'row-1',
    title: 'Product Structure',
    items: [
      { id: 'shape', label: 'Shape / Form' },
      { id: 'size', label: 'Size Presets' },
      { id: 'measurements', label: 'Custom Dimensions' },
      { id: 'kit', label: 'Kit / Bundle' },
    ],
  },
  {
    id: 'row-2',
    title: 'Materials & Appearance',
    items: [
      { id: 'material', label: 'Material' },
      { id: 'color', label: 'Color' },
      { id: 'finish', label: 'Finish / Coating' },
    ],
  },
  {
    id: 'row-3',
    title: 'Parts & Components',
    items: [
      { id: 'variants', label: 'Part Variants' },
      { id: 'swap', label: 'Swap Parts' },
      { id: 'addons', label: 'Add Components' },
    ],
  },
  {
    id: 'row-4',
    title: 'Surface Customization',
    items: [
      { id: 'image', label: 'Image' },
      { id: 'text', label: 'Text / Monogram' },
      { id: 'engrave', label: 'Engraving' },
      { id: 'emboss', label: 'Emboss / Deboss' },
      { id: 'hotstamp', label: 'Hot Stamp' },
    ],
  },
  {
    id: 'row-5',
    title: 'Order & Service',
    items: [
      { id: 'batch', label: 'Batch Ordering' },
      { id: 'packaging', label: 'Packaging' },
      { id: 'delivery', label: 'Delivery / Setup' },
    ],
  },
] as const;

const meshSeeds = [
  { id: 'mesh-body', mesh: 'Body_Shell', defaultName: 'Body', role: 'main' },
  { id: 'mesh-lining', mesh: 'Lining', defaultName: 'Lining', role: 'main' },
  { id: 'mesh-strap', mesh: 'Strap_Long', defaultName: 'Strap', role: 'swappable' },
  { id: 'mesh-handle', mesh: 'Handle_Top', defaultName: 'Handle', role: 'swappable' },
  { id: 'mesh-hardware', mesh: 'Hardware', defaultName: 'Hardware', role: 'decorative' },
] as const;

const partRoles = ['main', 'swappable', 'optional', 'decorative'] as const;
type MeshStateItem = (typeof meshSeeds)[number] & { name: string };
const buildDefaultMeshState = (): MeshStateItem[] =>
  meshSeeds.map((mesh) => ({ ...mesh, name: mesh.defaultName }));

type WizardDraft = {
  step?: WizardStep;
  purchaseMode: PurchaseMode;
  variantMode: VariantMode;
  capabilityState: Record<string, boolean>;
  meshState: MeshStateItem[];
  variantId?: string | null;
};

const MerchantWizardShell: React.FC<MerchantWizardShellProps> = ({ onExit }) => {
  const [step, setStep] = useState<WizardStep>(0);
  const [products, setProducts] = useState(seedProducts);
  const [selectedProductId, setSelectedProductId] = useState(seedProducts[0]?.id ?? '');
  const [purchaseMode, setPurchaseMode] = useState<PurchaseMode>('individual');
  const [variantMode, setVariantMode] = useState<VariantMode>('all_same');
  const [activeVariantId, setActiveVariantId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showExistingModal, setShowExistingModal] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [showVariantModal, setShowVariantModal] = useState(false);
  const [showVariantPicker, setShowVariantPicker] = useState(false);
  const [showAddCapabilityModal, setShowAddCapabilityModal] = useState(false);
  const [shopifyStatus, setShopifyStatus] = useState<'idle' | 'loading' | 'connected' | 'unauthorized' | 'error'>('idle');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [pendingDraft, setPendingDraft] = useState<WizardDraft | null>(null);
  const [draftLoadedKey, setDraftLoadedKey] = useState<string | null>(null);
  const [didInitDraft, setDidInitDraft] = useState(false);
  const [capabilityState, setCapabilityState] = useState<Record<string, boolean>>({});
  const [meshState, setMeshState] = useState<MeshStateItem[]>(buildDefaultMeshState());

  const selectedProduct = products.find((item) => item.id === selectedProductId);
  const hasVariants = (selectedProduct?.variants ?? 0) > 1;
  const variantOptions = selectedProduct?.variantOptions ?? [];
  const activeVariant = variantOptions.find((variant) => variant.id === activeVariantId) ?? null;
  const categories = useMemo(() => {
    const unique = Array.from(new Set(products.map((product) => product.category)));
    return ['all', ...unique];
  }, [products]);
  const filteredProducts = useMemo(() => {
    const normalizedQuery = searchTerm.trim().toLowerCase();
    return products.filter((product) => {
      const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
      const matchesSearch =
        normalizedQuery.length === 0 || product.title.toLowerCase().includes(normalizedQuery);
      return matchesCategory && matchesSearch;
    });
  }, [products, searchTerm, selectedCategory]);
  const selectedCapabilities = useMemo(() => {
    const selected = new Set(Object.keys(capabilityState).filter((key) => capabilityState[key]));
    return capabilityGroups.flatMap((group) =>
      group.items.filter((item) => selected.has(item.id)).map((item) => item.label)
    );
  }, [capabilityState]);

  const progressPercent = ((step + 1) / steps.length) * 100;

  const toggleCapability = (id: string) => {
    setCapabilityState((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const getDraftKey = (productId: string, variantId?: string | null) =>
    variantId ? `${productId}::${variantId}` : productId;

  const activeDraftKey = selectedProductId
    ? variantMode === 'per_variant'
      ? activeVariantId
        ? getDraftKey(selectedProductId, activeVariantId)
        : null
      : getDraftKey(selectedProductId, null)
    : null;
  const showDraftNotice = Boolean(activeDraftKey && draftLoadedKey === activeDraftKey);

  const clampStep = (value: number): WizardStep => {
    if (value <= 0) return 0;
    if (value >= steps.length - 1) return (steps.length - 1) as WizardStep;
    return value as WizardStep;
  };

  const resetDraft = () => {
    setStep(0);
    setPurchaseMode('individual');
    setVariantMode('all_same');
    setActiveVariantId(null);
    setCapabilityState({});
    setMeshState(buildDefaultMeshState());
    setDraftLoadedKey(null);
    setPendingDraft(null);
  };

  const applyDraft = (draft: WizardDraft) => {
    if (typeof draft.step === 'number') {
      setStep(clampStep(draft.step));
    }
    setPurchaseMode(draft.purchaseMode ?? 'individual');
    setVariantMode(draft.variantMode ?? 'all_same');
    if (draft.variantId) {
      setActiveVariantId(draft.variantId);
    }
    setCapabilityState(draft.capabilityState ?? {});
    setMeshState(draft.meshState && draft.meshState.length ? draft.meshState : buildDefaultMeshState());
  };

  const saveDraft = async () => {
    if (!selectedProductId) return;
    if (variantMode === 'per_variant' && !activeVariantId) {
      setSaveStatus('error');
      setShowVariantPicker(true);
      return;
    }
    setSaveStatus('saving');
    try {
      const response = await fetch('/api/wizard/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: selectedProductId,
          variant_id: variantMode === 'per_variant' ? activeVariantId : null,
          draft: {
            step,
            purchaseMode,
            variantMode,
            variantId: variantMode === 'per_variant' ? activeVariantId : null,
            capabilityState,
            meshState,
          },
        }),
      });
      if (!response.ok) {
        setSaveStatus('error');
        return;
      }
      setDraftLoadedKey(getDraftKey(selectedProductId, variantMode === 'per_variant' ? activeVariantId : null));
      setProducts((prev) =>
        prev.map((product) =>
          product.id === selectedProductId ? { ...product, hasCustomization: true } : product
        )
      );
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 1500);
    } catch (error) {
      setSaveStatus('error');
    }
  };

  const deleteDraft = async (productId: string, variantId?: string | null) => {
    if (!productId) return;
    try {
      const params = new URLSearchParams({ product_id: productId });
      if (variantId) {
        params.set('variant_id', variantId);
      }
      await fetch(`/api/wizard/draft?${params.toString()}`, {
        method: 'DELETE',
      });
      setProducts((prev) =>
        prev.map((product) =>
          product.id === productId ? { ...product, hasCustomization: false } : product
        )
      );
      const keyToClear = getDraftKey(productId, variantId);
      if (draftLoadedKey === keyToClear) {
        setDraftLoadedKey(null);
      }
    } catch (error) {
      // Ignore delete errors in dev.
    }
  };

  const loadDraft = async (
    productId: string,
    promptIfExists: boolean,
    variantId?: string | null,
    promptPurchase = false
  ) => {
    if (!productId) return;
    try {
      const params = new URLSearchParams({ product_id: productId });
      if (variantId) {
        params.set('variant_id', variantId);
      }
      const response = await fetch(`/api/wizard/draft?${params.toString()}`);
      if (response.status === 404) {
        if (promptPurchase) {
          setShowPurchaseModal(true);
        }
        return;
      }
      if (!response.ok) {
        return;
      }
      const data = await response.json();
      if (!data.draft) return;
      setProducts((prev) =>
        prev.map((product) =>
          product.id === productId ? { ...product, hasCustomization: true } : product
        )
      );
      if (promptIfExists) {
        setPendingDraft(data.draft);
        setShowExistingModal(true);
        return;
      }
      applyDraft(data.draft);
      setDraftLoadedKey(getDraftKey(productId, variantId));
    } catch (error) {
      // Ignore draft load errors in dev.
    }
  };

  const loadProducts = async () => {
    setShopifyStatus('loading');
    try {
      const response = await fetch('/api/shopify/products');
      if (response.status === 401) {
        setShopifyStatus('unauthorized');
        return;
      }
      if (!response.ok) {
        setShopifyStatus('error');
        return;
      }
      const data = await response.json();
      if (Array.isArray(data.products) && data.products.length > 0) {
        setProducts(data.products);
      }
      setShopifyStatus('connected');
      void loadDraftIndex();
    } catch (error) {
      setShopifyStatus('error');
    }
  };

  const loadDraftIndex = async () => {
    try {
      const response = await fetch('/api/wizard/drafts');
      if (!response.ok) return;
      const data = await response.json();
      const entries = Array.isArray(data.drafts) ? data.drafts : [];
      const ids = entries
        .map((entry: { product_id?: string }) => entry.product_id)
        .filter((value: string | undefined): value is string => Boolean(value));
      setProducts((prev) =>
        prev.map((product) => ({
          ...product,
          hasCustomization: ids.includes(product.id),
        }))
      );
    } catch (error) {
      // Ignore draft index errors in dev.
    }
  };

  React.useEffect(() => {
    loadProducts();
  }, []);

  React.useEffect(() => {
    if (!products.length) return;
    if (!products.some((product) => product.id === selectedProductId)) {
      setSelectedProductId(products[0].id);
    }
  }, [products, selectedProductId]);

  React.useEffect(() => {
    if (!selectedProductId || didInitDraft) return;
    void loadDraft(selectedProductId, false);
    setDidInitDraft(true);
  }, [selectedProductId, didInitDraft]);

  const updateMeshName = (id: string, name: string) => {
    setMeshState((prev) => prev.map((mesh) => (mesh.id === id ? { ...mesh, name } : mesh)));
  };

  const updateMeshRole = (id: string, role: typeof partRoles[number]) => {
    setMeshState((prev) => prev.map((mesh) => (mesh.id === id ? { ...mesh, role } : mesh)));
  };

  const handleProductSelect = (productId: string) => {
    if (productId === selectedProductId) return;
    setSelectedProductId(productId);
    resetDraft();
    setShowExistingModal(false);
    setShowPurchaseModal(false);
    setShowVariantModal(false);
    void loadDraft(productId, true, null, true);
  };

  const handlePurchaseModeSelect = (mode: PurchaseMode) => {
    setPurchaseMode(mode);
    setShowPurchaseModal(false);
    if (hasVariants) {
      setShowVariantModal(true);
    }
  };

  const handleVariantModeSelect = (mode: VariantMode) => {
    setVariantMode(mode);
    setShowVariantModal(false);
    if (mode === 'per_variant') {
      setShowVariantPicker(true);
    } else {
      setActiveVariantId(null);
    }
  };

  const handleVariantPick = (variantId: string) => {
    setActiveVariantId(variantId);
    setShowVariantPicker(false);
    void loadDraft(selectedProductId, true, variantId, false);
  };

  const handleStartFromScratch = async () => {
    setDraftLoadedKey(null);
    setPendingDraft(null);
    setShowExistingModal(false);
    await deleteDraft(selectedProductId, variantMode === 'per_variant' ? activeVariantId : null);
    resetDraft();
    setShowPurchaseModal(true);
  };

  const handleEditExisting = () => {
    if (pendingDraft) {
      applyDraft(pendingDraft);
      setDraftLoadedKey(
        getDraftKey(
          selectedProductId,
          pendingDraft.variantId ?? (variantMode === 'per_variant' ? activeVariantId : null)
        )
      );
    }
    setPendingDraft(null);
    setShowExistingModal(false);
  };

  const renderNotices = () => {
    if (!showDraftNotice && saveStatus === 'idle') return null;
    return (
      <div className="mb-4 space-y-2">
        {saveStatus === 'saving' && (
          <div className="font-mono text-[10px] uppercase tracking-widest text-charcoal/60">
            Saving draft...
          </div>
        )}
        {saveStatus === 'saved' && (
          <div className="font-mono text-[10px] uppercase tracking-widest text-charcoal/60">
            Draft saved
          </div>
        )}
        {saveStatus === 'error' && (
          <div className="font-mono text-[10px] uppercase tracking-widest text-accent">
            Save failed
          </div>
        )}
        {showDraftNotice && (
          <div className="flex items-center justify-between gap-3 border border-charcoal/20 rounded-[12px] px-3 py-2 bg-cream/60">
            <span className="font-mono text-[10px] uppercase tracking-widest text-charcoal/70">
              Draft loaded
            </span>
            <button
              onClick={handleStartFromScratch}
              className="font-mono text-[10px] uppercase tracking-widest underline underline-offset-4"
            >
              Start over
            </button>
          </div>
        )}
      </div>
    );
  };

  const goNext = () => {
    setStep((current) => (current < steps.length - 1 ? ((current + 1) as WizardStep) : current));
  };

  const goBack = () => {
    setStep((current) => (current > 0 ? ((current - 1) as WizardStep) : current));
  };

  const renderStagePanel = () => {
    if (step === 2) {
      return (
        <div className="h-full p-6 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <p className="font-mono text-[10px] uppercase tracking-[0.3em]">3D Upload</p>
            <span className="font-mono text-[10px] uppercase tracking-[0.2em]">Step {step + 1} of {steps.length}</span>
          </div>
          <div className="flex-1 border-2 border-dashed border-charcoal rounded-[24px] bg-cream/80 p-6 flex flex-col items-center justify-center text-center">
            <p className="font-serif text-2xl">Drop your GLB here</p>
            <p className="mt-3 font-mono text-[10px] uppercase tracking-wide text-charcoal/70">
              Recommended: GLB or GLTF, under 100MB
            </p>
            <button className="mt-6 border border-charcoal px-4 py-2 font-mono text-[10px] uppercase tracking-widest hover:bg-charcoal hover:text-cream transition-colors">
              Browse Files
            </button>
          </div>
          <div className="border border-charcoal rounded-[16px] bg-cream p-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em]">Auto Checks</p>
            <ul className="mt-3 space-y-2 font-mono text-xs uppercase tracking-wide text-charcoal/70">
              <li>UV required only on customizable parts</li>
              <li>Overlaps allowed but flagged</li>
              <li>Draco + KTX2 generated automatically</li>
            </ul>
          </div>
        </div>
      );
    }

    if (step === 3) {
      return (
        <div className="h-full p-6 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <p className="font-mono text-[10px] uppercase tracking-[0.3em]">3D Viewer</p>
            <span className="font-mono text-[10px] uppercase tracking-[0.2em]">Click mesh to highlight</span>
          </div>
          <div className="flex-1 border border-charcoal rounded-[28px] bg-cream/70 flex items-center justify-center">
            <div className="text-center">
              <p className="font-serif text-2xl">Interactive Model</p>
              <p className="mt-2 font-mono text-[10px] uppercase tracking-widest text-charcoal/70">Mesh highlights will sync here</p>
            </div>
          </div>
          <div className="border border-charcoal rounded-[16px] bg-cream p-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em]">Tips</p>
            <p className="mt-2 font-mono text-xs uppercase tracking-wide text-charcoal/70">
              Start with main structural parts. Decorative meshes can be skipped.
            </p>
          </div>
        </div>
      );
    }

    if (step === 1) {
      return (
        <div className="h-full p-6 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <p className="font-mono text-[10px] uppercase tracking-[0.3em]">Capability Map</p>
            <span className="font-mono text-[10px] uppercase tracking-[0.2em]">{selectedCapabilities.length} selected</span>
          </div>
          <div className="flex-1 border border-charcoal rounded-[28px] bg-cream/70 flex items-center justify-center">
            <div className="text-center">
              <p className="font-serif text-2xl">Live Sentence Preview</p>
              <p className="mt-2 font-mono text-[10px] uppercase tracking-widest text-charcoal/70">Tokens update from selections</p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="h-full p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em]">Selected Product</p>
          <span className="font-mono text-[10px] uppercase tracking-[0.2em]">Shopify bind</span>
        </div>
        <div className="flex-1 bg-cream/60 p-6 flex flex-col gap-4">
          <div className="w-full max-w-[280px] sm:max-w-[360px] lg:max-w-[420px] aspect-square rounded-[18px] border border-charcoal/40 bg-desk overflow-hidden flex items-center justify-center mx-auto">
            {selectedProduct?.image ? (
              <img
                src={selectedProduct.image}
                alt={selectedProduct.title}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="font-mono text-[10px] uppercase tracking-widest text-charcoal/70">
                Image Placeholder
              </span>
            )}
          </div>
          <div className="mt-2">
            <p className="font-serif text-2xl">{selectedProduct?.title ?? 'Select a product'}</p>
            <p className="mt-2 font-mono text-[10px] uppercase tracking-widest text-charcoal/70">
              {selectedProduct?.category ?? 'Category'} {selectedProduct ? `• $${selectedProduct.price}` : ''}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {(selectedProduct?.variants ?? 0) > 1 && (
              <span className="inline-flex items-center border border-charcoal/50 px-3 py-1 font-mono text-[10px] uppercase tracking-widest">
                {selectedProduct?.variants} variants
              </span>
            )}
            {selectedProduct?.hasCustomization && (
              <span className="inline-flex items-center border border-charcoal/50 px-3 py-1 font-mono text-[10px] uppercase tracking-widest">
                Draft
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderStepPanel = () => {
    if (step === 0) {
      return (
        <div className="space-y-6">
          {renderNotices()}
          <div>
            <h2 className="font-serif text-2xl">Select a product</h2>
            <p className="mt-2 font-mono text-[10px] uppercase tracking-widest text-charcoal/70">
              Search or filter by category.
            </p>
          </div>
          <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-widest text-charcoal/60">
            <span>
              {shopifyStatus === 'loading' && 'Loading Shopify products'}
              {shopifyStatus === 'connected' && 'Shopify connected'}
              {shopifyStatus === 'unauthorized' && 'Shopify not connected'}
              {shopifyStatus === 'error' && 'Shopify error'}
              {shopifyStatus === 'idle' && 'Using demo data'}
            </span>
            <div className="flex items-center gap-3">
              {(shopifyStatus === 'unauthorized' || shopifyStatus === 'error') && (
                <button
                  onClick={() => window.open('/api/shopify/auth', '_blank')}
                  className="underline underline-offset-4"
                >
                  Connect Shopify
                </button>
              )}
              {shopifyStatus === 'connected' && (
                <button
                  onClick={() => loadProducts()}
                  className="underline underline-offset-4"
                >
                  Reload
                </button>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="w-full border border-charcoal rounded-full px-4 py-2 font-mono text-xs uppercase tracking-widest bg-cream"
              placeholder="Search products..."
            />
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`border border-charcoal px-3 py-1 rounded-full font-mono text-[10px] uppercase tracking-widest transition-colors ${
                    selectedCategory === category ? 'bg-charcoal text-cream' : 'bg-cream hover:bg-desk'
                  }`}
                >
                  {category === 'all' ? 'All' : category}
                </button>
              ))}
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {filteredProducts.length === 0 ? (
              <div className="p-6 text-center font-mono text-[10px] uppercase tracking-widest text-charcoal/60">
                No products found
              </div>
            ) : (
              <div className="sm:col-span-2 divide-y divide-charcoal/20">
                {filteredProducts.map((product) => {
                  const isSelected = selectedProductId === product.id;
                  return (
                    <button
                      key={product.id}
                      onClick={() => handleProductSelect(product.id)}
                      className={`w-full text-left px-2 sm:px-3 py-3 flex items-center justify-between gap-3 transition-colors ${
                        isSelected ? 'bg-desk' : 'hover:bg-desk/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                      <div className="h-11 w-11 rounded-[12px] border border-charcoal/40 bg-desk overflow-hidden flex items-center justify-center">
                        {product.image ? (
                          <img
                            src={product.image}
                            alt={product.title}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="font-mono text-[10px] uppercase tracking-widest text-charcoal/60">
                            Img
                          </span>
                        )}
                      </div>
                        <div>
                          <p className="font-serif text-lg leading-tight">{product.title}</p>
                          <p className="font-mono text-[10px] uppercase tracking-widest text-charcoal/60">
                            ${product.price} • {product.category}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {product.variants > 1 && (
                          <span className="border border-charcoal/40 px-2 py-1 font-mono text-[10px] uppercase tracking-widest">
                            {product.variants} variants
                          </span>
                        )}
                        {product.hasCustomization && (
                          <span className="border border-charcoal/40 px-2 py-1 font-mono text-[10px] uppercase tracking-widest">
                            Draft
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          <div className="border-t border-charcoal/20 pt-4 flex flex-col gap-4">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em]">Purchase Mode</p>
              <button
                onClick={() => setShowPurchaseModal(true)}
                className="mt-2 w-full flex items-center justify-between font-mono text-[10px] uppercase tracking-widest text-charcoal/70"
              >
                <span>
                  {purchaseMode === 'individual'
                    ? 'Individual item'
                    : purchaseMode === 'kit'
                    ? 'Product set / kit'
                    : 'Batch order'}
                </span>
                <span className="underline underline-offset-4">Change</span>
              </button>
            </div>
            {hasVariants && (
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.2em]">Variant Handling</p>
                <div className="mt-2 space-y-2">
                  <button
                    onClick={() => setShowVariantModal(true)}
                    className="w-full flex items-center justify-between font-mono text-[10px] uppercase tracking-widest text-charcoal/70"
                  >
                    <span>{variantMode === 'all_same' ? 'Same customization' : 'Per-variant setup'}</span>
                    <span className="underline underline-offset-4">Change</span>
                  </button>
                  {variantMode === 'per_variant' && (
                    <button
                      onClick={() => setShowVariantPicker(true)}
                      className="w-full flex items-center justify-between font-mono text-[10px] uppercase tracking-widest text-charcoal/70"
                    >
                      <span>{activeVariant?.title ?? 'Select variant'}</span>
                      <span className="underline underline-offset-4">Change</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }

    if (step === 1) {
      return (
        <div className="space-y-6">
          {renderNotices()}
          <div>
            <h2 className="font-serif text-2xl">What can your customers customize?</h2>
            <p className="mt-2 font-mono text-[10px] uppercase tracking-widest text-charcoal/70">
              Select all that apply. Each chip maps to a capability module.
            </p>
          </div>
          <div className="space-y-5">
            {capabilityGroups.map((group) => (
              <div key={group.id} className="border border-charcoal rounded-[18px] p-4">
                <div className="flex items-center justify-between">
                  <p className="font-mono text-[10px] uppercase tracking-[0.2em]">{group.title}</p>
                  <span className="font-mono text-[10px] uppercase tracking-widest text-charcoal/60">
                    {group.items.length} options
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {group.items.map((item) => {
                    const active = capabilityState[item.id];
                    return (
                      <button
                        key={item.id}
                        onClick={() => toggleCapability(item.id)}
                        className={`border border-charcoal px-3 py-2 rounded-full font-mono text-[10px] uppercase tracking-widest transition-colors ${
                          active ? 'bg-charcoal text-cream' : 'bg-cream hover:bg-desk'
                        }`}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          <div className="border border-charcoal rounded-[18px] p-4 flex items-center justify-between gap-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em]">Can’t find a feature?</p>
            <button
              onClick={() => setShowAddCapabilityModal(true)}
              className="border border-charcoal px-3 py-2 rounded-full font-mono text-[10px] uppercase tracking-widest hover:bg-charcoal hover:text-cream transition-colors"
            >
              + Add your own
            </button>
          </div>
        </div>
      );
    }

    if (step === 2) {
      return (
        <div className="space-y-6">
          {renderNotices()}
          <div>
            <h2 className="font-serif text-2xl">Upload your 3D model</h2>
            <p className="mt-2 font-mono text-[10px] uppercase tracking-widest text-charcoal/70">
              We validate UVs and optimize the model automatically.
            </p>
          </div>
          <div className="border border-charcoal rounded-[18px] p-4 space-y-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em]">Requirements</p>
            <ul className="space-y-2 font-mono text-xs uppercase tracking-widest text-charcoal/70">
              <li>GLB or GLTF recommended (OBJ and FBX accepted)</li>
              <li>UVs only required on parts that get surface customization</li>
              <li>Maximum file size 100MB</li>
            </ul>
          </div>
          <div className="border border-charcoal rounded-[18px] p-4 space-y-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em]">Validation Status</p>
            <ul className="space-y-2 font-mono text-xs uppercase tracking-widest text-charcoal/70">
              <li>Mesh count and naming check</li>
              <li>UV overlap detection (warning only)</li>
              <li>Auto optimization: Draco, KTX2, LOD</li>
            </ul>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {renderNotices()}
        <div>
          <h2 className="font-serif text-2xl">Name parts and assign roles</h2>
          <p className="mt-2 font-mono text-[10px] uppercase tracking-widest text-charcoal/70">
            Click a mesh in the viewer and give it a friendly name.
          </p>
        </div>
        <div className="space-y-4">
          {meshState.map((mesh) => (
            <div key={mesh.id} className="border border-charcoal rounded-[18px] p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="font-mono text-[10px] uppercase tracking-[0.2em]">{mesh.mesh}</p>
                <span className="font-mono text-[10px] uppercase tracking-widest text-charcoal/60">Mesh ID</span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  value={mesh.name}
                  onChange={(event) => updateMeshName(mesh.id, event.target.value)}
                  className="border border-charcoal rounded-full px-4 py-2 font-mono text-xs uppercase tracking-widest bg-cream"
                  placeholder="Part name"
                />
                <select
                  value={mesh.role}
                  onChange={(event) => updateMeshRole(mesh.id, event.target.value as typeof partRoles[number])}
                  className="border border-charcoal rounded-full px-4 py-2 font-mono text-xs uppercase tracking-widest bg-cream"
                >
                  {partRoles.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </div>
        <div className="border border-charcoal rounded-[18px] p-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em]">Next up</p>
          <p className="mt-2 font-mono text-xs uppercase tracking-widest text-charcoal/70">
            Zones, attachments, and capability mini-masters will build on these names.
          </p>
        </div>
      </div>
    );
  };

  const showStageOnMobile = step >= 2;

  return (
    <div className="min-h-screen w-full bg-cream text-charcoal flex items-center justify-center p-[3px] lg:p-[5px]">
      <div className="w-full border border-charcoal bg-cream relative overflow-hidden rounded-[20px] sm:rounded-[24px] md:rounded-[32px] flex flex-col h-[calc(100vh-6px)] lg:h-[calc(100vh-10px)]">
        <div className="border-b border-charcoal/60 px-4 sm:px-6 py-6 flex items-center justify-between gap-4">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-charcoal/60">Merchant Setup</p>
            <h1 className="mt-2 font-serif text-xl sm:text-2xl">Product Builder</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-mono text-[10px] uppercase tracking-widest text-charcoal/60">
              {saveStatus === 'saving' && 'Saving'}
              {saveStatus === 'saved' && 'Saved'}
              {saveStatus === 'error' && 'Save failed'}
            </span>
            <button
              aria-label="Save draft"
              title={
                saveStatus === 'saved'
                  ? 'Saved'
                  : saveStatus === 'saving'
                  ? 'Saving...'
                  : saveStatus === 'error'
                  ? 'Save failed'
                  : 'Save draft'
              }
              onClick={saveDraft}
              className="h-9 w-9 border border-charcoal/60 rounded-full flex items-center justify-center hover:bg-charcoal hover:text-cream transition-colors disabled:opacity-60"
              disabled={saveStatus === 'saving'}
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M5 5h11l3 3v11H5z" />
                <path d="M8 5v6h8V5" />
                <path d="M8 19v-6h8v6" />
              </svg>
            </button>
            <button
              aria-label="Exit wizard"
              title="Exit"
              onClick={onExit}
              className="h-9 w-9 border border-charcoal/60 rounded-full flex items-center justify-center hover:bg-charcoal hover:text-cream transition-colors"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M6 6l12 12" />
                <path d="M18 6l-12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="border-b border-charcoal/30 px-4 sm:px-6 py-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-3">
            <button
              onClick={goBack}
              className="border border-charcoal/60 px-3 py-1 rounded-full font-mono text-[10px] uppercase tracking-widest disabled:opacity-40"
              disabled={step === 0}
            >
              Back
            </button>
            <div className="font-mono text-[10px] uppercase tracking-widest text-charcoal/60">
              Step {step + 1} of {steps.length} • {steps[step].label}
            </div>
          </div>
          <div className="w-full sm:w-64 h-[2px] bg-charcoal/20">
            <div className="h-full bg-charcoal" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>

        <div className="flex-1 min-h-0 flex flex-col lg:flex-row">
          <div
            className={`order-2 lg:order-1 lg:w-1/2 border-t lg:border-t-0 lg:border-r border-charcoal/60 bg-cream lg:desk-grid ${
              showStageOnMobile ? 'block' : 'hidden'
            } lg:block`}
          >
            {renderStagePanel()}
          </div>
          <div className="order-1 lg:order-2 lg:w-1/2 flex flex-col min-h-0">
            <div className="flex-1 min-h-0 overflow-y-auto px-4 py-5 sm:px-6 sm:py-6">
              {renderStepPanel()}
            </div>
            <div className="border-t border-charcoal px-6 py-4 flex items-center justify-between sticky bottom-0 bg-cream">
              <button
                onClick={goBack}
                className="border border-charcoal px-4 py-2 rounded-full font-mono text-[10px] uppercase tracking-widest disabled:opacity-40"
                disabled={step === 0}
              >
                Back
              </button>
              <div className="font-mono text-[10px] uppercase tracking-widest text-charcoal/70">
                {steps[step].hint}
              </div>
              <button
                onClick={goNext}
                className="border border-charcoal px-4 py-2 rounded-full font-mono text-[10px] uppercase tracking-widest hover:bg-charcoal hover:text-cream transition-colors disabled:opacity-40"
                disabled={step === steps.length - 1}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {showPurchaseModal && (
        <div className="fixed inset-0 z-50 bg-charcoal/40 flex items-center justify-center p-6">
          <div className="w-full max-w-md bg-cream border border-charcoal p-6 rounded-[20px]">
            <p className="font-serif text-xl">How will customers buy this product?</p>
            <p className="mt-3 font-mono text-[10px] uppercase tracking-widest text-charcoal/70">
              Choose the purchase mode to configure pricing and rules.
            </p>
            <div className="mt-6 flex flex-col gap-2">
              {(['individual', 'kit', 'batch'] as PurchaseMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => handlePurchaseModeSelect(mode)}
                  className={`border border-charcoal px-3 py-2 rounded-full font-mono text-[10px] uppercase tracking-widest transition-colors ${
                    purchaseMode === mode ? 'bg-charcoal text-cream' : 'bg-cream hover:bg-desk'
                  }`}
                >
                  {mode === 'individual' ? 'Individual item' : mode === 'kit' ? 'Product set / kit' : 'Batch order'}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {showExistingModal && (
        <div className="fixed inset-0 z-50 bg-charcoal/40 flex items-center justify-center p-6">
          <div className="w-full max-w-md bg-cream border border-charcoal p-6 rounded-[20px]">
            <p className="font-serif text-xl">Continue setup?</p>
            <div className="mt-6 flex flex-wrap gap-2">
              <button
                onClick={handleEditExisting}
                className="border border-charcoal px-3 py-2 rounded-full font-mono text-[10px] uppercase tracking-widest hover:bg-charcoal hover:text-cream transition-colors"
              >
                Continue
              </button>
              <button
                onClick={handleStartFromScratch}
                className="border border-charcoal px-3 py-2 rounded-full font-mono text-[10px] uppercase tracking-widest hover:bg-charcoal hover:text-cream transition-colors"
              >
                Start from scratch
              </button>
            </div>
          </div>
        </div>
      )}

      {showVariantModal && (
        <div className="fixed inset-0 z-50 bg-charcoal/40 flex items-center justify-center p-6">
          <div className="w-full max-w-md bg-cream border border-charcoal p-6 rounded-[20px]">
            <p className="font-serif text-xl">Variants detected</p>
            <p className="mt-3 font-mono text-[10px] uppercase tracking-widest text-charcoal/70">
              How should customization apply to variants?
            </p>
            <div className="mt-6 flex flex-col gap-2">
              {(['all_same', 'per_variant'] as VariantMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => handleVariantModeSelect(mode)}
                  className={`border border-charcoal px-3 py-2 rounded-full font-mono text-[10px] uppercase tracking-widest transition-colors ${
                    variantMode === mode ? 'bg-charcoal text-cream' : 'bg-cream hover:bg-desk'
                  }`}
                >
                  {mode === 'all_same' ? 'Same customization for all variants' : 'Different customization per variant'}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {showVariantPicker && (
        <div className="fixed inset-0 z-50 bg-charcoal/40 flex items-center justify-center p-6">
          <div className="w-full max-w-md bg-cream border border-charcoal p-6 rounded-[20px]">
            <p className="font-serif text-xl">Select variant</p>
            <div className="mt-6 flex flex-col gap-2">
              {variantOptions.length > 0 ? (
                variantOptions.map((variant) => (
                  <button
                    key={variant.id}
                    onClick={() => handleVariantPick(variant.id)}
                    className={`border border-charcoal px-3 py-2 rounded-full font-mono text-[10px] uppercase tracking-widest transition-colors ${
                      activeVariantId === variant.id ? 'bg-charcoal text-cream' : 'bg-cream hover:bg-desk'
                    }`}
                  >
                    {variant.title}
                  </button>
                ))
              ) : (
                <p className="font-mono text-[10px] uppercase tracking-widest text-charcoal/70">
                  No variant data available.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {showAddCapabilityModal && (
        <div className="fixed inset-0 z-50 bg-charcoal/40 flex items-center justify-center p-6">
          <div className="w-full max-w-lg bg-cream border border-charcoal p-6 rounded-[20px] space-y-4">
            <p className="font-serif text-xl">We found this feature:</p>
            <div className="border border-charcoal rounded-[16px] p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="font-serif text-lg">Parametric sizing</p>
                <span className="font-mono text-[10px] uppercase tracking-widest text-charcoal/60">Locked</span>
              </div>
              <p className="font-mono text-[10px] uppercase tracking-widest text-charcoal/70">
                Customers enter custom dimensions. The product adjusts automatically with formulas you define.
              </p>
              <p className="font-mono text-[10px] uppercase tracking-widest text-charcoal/70">
                This capability is not included in your store
              </p>
              <p className="font-mono text-[10px] uppercase tracking-widest text-charcoal">
                Add Parametric Sizing: +£15/mo per product
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setShowAddCapabilityModal(false)}
                  className="border border-charcoal px-3 py-2 rounded-full font-mono text-[10px] uppercase tracking-widest hover:bg-charcoal hover:text-cream transition-colors"
                >
                  Add capability
                </button>
                <button
                  onClick={() => setShowAddCapabilityModal(false)}
                  className="border border-charcoal px-3 py-2 rounded-full font-mono text-[10px] uppercase tracking-widest hover:bg-charcoal hover:text-cream transition-colors"
                >
                  Learn more
                </button>
              </div>
            </div>
            <button
              onClick={() => setShowAddCapabilityModal(false)}
              className="font-mono text-[10px] uppercase tracking-widest underline underline-offset-4"
            >
              This isn’t what I meant — try again
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MerchantWizardShell;
