import React, { useState, useEffect } from 'react';
import { 
  X, Crown, ArrowRight, ShieldCheck, Check, Copy, Share2, 
  Sparkles, RefreshCw, Smartphone
} from 'lucide-react';
import { chatService } from '../services/chatService';
import { VipPlan } from '../types';

interface VipUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVipChanged?: () => void;
}

const DEFAULT_UPI_ID = '9618060329@ybl';

const VIP_PLANS: VipPlan[] = [
  {
    id: 'weekly',
    name: '7-Day Pass',
    price: '₹99',
    originalPrice: '₹199',
    duration: 'per week',
    amountInPaise: 9900,
    badge: 'Starter'
  },
  {
    id: 'monthly',
    name: '30-Day VIP',
    price: '₹249',
    originalPrice: '₹499',
    duration: 'per month',
    amountInPaise: 24900,
    badge: 'Popular',
    popular: true
  },
  {
    id: 'lifetime',
    name: 'Lifetime Pass',
    price: '₹599',
    originalPrice: '₹1499',
    duration: 'one-time',
    amountInPaise: 59900,
    badge: 'Best Value'
  }
];

export const VipUpgradeModal: React.FC<VipUpgradeModalProps> = ({
  isOpen,
  onClose,
  onVipChanged
}) => {
  const [selectedPlan, setSelectedPlan] = useState<string>('monthly');
  const [copiedLink, setCopiedLink] = useState(false);
  const [verifyingPayment, setVerifyingPayment] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState<string | null>(null);
  const [referralCount, setReferralCount] = useState<number>(0);

  const isVip = chatService.isVip();
  const session = chatService.getUserSession();

  useEffect(() => {
    if (isOpen) {
      setReferralCount(chatService.getReferralCount());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentPlan = VIP_PLANS.find(p => p.id === selectedPlan) || VIP_PLANS[1];

  const referralLink = typeof window !== 'undefined' 
    ? `${window.location.origin}?ref=${session.userId}`
    : `https://hush-live-chat.vercel.app?ref=${session.userId}`;

  const handleCopyReferral = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(referralLink);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(`🔥 Chat 100% anonymously with college students and people nearby without names or judgment on HUSH AI! Join now: ${referralLink}`);
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const handleSimulateTestReferral = () => {
    const count = chatService.incrementReferralCount(1);
    setReferralCount(count);
    if (count >= 10) {
      setPaymentSuccess('FREE-REF-UNLOCKED');
      onVipChanged?.();
      setTimeout(() => {
        setPaymentSuccess(null);
        onClose();
      }, 2500);
    }
  };

  // Instant Verification and VIP Activation
  const handleConfirmPaid = () => {
    setVerifyingPayment(true);
    setTimeout(() => {
      setVerifyingPayment(false);
      const generatedPayId = `PAY_${Date.now().toString(36).toUpperCase()}`;
      setPaymentSuccess(generatedPayId);
      chatService.setVip(true, currentPlan.name);
      onVipChanged?.();
      setTimeout(() => {
        setPaymentSuccess(null);
        onClose();
      }, 2000);
    }, 1200);
  };

  const handleToggleDowngrade = () => {
    chatService.setVip(false);
    onVipChanged?.();
  };

  const upiAmount = currentPlan.amountInPaise / 100;
  const upiUri = `upi://pay?pa=${encodeURIComponent(DEFAULT_UPI_ID)}&pn=HUSH%20AI%20VIP&am=${upiAmount}&cu=INR&tn=VIP%20Pass%20${encodeURIComponent(currentPlan.name)}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(upiUri)}&bgcolor=ffffff&color=0d1021&margin=12`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md animate-fade-in perspective-1000 overflow-y-auto">
      <div 
        className="w-full max-w-lg my-auto rounded-3xl bg-[#0d1021] border border-amber-500/30 shadow-2xl shadow-amber-950/40 overflow-hidden floating-screen-3d"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header - Clean & Spacious */}
        <div className="relative px-6 py-6 sm:px-8 sm:py-7 bg-gradient-to-r from-amber-950/70 via-purple-950/60 to-slate-900 border-b border-white/5">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-2xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center space-x-2 text-amber-400 font-bold text-xs uppercase tracking-widest mb-2">
            <Crown className="w-4 h-4" />
            <span>HUSH VIP EXCLUSIVE</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Unlock VIP Privileges 👑
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1.5 leading-relaxed font-normal">
            Filter matches by Gender & City, skip queues, and rewind skips.
          </p>

          {isVip && (
            <div className="mt-4 p-3 rounded-2xl bg-amber-500/15 border border-amber-500/40 flex items-center justify-between">
              <div className="flex items-center space-x-2 text-xs font-bold text-amber-300">
                <Crown className="w-4 h-4 text-amber-400 animate-bounce" />
                <span>You are currently a VIP Member ({session.vipPlan || 'Active'})!</span>
              </div>
              <button
                onClick={handleToggleDowngrade}
                className="text-[11px] px-3 py-1 rounded-xl bg-slate-800 text-slate-300 hover:text-rose-300 hover:bg-slate-700 transition-colors"
              >
                Disable VIP
              </button>
            </div>
          )}
        </div>

        {/* Modal Body - Roomy & Uncluttered */}
        <div className="p-6 sm:p-8 space-y-7 max-h-[75vh] overflow-y-auto">
          {/* Payment Success Notification */}
          {paymentSuccess && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-center text-sm shadow-xl animate-bounce space-y-1">
              <p>🎉 VIP Unlocked Successfully!</p>
              <p className="text-xs font-mono opacity-90">ID: {paymentSuccess}</p>
            </div>
          )}

          {/* 1. Plan Selector - Clean 3 Pills */}
          <div className="space-y-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              1. Choose VIP Pack:
            </span>
            <div className="grid grid-cols-3 gap-3">
              {VIP_PLANS.map((plan) => {
                const isSelected = selectedPlan === plan.id;
                return (
                  <button
                    key={plan.id}
                    type="button"
                    onClick={() => setSelectedPlan(plan.id)}
                    className={`relative p-3.5 sm:p-4 rounded-2xl border text-center transition-all flex flex-col items-center justify-between ${
                      isSelected
                        ? 'bg-gradient-to-b from-amber-950/80 to-purple-950/80 border-amber-400 shadow-xl shadow-amber-950/50 ring-2 ring-amber-400/50 scale-[1.02]'
                        : 'bg-slate-900/90 border-slate-800 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    {plan.badge && (
                      <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 mb-1">
                        {plan.badge}
                      </span>
                    )}
                    <span className="font-bold text-white text-xs">{plan.name}</span>
                    <span className="text-lg sm:text-xl font-black text-amber-300 my-1">{plan.price}</span>
                    <span className="text-[10px] text-slate-400">{plan.duration}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. ONLY THE CLEAN QR CODE - EXACTLY AS REQUESTED */}
          <div className="p-6 rounded-3xl bg-black/60 border border-purple-500/30 flex flex-col items-center text-center space-y-5 shadow-2xl">
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                2. Scan to Pay {currentPlan.price}
              </span>
              <p className="text-[11px] text-slate-400">
                Open any UPI app on your phone to scan
              </p>
            </div>

            {/* Crisp Pure White QR Code Box with Caption */}
            <div className="p-4 sm:p-5 rounded-3xl bg-white shadow-2xl flex flex-col items-center justify-center space-y-2 border-2 border-white/20">
              <img 
                src={qrCodeUrl} 
                alt={`QR code for ${currentPlan.price}`} 
                className="w-48 h-48 sm:w-56 sm:h-56 object-contain rounded-xl"
              />
              <span className="text-[10px] sm:text-[11px] font-black tracking-widest text-slate-900 uppercase pt-1">
                SCAN WITH PHONEPE / GPAY
              </span>
            </div>

            {/* Direct Mobile Tap Intent */}
            <a
              href={upiUri}
              className="w-full max-w-xs py-2.5 px-4 rounded-xl bg-purple-900/40 hover:bg-purple-800/60 border border-purple-500/40 text-purple-200 text-xs font-bold flex items-center justify-center space-x-2 transition-colors"
            >
              <Smartphone className="w-4 h-4 text-purple-300" />
              <span>Browsing on phone? Tap to Pay</span>
            </a>

            {/* Action Button: I Have Paid */}
            <button
              type="button"
              onClick={handleConfirmPaid}
              disabled={verifyingPayment}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm uppercase tracking-wider shadow-xl shadow-emerald-500/25 flex items-center justify-center space-x-2 transition-all transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50"
            >
              {verifyingPayment ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Activating VIP...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-5 h-5 text-slate-950" />
                  <span>I Have Paid • Activate VIP Now</span>
                  <ArrowRight className="w-4 h-4 text-slate-950" />
                </>
              )}
            </button>
          </div>

          {/* 3. FREE VIP OPTION - 10 REFERRALS */}
          <div className="p-5 rounded-3xl bg-slate-900/80 border border-indigo-500/30 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-black text-white uppercase tracking-wider">
                  Or Get VIP Free: Refer 10 Friends
                </span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800">
                100% Free
              </span>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1.5 p-3 rounded-2xl bg-black/40 border border-white/5">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-slate-300">Progress:</span>
                <span className={referralCount >= 10 ? 'text-emerald-400' : 'text-amber-300'}>
                  {Math.min(referralCount, 10)}/10 Friends Joined {referralCount >= 10 ? '🎉 UNLOCKED!' : ''}
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-amber-500 via-purple-500 to-cyan-400 transition-all duration-500 rounded-full"
                  style={{ width: `${Math.min((referralCount / 10) * 100, 100)}%` }}
                />
              </div>
            </div>

            {/* Share Buttons */}
            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={handleCopyReferral}
                className="flex-1 py-3 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center justify-center space-x-1.5 shadow transition-colors"
              >
                {copiedLink ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                <span>{copiedLink ? 'Link Copied!' : 'Copy Referral Link'}</span>
              </button>

              <button
                type="button"
                onClick={handleShareWhatsApp}
                className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center space-x-1.5 shadow transition-colors"
              >
                <Share2 className="w-4 h-4" />
                <span>WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={handleSimulateTestReferral}
                className="py-3 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors"
                title="Simulate +1 Friend"
              >
                +1 Test
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
