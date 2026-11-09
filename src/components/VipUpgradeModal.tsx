import React, { useState, useEffect } from 'react';
import { 
  X, Crown, ShieldCheck, Check, Copy, Share2, 
  Sparkles, RefreshCw, Smartphone, Send, AlertCircle, Lock
} from 'lucide-react';
import phonepeQrImg from '../assets/phonepe_qr.png';
import { chatService } from '../services/chatService';
import { VipPlan } from '../types';

interface VipUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVipChanged?: () => void;
}

const DEFAULT_UPI_ID = '9618060329@ybl';
const OWNER_PHONE = '9618060329';

// Valid strict activation codes (controlled by site owner)
const VALID_ACTIVATION_CODES = [
  '9618060329',
  'VIP9618',
  'HUSH9618',
  'VIP7DAY',
  'VIP30DAY',
  'VIPLIFE',
  'HUSHVIP2026'
];

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
  const [utrNumber, setUtrNumber] = useState('');
  const [activationCode, setActivationCode] = useState('');
  const [verifyingPayment, setVerifyingPayment] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState<string | null>(null);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [referralCount, setReferralCount] = useState<number>(0);

  const isVip = chatService.isVip();
  const session = chatService.getUserSession();

  useEffect(() => {
    if (isOpen) {
      setReferralCount(chatService.getReferralCount());
      setVerificationError(null);
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

  // Open WhatsApp to send screenshot and UTR to owner
  const handleSendProofOnWhatsApp = () => {
    const cleanUtr = utrNumber.trim() || 'NOT_ENTERED';
    const message = encodeURIComponent(
      `Hello! I paid ${currentPlan.price} on PhonePe for HUSH VIP (${currentPlan.name}).\n` +
      `• UTR / UPI Ref: ${cleanUtr}\n` +
      `• User ID: ${session.userId}\n` +
      `Please verify and send my VIP Activation Code!`
    );
    window.open(`https://api.whatsapp.com/send?phone=91${OWNER_PHONE}&text=${message}`, '_blank');
  };

  // Strict Activation Verification
  const handleStrictActivation = () => {
    setVerificationError(null);
    const cleanedCode = activationCode.trim().toUpperCase();

    if (!cleanedCode) {
      setVerificationError('Please enter your VIP Activation Code received on WhatsApp after payment.');
      return;
    }

    setVerifyingPayment(true);

    setTimeout(() => {
      setVerifyingPayment(false);

      const isValidCode = VALID_ACTIVATION_CODES.map(c => c.toUpperCase()).includes(cleanedCode);

      if (!isValidCode) {
        setVerificationError(
          '❌ Invalid Activation Code! Please send your payment screenshot on WhatsApp to receive your official code.'
        );
        return;
      }

      // Valid Code -> Unlock VIP
      const generatedPayId = `VIP_${cleanedCode}_${Date.now().toString(36).toUpperCase()}`;
      setPaymentSuccess(generatedPayId);
      chatService.setVip(true, currentPlan.name);
      onVipChanged?.();

      setTimeout(() => {
        setPaymentSuccess(null);
        onClose();
      }, 2000);
    }, 1000);
  };

  const handleToggleDowngrade = () => {
    chatService.setVip(false);
    onVipChanged?.();
  };

  const upiAmount = currentPlan.amountInPaise / 100;
  const upiUri = `upi://pay?pa=${encodeURIComponent(DEFAULT_UPI_ID)}&pn=HUSH%20AI%20VIP&am=${upiAmount}&cu=INR&tn=VIP%20Pass%20${encodeURIComponent(currentPlan.name)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-fade-in perspective-1000 overflow-y-auto">
      <div 
        className="w-full max-w-lg my-auto max-h-[92dvh] flex flex-col rounded-3xl bg-[#0d1021] border border-amber-500/30 shadow-2xl shadow-amber-950/40 overflow-hidden floating-screen-3d"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header - Clean & Spacious */}
        <div className="relative px-5 py-5 sm:px-8 sm:py-7 bg-gradient-to-r from-amber-950/70 via-purple-950/60 to-slate-900 border-b border-white/5 flex-shrink-0">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-2xl text-slate-400 hover:text-white hover:bg-white/10 active:scale-95 transition-all"
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
                className="text-[11px] px-3 py-1 rounded-xl bg-slate-800 text-slate-300 hover:text-rose-300 hover:bg-slate-700 active:scale-95 transition-all"
              >
                Disable VIP
              </button>
            </div>
          )}
        </div>

        {/* Modal Body - Roomy & Uncluttered */}
        <div className="p-4 sm:p-8 space-y-6 sm:space-y-7 flex-1 overflow-y-auto text-left">
          {/* Payment Success Notification */}
          {paymentSuccess && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-center text-sm shadow-xl animate-bounce space-y-1">
              <p>🎉 VIP Verified & Unlocked Successfully!</p>
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

          {/* 2. ONLY THE CLEAN QR CODE */}
          <div className="p-4 sm:p-6 rounded-3xl bg-black/60 border border-purple-500/30 flex flex-col items-center text-center space-y-4 sm:space-y-5 shadow-2xl">
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                2. Scan to Pay {currentPlan.price}
              </span>
              <p className="text-[11px] text-slate-400">
                Scan with PhonePe, Google Pay, or Paytm
              </p>
            </div>

            {/* Crisp Pure White QR Code Box with Caption */}
            <div className="p-3 sm:p-4 rounded-3xl bg-white shadow-2xl flex flex-col items-center justify-center space-y-2 border-2 border-white/20">
              <img 
                src={phonepeQrImg} 
                alt="Scan with PhonePe or GPay" 
                className="w-44 h-44 sm:w-56 sm:h-56 object-contain rounded-2xl shadow-inner"
              />
              <span className="text-[10px] sm:text-xs font-black tracking-widest text-slate-900 uppercase pt-0.5 sm:pt-1">
                SCAN WITH PHONEPE / GPAY
              </span>
            </div>

            {/* Direct Mobile Tap Intent */}
            <a
              href={upiUri}
              className="w-full max-w-xs py-3 px-4 rounded-xl bg-purple-900/40 hover:bg-purple-800/60 border border-purple-500/40 text-purple-200 text-xs font-bold flex items-center justify-center space-x-2 active:scale-95 transition-all"
            >
              <Smartphone className="w-4 h-4 text-purple-300" />
              <span>Browsing on phone? Tap to Pay</span>
            </a>
          </div>

          {/* 3. STRICT PAYMENT VERIFICATION (No Free Click Bypass) */}
          <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-indigo-950/60 via-slate-900 to-purple-950/60 border border-amber-500/40 space-y-4">
            <div className="flex items-center space-x-2">
              <Lock className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                3. Strict Payment Verification:
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              To prevent fraudulent activation, send your payment screenshot on WhatsApp to receive your official <strong className="text-amber-300">VIP Activation Code</strong>.
            </p>

            {/* Step A: UTR Input & WhatsApp Proof Button */}
            <div className="space-y-2">
              <label className="text-[11px] font-semibold text-slate-300 block">
                Step A: Enter 12-Digit UTR / UPI Ref from Receipt:
              </label>
              <input
                type="text"
                maxLength={16}
                value={utrNumber}
                onChange={(e) => setUtrNumber(e.target.value)}
                placeholder="e.g. 431289562143"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-base sm:text-xs placeholder:text-slate-500 focus:outline-none focus:border-purple-400"
              />

              <button
                type="button"
                onClick={handleSendProofOnWhatsApp}
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center space-x-2 shadow active:scale-95 transition-all"
              >
                <Send className="w-4 h-4" />
                <span>Send Screenshot & UTR on WhatsApp</span>
              </button>
            </div>

            {/* Step B: Activation Code Input */}
            <div className="space-y-2 pt-2 border-t border-white/10">
              <label className="text-[11px] font-semibold text-slate-300 block">
                Step B: Enter VIP Activation Code:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={activationCode}
                  onChange={(e) => {
                    setActivationCode(e.target.value);
                    setVerificationError(null);
                  }}
                  placeholder="Enter Code from WhatsApp"
                  className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-amber-300 font-mono font-bold text-base sm:text-xs uppercase placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
                />
                <button
                  type="button"
                  onClick={handleStrictActivation}
                  disabled={verifyingPayment}
                  className="px-4 sm:px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow flex items-center space-x-1.5 active:scale-95 transition-all disabled:opacity-50"
                >
                  {verifyingPayment ? (
                    <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4 text-slate-950" />
                      <span>Unlock</span>
                    </>
                  )}
                </button>
              </div>

              {/* Error Message */}
              {verificationError && (
                <div className="p-3 rounded-xl bg-rose-950/70 border border-rose-500/50 text-rose-200 text-[11px] flex items-start space-x-2 animate-shake">
                  <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                  <span>{verificationError}</span>
                </div>
              )}
            </div>
          </div>

          {/* 4. FREE VIP OPTION - 10 REFERRALS */}
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
                className="flex-1 py-3 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center justify-center space-x-1.5 shadow active:scale-95 transition-all"
              >
                {copiedLink ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                <span>{copiedLink ? 'Link Copied!' : 'Copy Referral Link'}</span>
              </button>

              <button
                type="button"
                onClick={handleShareWhatsApp}
                className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center space-x-1.5 shadow active:scale-95 transition-all"
              >
                <Share2 className="w-4 h-4" />
                <span>WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
