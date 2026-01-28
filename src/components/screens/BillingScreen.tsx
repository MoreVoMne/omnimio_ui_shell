import React, { useState, useMemo } from 'react';
import { Check, Info, ChevronDown, ChevronUp } from 'lucide-react';
import StandardLayout, { StandardButton } from '../layout/StandardLayout';

type BillingStatus = 'selecting' | 'trial-started' | 'subscribed';
type PlanId = 'starter' | 'pro' | 'enterprise';

interface Plan {
  id: PlanId;
  name: string;
  price: number;
  description: string;
  features: string[];
  highlighted?: boolean;
}

interface AddOn {
  id: string;
  name: string;
  price: number;
  description: string;
}

interface BillingScreenProps {
  onNext: () => void;
  onBack: () => void;
}

const plans: Plan[] = [
  {
    id: 'starter',
    name: 'Starter',
    price: 29,
    description: 'For small stores getting started',
    features: [
      'Up to 5 customizable products',
      'Basic materials & colors',
      'Email support',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 79,
    description: 'For growing businesses',
    features: [
      'Up to 25 customizable products',
      'All materials & colors',
      'Text & monogram',
      'Print & artwork',
      'Priority support',
    ],
    highlighted: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 199,
    description: 'For large-scale operations',
    features: [
      'Unlimited products',
      'All capabilities',
      'Custom integrations',
      'Dedicated support',
      'SLA guarantee',
    ],
  },
];

const addOns: AddOn[] = [
  { id: 'ai-generation', name: 'AI Image Generation', price: 15, description: 'Let customers generate custom artwork with AI' },
  { id: '3d-preview', name: 'Advanced 3D Preview', price: 10, description: 'High-quality real-time 3D rendering' },
  { id: 'analytics', name: 'Analytics Dashboard', price: 20, description: 'Detailed customization analytics and insights' },
  { id: 'multi-language', name: 'Multi-language', price: 10, description: 'Support for multiple languages' },
  { id: 'white-label', name: 'White Label', price: 25, description: 'Remove Omnimio branding' },
];

const BillingScreen: React.FC<BillingScreenProps> = ({ onNext, onBack }) => {
  const [status, setStatus] = useState<BillingStatus>('selecting');
  const [selectedPlan, setSelectedPlan] = useState<PlanId | null>(null);
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>([]);
  const [showAllAddOns, setShowAllAddOns] = useState(false);

  const toggleAddOn = (addOnId: string) => {
    setSelectedAddOns(prev =>
      prev.includes(addOnId)
        ? prev.filter(id => id !== addOnId)
        : [...prev, addOnId]
    );
  };

  const totalPrice = useMemo(() => {
    const planPrice = selectedPlan ? plans.find(p => p.id === selectedPlan)?.price || 0 : 0;
    const addOnsPrice = selectedAddOns.reduce((sum, id) => {
      const addOn = addOns.find(a => a.id === id);
      return sum + (addOn?.price || 0);
    }, 0);
    return planPrice + addOnsPrice;
  }, [selectedPlan, selectedAddOns]);

  const handleStartTrial = (planId: PlanId) => {
    setSelectedPlan(planId);
    setStatus('trial-started');
  };

  const handleSubscribe = (planId: PlanId) => {
    setSelectedPlan(planId);
    setStatus('subscribed');
  };

  const displayedAddOns = showAllAddOns ? addOns : addOns.slice(0, 3);

  return (
    <StandardLayout
      header={{
        title: 'Choose Your Plan',
        showBack: true,
        onBack,
      }}
      stickyContent={
        <div className="mb-2.5 text-left">
          <p className="text-mono-body text-muted-medium">
            Select a plan and add capabilities. Start with a 7-day free trial.
          </p>
        </div>
      }
      footer={{
        leftContent: selectedPlan && (
          <div className="flex flex-col">
            <span className="text-mono-sm text-muted-light">TOTAL</span>
            <span className="text-serif-xl text-charcoal">${totalPrice}/mo</span>
          </div>
        ),
        rightContent: (
          <StandardButton 
            onClick={onNext} 
            disabled={!selectedPlan && status === 'selecting'}
          >
            {status === 'selecting' ? 'Continue' : 'Go to Publish'}
          </StandardButton>
        ),
      }}
    >
      <div className="content-padding">
        {/* Status Banner */}
        {status === 'trial-started' && (
          <div className="mb-8 p-4 bg-yellow/10 border border-yellow/20 rounded-lg flex items-center gap-3">
            <Check className="w-5 h-5 text-yellow flex-shrink-0" />
            <span className="text-mono-body text-charcoal">
              Trial started! You have 7 days to explore all features.
            </span>
          </div>
        )}

        {status === 'subscribed' && (
          <div className="mb-8 p-4 bg-green/10 border border-green/20 rounded-lg flex items-center gap-3">
            <Check className="w-5 h-5 text-green flex-shrink-0" />
            <span className="text-mono-body text-charcoal">
              Subscribed! You're all set to publish.
            </span>
          </div>
        )}

        {/* Plan Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          {plans.map(plan => (
            <div
              key={plan.id}
              className={`border rounded-lg p-6 transition-all ${
                selectedPlan === plan.id
                  ? 'border-charcoal bg-charcoal/5'
                  : plan.highlighted
                  ? 'border-charcoal/40'
                  : 'border-charcoal/20'
              }`}
            >
              {plan.highlighted && (
                <div className="text-mono-xs text-accent mb-2">MOST POPULAR</div>
              )}
              
              <h3 className="text-serif-lg text-charcoal mb-1">{plan.name}</h3>
              <p className="text-mono-sm text-muted mb-4">{plan.description}</p>
              
              <div className="mb-4">
                <span className="text-serif-2xl text-charcoal">${plan.price}</span>
                <span className="text-mono-sm text-muted">/month</span>
              </div>

              <ul className="space-y-2 mb-6">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-mono-sm text-charcoal">
                    <Check className="w-4 h-4 text-charcoal/60 flex-shrink-0 mt-0.5" />
                    {feature}
                  </li>
                ))}
              </ul>

              <div className="space-y-2">
                <button
                  onClick={() => handleStartTrial(plan.id)}
                  className={`w-full py-2 border rounded text-mono-sm uppercase tracking-widest transition-colors ${
                    selectedPlan === plan.id && status === 'trial-started'
                      ? 'bg-charcoal text-cream border-charcoal'
                      : 'border-charcoal/30 text-charcoal hover:bg-charcoal/5'
                  }`}
                >
                  {selectedPlan === plan.id && status === 'trial-started' ? 'Trial Active' : 'Try 7 days free'}
                </button>
                <button
                  onClick={() => handleSubscribe(plan.id)}
                  className={`w-full py-2 border rounded text-mono-sm uppercase tracking-widest transition-colors ${
                    selectedPlan === plan.id && status === 'subscribed'
                      ? 'bg-charcoal text-cream border-charcoal'
                      : 'border-charcoal text-charcoal hover:bg-charcoal hover:text-cream'
                  }`}
                >
                  {selectedPlan === plan.id && status === 'subscribed' ? 'Subscribed' : 'Subscribe'}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Add-ons Section */}
        <div className="border-t border-charcoal/20 pt-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-mono-header text-charcoal">ADD-ONS & CAPABILITIES</h3>
            <button
              onClick={() => setShowAllAddOns(!showAllAddOns)}
              className="flex items-center gap-1 text-mono-sm text-muted hover:text-charcoal transition-colors"
            >
              {showAllAddOns ? 'Show less' : 'Show all'}
              {showAllAddOns ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>

          <div className="space-y-3">
            {displayedAddOns.map(addOn => (
              <label
                key={addOn.id}
                className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-all ${
                  selectedAddOns.includes(addOn.id)
                    ? 'border-charcoal bg-charcoal/5'
                    : 'border-charcoal/20 hover:border-charcoal/40'
                }`}
              >
                <div className="flex items-center gap-4">
                  <input
                    type="checkbox"
                    checked={selectedAddOns.includes(addOn.id)}
                    onChange={() => toggleAddOn(addOn.id)}
                    className="w-4 h-4 rounded border-charcoal/30"
                  />
                  <div>
                    <div className="text-mono-body text-charcoal">{addOn.name}</div>
                    <div className="text-mono-sm text-muted">{addOn.description}</div>
                  </div>
                </div>
                <div className="text-mono-body text-charcoal">+${addOn.price}/mo</div>
              </label>
            ))}
          </div>
        </div>

        {/* How Pricing Works */}
        <div className="mt-10 p-6 bg-charcoal/5 rounded-lg">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-charcoal/60 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-mono-body text-charcoal mb-2">How pricing works</h4>
              <p className="text-mono-sm text-muted">
                Choose a base plan that fits your needs, then add individual capabilities as you grow. 
                All plans include a 7-day free trial. You can upgrade, downgrade, or cancel anytime. 
                Billing is monthly through Shopify.
              </p>
            </div>
          </div>
        </div>
      </div>
    </StandardLayout>
  );
};

export default BillingScreen;
