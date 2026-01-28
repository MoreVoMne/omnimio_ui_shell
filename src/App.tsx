import React from 'react';
import { useCanvasStore } from './stores/canvasStore';
import ProductSelectionScreen from './components/screens/ProductSelectionScreen';
import AssetUploadScreen from './components/screens/AssetUploadScreen';
import CapabilitySelectionScreen from './components/screens/CapabilitySelectionScreen';
import CanvasBuilderScreen from './components/canvas-builder/CanvasBuilderScreen';
import DemoCustomizerScreen from './components/screens/DemoCustomizerScreen';
import MerchantOnboarding from './components/MerchantOnboarding';
// Shopify-specific screens
import ThemeCheckScreen from './components/screens/ThemeCheckScreen';
import ActivationScreen from './components/screens/ActivationScreen';
import BillingScreen from './components/screens/BillingScreen';

const App: React.FC = () => {
  const { currentScreen, setScreen, selectedProduct } = useCanvasStore();
  const [showOnboarding, setShowOnboarding] = React.useState(true);

  // Show onboarding on first load if no product selected
  // Check if we should show onboarding (first time or explicitly requested)
  const shouldShowOnboarding = showOnboarding && !selectedProduct;

  if (shouldShowOnboarding) {
    return (
      <MerchantOnboarding
        onPathSelect={(path) => {
          if (path === 'model-ready') {
            // Hide onboarding and go to theme check first (Shopify flow)
            setShowOnboarding(false);
            setScreen('theme-check');
          } else if (path === 'demo') {
            // Show full customizer demo
            setShowOnboarding(false);
            setScreen('demo');
          } else if (path === 'tour') {
            // Show quick tour
            setShowOnboarding(false);
            setScreen('tour');
          }
        }}
        onSkip={() => {
          setShowOnboarding(false);
          setScreen('theme-check');
        }}
      />
    );
  }

  // Render screens based on current screen state
  switch (currentScreen) {
    // Shopify: Theme Check (first step after landing)
    case 'theme-check':
      return (
        <ThemeCheckScreen
          onNext={() => setScreen('product')}
          onBack={() => setShowOnboarding(true)}
        />
      );
    case 'product':
      return (
        <ProductSelectionScreen
          onNext={() => setScreen('assets')}
          onBack={() => setScreen('theme-check')}
        />
      );
    case 'assets':
      return (
        <AssetUploadScreen
          onNext={() => setScreen('canvas')}
          onBack={() => setScreen('product')}
        />
      );
    case 'capabilities':
      return (
        <CapabilitySelectionScreen
          onNext={() => setScreen('activation')}
          onBack={() => setScreen('canvas')}
        />
      );
    case 'canvas':
      return (
        <CanvasBuilderScreen />
      );
    // Shopify: Activation (after capabilities)
    case 'activation':
      return (
        <ActivationScreen
          onNext={() => setScreen('billing')}
          onBack={() => setScreen('capabilities')}
        />
      );
    // Shopify: Billing (after activation)
    case 'billing':
      return (
        <BillingScreen
          onNext={() => {
            // After billing, return to onboarding (publish complete)
            setShowOnboarding(true);
          }}
          onBack={() => setScreen('activation')}
        />
      );
    case 'demo':
      return (
        <DemoCustomizerScreen 
          onBack={() => {
            setShowOnboarding(true);
            setScreen('product');
          }}
        />
      );
    case 'tour':
      return (
        <div className="min-h-screen bg-cream flex items-center justify-center">
          <div className="text-center p-8">
            <h1 className="font-serif text-4xl text-charcoal mb-4">Quick Tour</h1>
            <p className="font-mono text-sm text-charcoal/70 mb-8 uppercase tracking-wide">
              Coming Soon
            </p>
            <button
              onClick={() => setShowOnboarding(true)}
              className="font-mono text-xs uppercase tracking-widest px-6 py-3 border border-charcoal hover:bg-charcoal hover:text-cream transition-colors"
            >
              ← Back
            </button>
          </div>
        </div>
      );
    default:
      return (
        <ProductSelectionScreen
          onNext={() => setScreen('assets')}
          onBack={() => setScreen('product')}
        />
      );
  }
};

export default App;
