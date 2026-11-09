import React, { useState } from 'react';
import { X, Crown, ArrowRight, Zap, MapPin, Users, RotateCcw, ShieldCheck, Tag } from 'lucide-react';
import { chatService } from '../services/chatService';
import { VipPlan } from '../types';

interface VipUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVipChanged?: () => void;
}

const VIP_PLANS: VipPlan[] = [
  {
    id: 'weekly',
    name: '7-Day Pass',
    price: '₹99',
    originalPrice: '₹199',
    duration: 'per week',
    badge: 'Starter'
  },
  {
    id: 'monthly',
    name: '30-Day VIP',
    price: '₹249',
    originalPrice: '₹499',
    duration: 'per month',
    badge: 'Popular',
    popular: true
  },
  {
    id: 'lifetime',
    name: 'Lifetime Pass',
    price: '₹599',
    originalPrice: '₹1499',
    duration: 'one-time',
    badge: 'Best Value'
  }
];

export const VipUpgradeModal: React.FC<VipUpgradeModalProps> = ({
  isOpen,
  onClose,
  onVipChanged
}) => {
  const [selectedPlan, setSelectedPlan] = useState<string>('monthly');
  const [promoCode, setPromoCode] = useState('');
  const [promoStatus, setPromoStatus] = useState<string | null>(null);
  const [successAnimation, setSuccessAnimation] = useState(false);

  const isVip = chatService.isVip();
  const session = chatService.getUserSession();

  if (!isOpen) return null;

  const handleInstantUpgrade = (planName?: string) => {
    chatService.setVip(true, planName || '30-Day VIP Pass');
    setSuccessAnimation(true);
    onVipChanged?.();
    setTimeout(() => {
      setSuccessAnimation(false);
      onClose();
    }, 1800);
  };

  const handleToggleDowngrade = () => {
    chatService.setVip(false);
    onVipChanged?.();
  };

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = promoCode.trim().toUpperCase();
    if (clean === 'VIPFREE' || clean === 'HUSH2026' || clean === 'FOUNDER') {
      chatService.setVip(true, `VIP Promo (${clean})`);
      setPromoStatus('🎉 Promo code accepted! Lifetime VIP unlocked.');
      setSuccessAnimation(true);
      onVipChanged?.();
      setTimeout(() => {
        setSuccessAnimation(false);
        onClose();
      }, 1800);
    } else {
      setPromoStatus('❌ Invalid promo code. Try "VIPFREE" or click 1-Click Upgrade.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in perspective-1000">
      <div 
        className="w-full max-w-xl rounded-3xl bg-[#0d1021] border border-amber-500/40 shadow-2xl shadow-amber-950/50 overflow-hidden floating-screen-3d"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header */}
        <div className="relative px-6 pt-6 pb-5 bg-gradient-to-r from-amber-950/70 via-purple-950/70 to-slate-900 border-b border-amber-500/20">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-amber-300 text-xs font-bold mb-2 border border-amber-500/40 shadow-sm">
            <Crown className="w-3.5 h-3.5 text-amber-400" />
            <span>HUSH VIP EXCLUSIVE</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center space-x-2">
            <span>Unlock HUSH VIP Perks</span>
            <span className="text-xl">👑</span>
          </h2>
          <p className="text-xs text-slate-300 mt-1 leading-relaxed">
            Filter matches by Gender & City, skip queues instantly, and rewind accidental skips.
          </p>

          {isVip && (
            <div className="mt-3 p-2.5 rounded-xl bg-amber-500/20 border border-amber-500/50 flex items-center justify-between">
              <div className="flex items-center space-x-2 text-xs font-bold text-amber-300">
                <Crown className="w-4 h-4 text-amber-400 animate-bounce" />
                <span>You are currently a VIP Member ({session.vipPlan || 'Active'})!</span>
              </div>
              <button
                onClick={handleToggleDowngrade}
                className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 hover:text-rose-300 hover:bg-slate-700 transition-colors"
              >
                Disable VIP (Test Free Mode)
              </button>
            </div>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Success Banner */}
          {successAnimation && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 text-white font-bold text-center text-sm shadow-xl animate-bounce">
              🎉 VIP Activated Successfully! All premium features are unlocked.
            </div>
          )}

          {/* Perks Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-start space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-pink-500/20 border border-pink-500/30 flex items-center justify-center text-pink-400 flex-shrink-0">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-white block">Gender Matching Filter</span>
                <span className="text-slate-400 text-[11px]">Match specifically with Female, Male, or Anyone.</span>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-start space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 flex-shrink-0">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-white block">City & Campus Filter</span>
                <span className="text-slate-400 text-[11px]">Connect only with people from your target city or area.</span>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-start space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 flex-shrink-0">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-white block">Instant Priority Queue</span>
                <span className="text-slate-400 text-[11px]">Bypass the waiting queue with 1st-priority match placement.</span>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-start space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400 flex-shrink-0">
                <RotateCcw className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-white block">Rewind Skipped Strangers</span>
                <span className="text-slate-400 text-[11px]">Accidentally skipped? Undo and reconnect instantly.</span>
              </div>
            </div>
          </div>

          {/* Pricing Tiers Selection */}
          <div className="space-y-2.5">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
              Choose VIP Pass:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {VIP_PLANS.map((plan) => {
                const isSelected = selectedPlan === plan.id;
                return (
                  <div
                    key={plan.id}
                    onClick={() => setSelectedPlan(plan.id)}
                    className={`cursor-pointer rounded-2xl p-3.5 border transition-all relative ${
                      isSelected
                        ? 'bg-gradient-to-b from-amber-950/60 to-purple-950/60 border-amber-400 shadow-lg shadow-amber-950/40 ring-1 ring-amber-400'
                        : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {plan.badge && (
                      <span className="absolute -top-2 right-3 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 shadow">
                        {plan.badge}
                      </span>
                    )}
                    <h4 className="font-bold text-white text-xs">{plan.name}</h4>
                    <div className="flex items-baseline space-x-1.5 mt-1">
                      <span className="text-lg font-black text-amber-300">{plan.price}</span>
                      <span className="text-[10px] text-slate-500 line-through">{plan.originalPrice}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium">{plan.duration}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Instant 1-Click Upgrade Button */}
          <div className="space-y-2 pt-1">
            <button
              onClick={() => {
                const planObj = VIP_PLANS.find(p => p.id === selectedPlan);
                handleInstantUpgrade(planObj?.name);
              }}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-sm uppercase tracking-wider shadow-xl shadow-amber-500/30 hover:shadow-amber-500/50 flex items-center justify-center space-x-2 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <Crown className="w-5 h-5 text-slate-950 fill-current" />
              <span>{isVip ? 'Renew / Extend VIP Pass' : '⚡ 1-Click Instant Upgrade (Test VIP)'}</span>
              <ArrowRight className="w-4 h-4 text-slate-950" />
            </button>
            <p className="text-[11px] text-center text-slate-400">
              Simulated Demo Mode: Instant activation with no credit card required so you can test all features right now!
            </p>
          </div>

          {/* Promo Code Drawer */}
          <form onSubmit={handleApplyPromo} className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
            <div className="flex items-center space-x-1.5 text-xs font-semibold text-slate-300">
              <Tag className="w-3.5 h-3.5 text-amber-400" />
              <span>Have a Promo Code? (Use code: <span className="text-amber-300 font-mono">VIPFREE</span>)</span>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                placeholder="e.g. VIPFREE"
                className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-xs uppercase tracking-wider focus:outline-none focus:border-amber-400"
              />
              <button
                type="submit"
                disabled={!promoCode.trim()}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 disabled:opacity-40 transition-colors"
              >
                Apply
              </button>
            </div>
            {promoStatus && (
              <p className="text-[11px] font-medium text-amber-300 mt-1">{promoStatus}</p>
            )}
          </form>

          {/* Guarantee */}
          <div className="flex items-center space-x-2 text-[11px] text-slate-400 pt-1">
            <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>Anonymous matching remains private. No identity or banking details are linked to your chat.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
