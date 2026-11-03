import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  Package,
  Printer,
  ArrowRight,
  Truck,
  MapPin,
  Clock,
  ShieldCheck,
  Eye,
  X,
  Image as ImageIcon
} from 'lucide-react';
import type { Order } from '../types/index.ts';
import { api } from '../services/api.ts';

interface OrderConfirmationViewProps {
  orderNumber: string;
  cachedOrder?: Order | null;
  onNavigate: (view: string, param?: string) => void;
}

export const OrderConfirmationView: React.FC<OrderConfirmationViewProps> = ({
  orderNumber,
  cachedOrder,
  onNavigate,
}) => {
  const [order, setOrder] = useState<Order | null>(cachedOrder || null);
  const [loading, setLoading] = useState(!cachedOrder);
  const [error, setError] = useState<string | null>(null);
  const [showProofModal, setShowProofModal] = useState<boolean>(false);

  useEffect(() => {
    if (!cachedOrder && orderNumber) {
      setLoading(true);
      api.getOrder(orderNumber)
        .then((ord) => {
          setOrder(ord);
          setLoading(false);
        })
        .catch((err) => {
          setError(err.message || 'Failed to load order receipt');
          setLoading(false);
        });
    }
  }, [orderNumber, cachedOrder]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-3">
        <div className="w-10 h-10 border-4 border-[#087A42] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-[#5E695E]">Loading order receipt...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-lg font-bold text-[#202720]">Order Not Found</h2>
        <p className="text-xs text-[#5E695E]">{error || 'Unable to locate this order.'}</p>
        <button
          onClick={() => onNavigate('shop')}
          className="px-5 py-2.5 bg-[#087A42] text-white text-xs font-semibold rounded-lg"
        >
          Return to Store
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Success Hero Card */}
      <div className="bg-white rounded-3xl border border-[#E5E8E3] p-6 sm:p-10 text-center space-y-4 shadow-xs">
        <div className="w-16 h-16 rounded-full bg-[#E8F5EE] text-[#087A42] flex items-center justify-center mx-auto shadow-xs">
          <CheckCircle2 className="w-9 h-9" />
        </div>
        <div>
          <span className="text-xs font-bold text-[#087A42] uppercase tracking-wider">
            Order Confirmed
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#202720] mt-1">
            Thank You, {order.customer.fullName.split(' ')[0]}!
          </h1>
          <p className="text-xs sm:text-sm text-[#5E695E] mt-1">
            We've received your order and are preparing it for dispatch from our fulfillment warehouse.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 bg-[#F7F8F6] px-4 py-2 rounded-xl border border-[#E5E8E3] text-xs">
          <span className="text-[#5E695E]">Order Reference:</span>
          <strong className="font-mono text-[#202720]">{order.orderNumber}</strong>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            onClick={() => onNavigate('track-order', order.orderNumber)}
            className="px-5 py-2.5 bg-[#087A42] hover:bg-[#066336] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
          >
            <Package className="w-4 h-4" />
            <span>Track Order Status</span>
          </button>
          <button
            onClick={handlePrint}
            className="px-5 py-2.5 bg-[#F7F8F6] hover:bg-[#E5E8E3] text-[#202720] text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4 text-[#5E695E]" />
            <span>Print Receipt</span>
          </button>
        </div>
      </div>

      {/* Order Details & Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Delivery Address */}
        <div className="bg-white rounded-3xl border border-[#E5E8E3] p-6 space-y-3 shadow-xs">
          <h3 className="text-xs font-bold text-[#202720] uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-[#E5E8E3]">
            <MapPin className="w-4 h-4 text-[#087A42]" />
            <span>Delivery Address</span>
          </h3>
          <div className="text-xs text-[#5E695E] space-y-1">
            <p className="font-bold text-[#202720]">{order.customer.fullName}</p>
            <p>{order.customer.addressLine}</p>
            {order.customer.landmark && <p>Landmark: {order.customer.landmark}</p>}
            <p>{order.customer.city}, {order.customer.state} - {order.customer.pincode}</p>
            <p className="pt-2 text-[#202720]">Phone: +91 {order.customer.phone}</p>
            <p className="text-[#202720]">Email: {order.customer.email}</p>
          </div>
        </div>

        {/* Payment & Shipping Summary */}
        <div className="bg-white rounded-3xl border border-[#E5E8E3] p-6 space-y-3 shadow-xs">
          <h3 className="text-xs font-bold text-[#202720] uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-[#E5E8E3]">
            <ShieldCheck className="w-4 h-4 text-[#FF7900]" />
            <span>Payment & Delivery Breakdown</span>
          </h3>
          <div className="text-xs text-[#5E695E] space-y-2">
            <div className="flex justify-between">
              <span>Payment Mode:</span>
              <strong className="text-[#202720] font-semibold">
                {order.paymentMethod === 'cod'
                  ? 'Cash on Delivery (COD)'
                  : 'Full UPI Instant Payment'}
              </strong>
            </div>

            {order.paymentMethod === 'cod' ? (
              <>
                <div className="flex justify-between text-[#087A42]">
                  <span>Advance Token Paid (UPI):</span>
                  <strong className="font-bold">₹{order.paymentDetails?.advancePaid ?? 99}</strong>
                </div>
                <div className="flex justify-between text-[#202720] bg-[#FFF4E5] p-2 rounded-xl border border-orange-200">
                  <span className="font-semibold text-[#FF7900]">Collect at Doorstep:</span>
                  <strong className="font-bold text-[#FF7900] tabular-nums">
                    ₹{order.paymentDetails?.balanceDueOnDelivery ?? Math.max(0, order.total - 99)}
                  </strong>
                </div>
              </>
            ) : (
              <div className="flex justify-between text-[#087A42]">
                <span>Total Amount Paid (UPI):</span>
                <strong className="font-bold">₹{order.total} (Fully Paid)</strong>
              </div>
            )}

            {order.paymentDetails?.utrNumber && (
              <div className="flex justify-between">
                <span>UPI Ref / UTR:</span>
                <span className="font-mono text-[11px] text-[#202720]">{order.paymentDetails.utrNumber}</span>
              </div>
            )}

            {order.paymentDetails?.paymentProofUrl && (
              <div className="flex items-center justify-between p-2 bg-[#E8F5EE] rounded-xl border border-[#087A42]/20">
                <span className="flex items-center gap-1.5 font-semibold text-[#087A42]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#087A42]" />
                  <span>Payment Proof:</span>
                </span>
                <button
                  type="button"
                  onClick={() => setShowProofModal(true)}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-[#087A42] hover:underline cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>View Screenshot</span>
                </button>
              </div>
            )}

            <div className="flex justify-between pt-1 border-t border-[#E5E8E3]">
              <span>Estimated Delivery:</span>
              <strong className="text-[#202720]">{order.shippingDetails?.estimatedDelivery || '3-5 business days'}</strong>
            </div>

            <div className="pt-2">
              <a
                href={`https://wa.me/919876543210?text=${encodeURIComponent(
                  `Hi FanKO Store, I have placed order #${order.orderNumber} for ₹${order.total} (${
                    order.paymentMethod === 'cod'
                      ? `COD with ₹${order.paymentDetails?.advancePaid || 99} Advance Paid`
                      : 'Full UPI Paid'
                  }). Please confirm dispatch!`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-3 bg-[#E8F5EE] hover:bg-[#d5eee0] text-[#087A42] font-bold text-xs rounded-xl flex items-center justify-center gap-2 border border-[#087A42]/30 transition-colors"
              >
                <span>Share Order Confirmation on WhatsApp</span>
              </a>
            </div>
          </div>
        </div>

      </div>

      {/* Purchased Items List */}
      <div className="bg-white rounded-3xl border border-[#E5E8E3] p-6 sm:p-8 space-y-4 shadow-xs">
        <h3 className="text-xs font-bold text-[#202720] uppercase tracking-wider pb-3 border-b border-[#E5E8E3]">
          Items Ordered ({order.items.length})
        </h3>

        <div className="divide-y divide-[#E5E8E3]">
          {order.items.map((item, idx) => (
            <div key={idx} className="py-3 flex items-center gap-4">
              <img
                src={item.image}
                alt={item.name}
                className="w-14 h-14 object-contain rounded-xl bg-[#F7F8F6] p-1 border border-[#E5E8E3]"
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-[#202720] truncate">{item.name}</p>
                <p className="text-[11px] text-[#5E695E]">SKU: {item.sku} · Qty: {item.quantity}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-[#202720] tabular-nums">₹{item.subtotal}</p>
                <p className="text-[10px] text-slate-400">₹{item.price} each</p>
              </div>
            </div>
          ))}
        </div>

        <div className="pt-4 border-t border-[#E5E8E3] space-y-1.5 text-xs text-[#5E695E] max-w-xs ml-auto">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span className="font-semibold text-[#202720] tabular-nums">₹{order.subtotal}</span>
          </div>
          {order.discount > 0 && (
            <div className="flex justify-between text-[#087A42]">
              <span>Discount ({order.couponCode})</span>
              <span className="font-semibold tabular-nums">-₹{order.discount}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span>Shipping</span>
            <span className="font-semibold text-[#202720] tabular-nums">
              {order.shippingFee === 0 ? 'FREE' : `₹${order.shippingFee}`}
            </span>
          </div>
          <div className="pt-2 border-t border-[#E5E8E3] flex justify-between text-sm font-extrabold text-[#202720]">
            <span>Total Paid / Payable</span>
            <span className="text-[#087A42] tabular-nums">₹{order.total}</span>
          </div>
        </div>
      </div>

      <div className="text-center pt-4">
        <button
          onClick={() => onNavigate('shop')}
          className="text-xs font-bold text-[#087A42] hover:underline inline-flex items-center gap-1.5"
        >
          <span>Continue Shopping at FanKO Store</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Customer Payment Screenshot Modal */}
      {showProofModal && order.paymentDetails?.paymentProofUrl && (
        <div className="fixed inset-0 z-60 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 space-y-3 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-[#E5E8E3]">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#087A42]" />
                <h4 className="text-xs font-bold text-[#202720]">Uploaded Payment Proof</h4>
              </div>
              <button
                type="button"
                onClick={() => setShowProofModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="max-h-[65vh] overflow-auto flex items-center justify-center bg-slate-50 rounded-2xl p-2 border border-[#E5E8E3]">
              <img
                src={order.paymentDetails.paymentProofUrl}
                alt="Payment screenshot proof"
                className="max-h-[60vh] max-w-full object-contain rounded-xl"
              />
            </div>
            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() => setShowProofModal(false)}
                className="px-4 py-2 bg-[#087A42] hover:bg-[#066336] text-white text-xs font-bold rounded-xl cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
