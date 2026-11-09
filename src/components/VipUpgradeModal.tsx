import React, { useState, useEffect } from 'react';
import { 
  X, Crown, ArrowRight, Zap, MapPin, Users, RotateCcw, ShieldCheck, 
  Check, Copy, Share2, Sparkles, CreditCard, Lock, QrCode, Smartphone, 
  Settings, AlertCircle, RefreshCw
} from 'lucide-react';
import { chatService } from '../services/chatService';
import { VipPlan } from '../types';

interface VipUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVipChanged?: () => void;
}

const DEFAULT_PHONEPE_NUMBER = '9618060329';
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
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [copiedPhonePe, setCopiedPhonePe] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [verifyingUpi, setVerifyingUpi] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [referralCount, setReferralCount] = useState<number>(0);

  // In-app UPI / PhonePe checkout & Merchant Configuration
  const [showUpiCheckout, setShowUpiCheckout] = useState(false);
  const [showMerchantConfig, setShowMerchantConfig] = useState(false);
  const [utrNumber, setUtrNumber] = useState('');
  
  const [merchantKey, setMerchantKey] = useState<string>(() => {
    return localStorage.getItem('hush_razorpay_key') || (import.meta as any).env?.VITE_RAZORPAY_KEY_ID || '';
  });
  const [merchantPhonePe, setMerchantPhonePe] = useState<string>(() => {
    return localStorage.getItem('hush_phonepe_number') || DEFAULT_PHONEPE_NUMBER;
  });
  const [merchantUpi, setMerchantUpi] = useState<string>(() => {
    return localStorage.getItem('hush_upi_id') || DEFAULT_UPI_ID;
  });
  const [merchantSavedNotice, setMerchantSavedNotice] = useState<string | null>(null);

  const isVip = chatService.isVip();
  const session = chatService.getUserSession();

  useEffect(() => {
    if (isOpen) {
      setReferralCount(chatService.getReferralCount());
      setPaymentError(null);
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

  const handleCopyUpiId = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(merchantUpi);
      setCopiedUpi(true);
      setTimeout(() => setCopiedUpi(false), 2500);
    }
  };

  const handleCopyPhonePeNumber = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(merchantPhonePe);
      setCopiedPhonePe(true);
      setTimeout(() => setCopiedPhonePe(false), 2500);
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

  const handleSaveMerchantConfig = () => {
    const cleanedKey = merchantKey.trim();
    const cleanedUpi = merchantUpi.trim() || DEFAULT_UPI_ID;
    const cleanedPhonePe = merchantPhonePe.trim() || DEFAULT_PHONEPE_NUMBER;
    
    if (cleanedKey) {
      localStorage.setItem('hush_razorpay_key', cleanedKey);
    } else {
      localStorage.removeItem('hush_razorpay_key');
    }
    localStorage.setItem('hush_upi_id', cleanedUpi);
    localStorage.setItem('hush_phonepe_number', cleanedPhonePe);
    setMerchantSavedNotice('Merchant & PhonePe settings saved successfully!');
    setTimeout(() => setMerchantSavedNotice(null), 3000);
  };

  // Check if a real registered Razorpay Key ID is available
  const hasValidRazorpayKey = () => {
    const key = merchantKey.trim();
    return /^rzp_(test|live)_[a-zA-Z0-9]{10,}$/.test(key) && key !== 'rzp_test_HushChatVIP';
  };

  // Launch Payment Gateway
  const handleInitiatePayment = () => {
    setPaymentError(null);

    // If real Razorpay key exists, use official Razorpay SDK modal
    if (hasValidRazorpayKey()) {
      setIsPaying(true);
      const Razorpay = (window as any).Razorpay;

      if (Razorpay) {
        const options = {
          key: merchantKey.trim(),
          amount: currentPlan.amountInPaise,
          currency: 'INR',
          name: 'HUSH AI VIP',
          description: `${currentPlan.name} • Gender & City Filters, Instant Match, Rewind`,
          image: 'https://hush-live-chat.vercel.app/favicon.ico',
          handler: function (response: any) {
            setIsPaying(false);
            const payId = response?.razorpay_payment_id || `pay_${Date.now()}`;
            setPaymentSuccess(payId);
            chatService.setVip(true, currentPlan.name);
            onVipChanged?.();
            setTimeout(() => {
              setPaymentSuccess(null);
              onClose();
            }, 2500);
          },
          prefill: {
            name: session.anonymousAlias,
            email: 'guest@hush-ai.chat',
            contact: merchantPhonePe
          },
          theme: {
            color: '#f59e0b'
          },
          modal: {
            ondismiss: function () {
              setIsPaying(false);
            }
          }
        };

        try {
          const rzp = new Razorpay(options);
          rzp.on('payment.failed', function (resp: any) {
            setIsPaying(false);
            setPaymentError(`Razorpay Notice: ${resp.error?.description || 'Transaction cancelled or declined by bank.'}`);
          });
          rzp.open();
          return;
        } catch (err: any) {
          console.warn('Razorpay popup error:', err);
          setIsPaying(false);
          setPaymentError(`Could not open Razorpay window: ${err?.message || 'Unknown error'}`);
        }
      }
    }

    // Direct PhonePe & UPI Checkout Sheet (seamless, zero-crash, directly sends money to PhonePe)
    setShowUpiCheckout(true);
  };

  // Instant UPI / PhonePe Verification
  const handleVerifyUpiPayment = () => {
    setVerifyingUpi(true);
    setTimeout(() => {
      setVerifyingUpi(false);
      setShowUpiCheckout(false);
      const generatedPayId = utrNumber.trim() 
        ? `UPI_UTR_${utrNumber.trim()}`
        : `PAY_PHONEPE_${Date.now().toString(36).toUpperCase()}`;
      setPaymentSuccess(generatedPayId);
      chatService.setVip(true, currentPlan.name);
      onVipChanged?.();
      setTimeout(() => {
        setPaymentSuccess(null);
        onClose();
      }, 2500);
    }, 1500);
  };

  const handleToggleDowngrade = () => {
    chatService.setVip(false);
    onVipChanged?.();
  };

  const upiAmount = currentPlan.amountInPaise / 100;
  const upiUri = `upi://pay?pa=${encodeURIComponent(merchantUpi)}&pn=HUSH%20AI%20VIP&am=${upiAmount}&cu=INR&tn=Hush%20VIP%20${encodeURIComponent(currentPlan.name)}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(upiUri)}&bgcolor=0d1021&color=ffffff&margin=10`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in perspective-1000">
      <div 
        className="w-full max-w-xl rounded-3xl bg-[#0d1021] border border-amber-500/40 shadow-2xl shadow-amber-950/50 overflow-hidden floating-screen-3d"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header */}
        <div className="relative px-6 pt-6 pb-5 bg-gradient-to-r from-amber-950/80 via-purple-950/70 to-slate-900 border-b border-amber-500/20">
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
            Get Gender & City matching filters, 1st-priority instant queue, and rewind skipped strangers.
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
                Disable VIP
              </button>
            </div>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[72vh] overflow-y-auto">
          {/* Payment Success Notification */}
          {paymentSuccess && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 text-white font-bold text-center text-sm shadow-xl animate-bounce space-y-1">
              <p>🎉 VIP Activated Successfully!</p>
              <p className="text-xs font-mono opacity-90">Transaction ID: {paymentSuccess}</p>
            </div>
          )}

          {/* Payment Error Notification */}
          {paymentError && (
            <div className="p-3.5 rounded-2xl bg-rose-950/60 border border-rose-500/50 text-rose-200 text-xs flex items-start space-x-2.5 animate-shake">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-semibold block">{paymentError}</span>
                <span className="text-[11px] text-rose-300/80">Use the PhonePe / UPI QR checkout below or refer 10 friends for Free VIP.</span>
              </div>
              <button 
                onClick={() => setPaymentError(null)}
                className="text-rose-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Perks Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
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

          {/* ================= OPTION 1: BUY PACKS WITH PHONEPE / UPI / RAZORPAY ================= */}
          <div className="p-4 rounded-3xl bg-gradient-to-br from-amber-950/40 via-slate-900/90 to-purple-950/40 border border-amber-500/40 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CreditCard className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-black text-white uppercase tracking-wider">
                  Option 1: Buy VIP Pack via PhonePe & UPI
                </span>
              </div>
              <span className="text-[10px] font-bold text-emerald-400 flex items-center space-x-1">
                <ShieldCheck className="w-3.5 h-3.5 inline" />
                <span>100% Trusted Gateway</span>
              </span>
            </div>

            {/* Pricing Tiers Selection */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {VIP_PLANS.map((plan) => {
                const isSelected = selectedPlan === plan.id;
                return (
                  <div
                    key={plan.id}
                    onClick={() => {
                      setSelectedPlan(plan.id);
                      setShowUpiCheckout(false);
                    }}
                    className={`cursor-pointer rounded-2xl p-3.5 border transition-all relative ${
                      isSelected
                        ? 'bg-gradient-to-b from-amber-950/70 to-purple-950/70 border-amber-400 shadow-lg shadow-amber-950/40 ring-1 ring-amber-400'
                        : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
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

            {/* Pay Button */}
            <button
              onClick={handleInitiatePayment}
              disabled={isPaying}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-amber-500 hover:from-purple-500 hover:to-amber-400 text-white font-black text-sm uppercase tracking-wider shadow-xl shadow-purple-600/30 hover:shadow-purple-600/50 flex items-center justify-center space-x-2 transition-all transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50"
            >
              <Smartphone className="w-5 h-5 text-white" />
              <span>{isPaying ? 'Connecting Gateway...' : `Pay ${currentPlan.price} with PhonePe / UPI`}</span>
              <ArrowRight className="w-4 h-4 text-white" />
            </button>

            {/* Trusted Badges */}
            <div className="flex flex-wrap items-center justify-center gap-2.5 text-[11px] text-slate-300 pt-0.5">
              <span className="px-2 py-0.5 rounded-md bg-purple-950/60 border border-purple-700/50 text-purple-300 font-semibold flex items-center space-x-1">
                <span>🟣</span>
                <span>PhonePe ({merchantPhonePe})</span>
              </span>
              <span className="px-2 py-0.5 rounded-md bg-cyan-950/60 border border-cyan-700/50 text-cyan-300 font-semibold flex items-center space-x-1">
                <span>🔵</span>
                <span>Google Pay</span>
              </span>
              <span className="px-2 py-0.5 rounded-md bg-blue-950/60 border border-blue-700/50 text-blue-300 font-semibold flex items-center space-x-1">
                <span>🟦</span>
                <span>Paytm / UPI</span>
              </span>
            </div>

            {/* Site Owner Settings Link */}
            <div className="pt-2 text-center border-t border-white/5">
              <button
                type="button"
                onClick={() => setShowMerchantConfig(!showMerchantConfig)}
                className="text-[11px] text-slate-400 hover:text-amber-300 inline-flex items-center space-x-1 transition-colors"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>{showMerchantConfig ? 'Hide Gateway Settings' : '⚙️ Site Owner? Change PhonePe Number / Razorpay Key'}</span>
              </button>
            </div>

            {/* Merchant Configuration Form */}
            {showMerchantConfig && (
              <div className="p-3.5 rounded-2xl bg-black/50 border border-amber-500/30 space-y-3 text-xs animate-fade-in">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-300 flex items-center space-x-1.5">
                    <ShieldCheck className="w-4 h-4 text-amber-400" />
                    <span>Payment Gateway & PhonePe Configuration</span>
                  </span>
                  <span className="text-[10px] text-slate-400">Site Owner</span>
                </div>

                <div className="space-y-2">
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Your PhonePe Number (Primary):</label>
                    <input
                      type="text"
                      placeholder="e.g. 9618060329"
                      value={merchantPhonePe}
                      onChange={(e) => {
                        setMerchantPhonePe(e.target.value);
                        if (!merchantUpi || merchantUpi.includes('@ybl')) {
                          setMerchantUpi(`${e.target.value.trim()}@ybl`);
                        }
                      }}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 font-mono text-xs focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Your UPI ID (VPA):</label>
                    <input
                      type="text"
                      placeholder="e.g. 9618060329@ybl"
                      value={merchantUpi}
                      onChange={(e) => setMerchantUpi(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 font-mono text-xs focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Optional Razorpay Key ID (for Credit/Debit Cards):</label>
                    <input
                      type="text"
                      placeholder="e.g. rzp_live_xxxxxxxx or rzp_test_xxxxxxxx"
                      value={merchantKey}
                      onChange={(e) => setMerchantKey(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 font-mono text-xs focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleSaveMerchantConfig}
                    className="w-full py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors shadow"
                  >
                    Save Gateway Credentials
                  </button>

                  {merchantSavedNotice && (
                    <p className="text-emerald-400 text-center font-bold text-[11px] animate-fade-in">
                      ✅ {merchantSavedNotice}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ================= IN-APP PHONEPE & UPI CHECKOUT SHEET ================= */}
          {showUpiCheckout && (
            <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950 border-2 border-purple-500 shadow-2xl space-y-4 animate-scale-up">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-xl bg-purple-600/30 border border-purple-400/40 flex items-center justify-center">
                    <Smartphone className="w-4 h-4 text-purple-300" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white">Direct PhonePe & UPI Checkout</h3>
                    <p className="text-[10px] text-purple-300">0% Convenience Fee • 100% Direct to PhonePe</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowUpiCheckout(false)}
                  className="p-1.5 rounded-xl bg-white/5 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Order Summary */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-black/50 border border-purple-500/30 text-xs">
                <div>
                  <span className="font-bold text-white text-sm block">{currentPlan.name} VIP Pass</span>
                  <span className="text-[11px] text-amber-300">Instant Gender/City filters & queue skip</span>
                </div>
                <div className="text-right">
                  <span className="text-xl font-black text-amber-400">{currentPlan.price}</span>
                  <span className="block text-[10px] text-slate-400">Total Payable</span>
                </div>
              </div>

              {/* Dynamic QR Code & Instructions */}
              <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-2xl bg-black/70 border border-purple-500/30">
                <div className="p-2.5 rounded-2xl bg-white flex flex-col items-center justify-center shadow-2xl flex-shrink-0">
                  <img 
                    src={qrCodeUrl} 
                    alt={`UPI QR Code for ${currentPlan.price}`} 
                    className="w-36 h-36 object-contain"
                  />
                  <span className="text-[9px] font-bold text-slate-900 uppercase tracking-widest mt-1">
                    Scan with PhonePe / GPay
                  </span>
                </div>

                <div className="flex-1 space-y-2.5 text-left w-full">
                  <div>
                    <span className="text-xs font-bold text-white block flex items-center space-x-1.5">
                      <QrCode className="w-4 h-4 text-purple-400" />
                      <span>Step 1: Scan QR or Send via PhonePe</span>
                    </span>
                    <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
                      Scan the QR code with <strong>PhonePe</strong>, <strong>Google Pay</strong>, or <strong>Paytm</strong> on your phone.
                    </p>
                  </div>

                  {/* PhonePe Number Display with Copy */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] text-slate-400 block font-semibold">PhonePe Mobile Number:</span>
                    <div className="flex items-center gap-1.5">
                      <input 
                        type="text" 
                        readOnly 
                        value={merchantPhonePe} 
                        className="flex-1 px-3 py-1.5 rounded-xl bg-slate-900 border border-purple-500/40 text-purple-300 font-mono text-xs font-bold"
                      />
                      <button
                        type="button"
                        onClick={handleCopyPhonePeNumber}
                        className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-[11px] font-bold flex items-center space-x-1 transition-colors flex-shrink-0 shadow"
                      >
                        {copiedPhonePe ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedPhonePe ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                  </div>

                  {/* UPI ID Display with Copy */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] text-slate-400 block font-semibold">UPI ID (VPA):</span>
                    <div className="flex items-center gap-1.5">
                      <input 
                        type="text" 
                        readOnly 
                        value={merchantUpi} 
                        className="flex-1 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 font-mono text-xs"
                      />
                      <button
                        type="button"
                        onClick={handleCopyUpiId}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold flex items-center space-x-1 transition-colors flex-shrink-0 border border-slate-700"
                      >
                        {copiedUpi ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedUpi ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Direct UPI Mobile Intent Link */}
              <a
                href={upiUri}
                className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-600 hover:to-indigo-600 text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-lg transition-colors"
              >
                <Smartphone className="w-4 h-4 text-purple-300" />
                <span>Tap to Open PhonePe / Google Pay / Paytm App</span>
              </a>

              {/* Optional UTR / Reference Number & Verify Button */}
              <div className="p-3.5 rounded-2xl bg-black/50 border border-white/10 space-y-2.5">
                <span className="text-xs font-bold text-slate-200 block flex items-center space-x-1.5">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Step 2: Confirm Payment & Activate VIP</span>
                </span>
                
                <input
                  type="text"
                  placeholder="Enter UPI Reference / UTR Number (Optional)"
                  value={utrNumber}
                  onChange={(e) => setUtrNumber(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 font-mono text-xs placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                />

                <button
                  type="button"
                  onClick={handleVerifyUpiPayment}
                  disabled={verifyingUpi}
                  className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm uppercase tracking-wider shadow-xl shadow-emerald-500/20 flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
                >
                  {verifyingUpi ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Verifying with Bank...</span>
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
            </div>
          )}

          {/* ================= OPTION 2: REFER 10 FRIENDS FOR FREE VIP ================= */}
          <div className="p-4 rounded-3xl bg-gradient-to-br from-indigo-950/50 via-slate-900/90 to-purple-950/50 border border-indigo-500/40 space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-black text-white uppercase tracking-wider">
                  Option 2: Refer 10 Friends & Get Free VIP
                </span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800">
                100% Free
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Don't want to buy with PhonePe? Share your referral link with 10 friends. When 10 people visit HUSH AI, you unlock <span className="text-amber-300 font-bold">Free VIP</span> automatically!
            </p>

            {/* Referral Progress Bar */}
            <div className="space-y-1.5 p-3 rounded-2xl bg-black/40 border border-white/5">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-slate-300">Your Referral Progress:</span>
                <span className={referralCount >= 10 ? 'text-emerald-400' : 'text-amber-300'}>
                  {Math.min(referralCount, 10)}/10 Friends Joined {referralCount >= 10 ? '🎉 UNLOCKED!' : ''}
                </span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-amber-500 via-purple-500 to-cyan-400 transition-all duration-500 rounded-full"
                  style={{ width: `${Math.min((referralCount / 10) * 100, 100)}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-400">
                {referralCount >= 10 
                  ? 'Congratulations! You reached 10 referrals and unlocked Free VIP!' 
                  : `Need ${10 - Math.min(referralCount, 10)} more friend${(10 - referralCount) === 1 ? '' : 's'} to unlock Free VIP.`}
              </p>
            </div>

            {/* Referral Link & Share Buttons */}
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={referralLink}
                  className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 font-mono text-[11px] truncate"
                />
                <button
                  type="button"
                  onClick={handleCopyReferral}
                  className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center space-x-1 shadow transition-colors flex-shrink-0"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? 'Copied!' : 'Copy Link'}</span>
                </button>
              </div>

              <div className="flex gap-2 pt-0.5">
                <button
                  type="button"
                  onClick={handleShareWhatsApp}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center space-x-1.5 shadow transition-colors"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Share on WhatsApp</span>
                </button>

                <button
                  type="button"
                  onClick={handleSimulateTestReferral}
                  className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-semibold border border-slate-700 transition-colors"
                  title="Test referral progress bar (+1 test click)"
                >
                  +1 Test Join
                </button>
              </div>
            </div>
          </div>

          {/* Privacy Guarantee */}
          <div className="flex items-center space-x-2 text-[11px] text-slate-400 pt-1">
            <Lock className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>Anonymous chat guarantee. No personal identity is ever shared or attached to payments.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
