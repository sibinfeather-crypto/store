import React, { useState, useEffect } from 'react';
import {
  Search,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  ExternalLink,
  MapPin,
  AlertCircle
} from 'lucide-react';
import type { Order } from '../types/index.ts';
import { api } from '../services/api.ts';

interface TrackOrderViewProps {
  initialOrderNumber?: string;
  onNavigate: (view: string, param?: string) => void;
}

export const TrackOrderView: React.FC<TrackOrderViewProps> = ({
  initialOrderNumber = '',
  onNavigate,
}) => {
  const [orderNumber, setOrderNumber] = useState(initialOrderNumber);
  const [contact, setContact] = useState('');
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialOrderNumber) {
      handleLookup(initialOrderNumber);
    }
  }, [initialOrderNumber]);

  const handleLookup = async (lookupNumber = orderNumber) => {
    if (!lookupNumber.trim()) {
      setError('Please enter your order number (e.g. FKO-2026-1042).');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await api.trackOrder(lookupNumber.trim(), contact.trim() || undefined);
      setOrder(data);
    } catch (err: any) {
      setError(err.message || 'Unable to find tracking records for this order.');
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  const fulfillmentSteps = [
    { key: 'confirmed', label: 'Order Confirmed', icon: CheckCircle2 },
    { key: 'processing', label: 'Processing & Packed', icon: Clock },
    { key: 'shipped', label: 'Shipped with Courier', icon: Truck },
    { key: 'delivered', label: 'Delivered', icon: Package },
  ];

  const getStepIndex = (status: string) => {
    switch (status) {
      case 'confirmed': return 0;
      case 'processing': return 1;
      case 'shipped': return 2;
      case 'delivered': return 3;
      default: return -1;
    }
  };

  const currentStep = order ? getStepIndex(order.fulfillmentStatus) : -1;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Title */}
      <div className="text-center max-w-xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#202720]">
          Track Your Order
        </h1>
        <p className="text-xs sm:text-sm text-[#5E695E] mt-1.5">
          Enter your FanKO Store order number and phone or email to view live fulfillment updates and courier tracking.
        </p>
      </div>

      {/* Lookup Card */}
      <div className="bg-white rounded-3xl border border-[#E5E8E3] p-6 sm:p-8 shadow-xs">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleLookup();
          }}
          className="grid grid-cols-1 sm:grid-cols-12 gap-3"
        >
          <div className="sm:col-span-6">
            <label className="text-xs font-bold text-[#202720] block mb-1">
              Order Number *
            </label>
            <input
              type="text"
              placeholder="e.g. FKO-2026-1042"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value.toUpperCase())}
              required
              className="w-full text-xs px-3.5 py-2.5 bg-[#F7F8F6] border border-[#E5E8E3] rounded-xl focus:outline-none focus:border-[#087A42] uppercase font-mono"
            />
          </div>

          <div className="sm:col-span-4">
            <label className="text-xs font-bold text-[#202720] block mb-1">
              Phone or Email (Optional)
            </label>
            <input
              type="text"
              placeholder="10-digit mobile or email"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              className="w-full text-xs px-3.5 py-2.5 bg-[#F7F8F6] border border-[#E5E8E3] rounded-xl focus:outline-none focus:border-[#087A42]"
            />
          </div>

          <div className="sm:col-span-2 flex items-end">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-[#087A42] hover:bg-[#066336] text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Searching...' : 'Track'}
            </button>
          </div>
        </form>

        {error && (
          <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Tracking Result View */}
      {order && (
        <div className="space-y-6">
          
          {/* Status Header Card */}
          <div className="bg-white rounded-3xl border border-[#E5E8E3] p-6 sm:p-8 space-y-6 shadow-xs">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E5E8E3]">
              <div>
                <span className="text-[11px] font-bold text-[#087A42] uppercase tracking-wider">
                  Order Status
                </span>
                <h2 className="text-xl font-extrabold text-[#202720]">
                  {order.orderNumber}
                </h2>
                <p className="text-xs text-[#5E695E]">
                  Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                  order.fulfillmentStatus === 'delivered'
                    ? 'bg-emerald-100 text-emerald-800'
                    : order.fulfillmentStatus === 'cancelled'
                    ? 'bg-rose-100 text-rose-800'
                    : 'bg-[#E8F5EE] text-[#087A42]'
                }`}>
                  {order.fulfillmentStatus.replace(/_/g, ' ')}
                </span>
              </div>
            </div>

            {/* Stepper Bar (if not cancelled) */}
            {order.fulfillmentStatus !== 'cancelled' && (
              <div className="py-4">
                <div className="grid grid-cols-4 gap-2 relative">
                  {fulfillmentSteps.map((st, idx) => {
                    const isDone = currentStep >= idx;
                    const isCurrent = currentStep === idx;
                    const Icon = st.icon;

                    return (
                      <div key={st.key} className="flex flex-col items-center text-center space-y-2">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                          isDone
                            ? 'bg-[#087A42] text-white shadow-xs'
                            : 'bg-slate-100 text-slate-400'
                        } ${isCurrent ? 'ring-4 ring-[#087A42]/20' : ''}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <p className={`text-[11px] font-semibold leading-tight ${
                          isDone ? 'text-[#202720]' : 'text-slate-400'
                        }`}>
                          {st.label}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Courier Tracking Credentials (Authentic only, no fabricated updates) */}
            {order.shippingDetails?.courierName ? (
              <div className="p-4 bg-[#F7F8F6] rounded-2xl border border-[#E5E8E3] space-y-2 text-xs">
                <p className="font-bold text-[#202720] flex items-center gap-1.5">
                  <Truck className="w-4 h-4 text-[#087A42]" />
                  <span>Courier & Dispatch Details</span>
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div>
                    <span className="text-[#5E695E] block text-[11px]">Courier Partner:</span>
                    <strong className="text-[#202720]">{order.shippingDetails.courierName}</strong>
                  </div>
                  <div>
                    <span className="text-[#5E695E] block text-[11px]">Tracking AWB / Number:</span>
                    <strong className="text-[#202720] font-mono">{order.shippingDetails.trackingNumber || 'Available upon dispatch'}</strong>
                  </div>
                  <div>
                    {order.shippingDetails.trackingUrl && (
                      <a
                        href={order.shippingDetails.trackingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-[#087A42] font-bold hover:underline mt-2"
                      >
                        <span>Open Courier Portal</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-[#F7F8F6] rounded-2xl border border-[#E5E8E3] text-xs text-[#5E695E]">
                <p className="font-semibold text-[#202720]">Awaiting Courier Assignment</p>
                <p className="text-[11px] mt-0.5">
                  Our warehouse is verifying and packing your items. Tracking AWB details will appear here as soon as the courier scans your package.
                </p>
              </div>
            )}

            {/* Fulfillment History Timeline */}
            <div className="pt-4 border-t border-[#E5E8E3]">
              <h3 className="text-xs font-bold text-[#202720] uppercase tracking-wider mb-3">
                Status History
              </h3>
              <div className="space-y-3">
                {order.statusHistory.map((hist, i) => (
                  <div key={i} className="flex items-start gap-3 text-xs">
                    <div className="w-2 h-2 rounded-full bg-[#087A42] mt-1.5 shrink-0" />
                    <div className="flex-1">
                      <p className="font-semibold text-[#202720]">{hist.note}</p>
                      <p className="text-[11px] text-[#5E695E]">
                        {new Date(hist.timestamp).toLocaleString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Delivery Address & Item summary */}
          <div className="bg-white rounded-3xl border border-[#E5E8E3] p-6 space-y-4 shadow-xs">
            <h3 className="text-xs font-bold text-[#202720] uppercase tracking-wider pb-2 border-b border-[#E5E8E3]">
              Destination Address
            </h3>
            <p className="text-xs text-[#5E695E]">
              <strong className="text-[#202720]">{order.customer.fullName}</strong> — {order.customer.addressLine}, {order.customer.city}, {order.customer.state} ({order.customer.pincode})
            </p>
          </div>

        </div>
      )}

    </div>
  );
};
