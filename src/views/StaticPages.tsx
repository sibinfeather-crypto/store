import React, { useState } from 'react';
import {
  Mail,
  Phone,
  MessageCircle,
  HelpCircle,
  Truck,
  RefreshCw,
  ShieldCheck,
  FileText,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { api } from '../services/api.ts';

interface StaticPagesProps {
  page: 'about' | 'contact' | 'faqs' | 'shipping' | 'returns' | 'privacy' | 'terms';
  onNavigate: (view: string, param?: string) => void;
  whatsappNumber?: string;
  supportEmail?: string;
}

export const StaticPages: React.FC<StaticPagesProps> = ({
  page,
  onNavigate,
  whatsappNumber = '919876543210',
  supportEmail = 'support@fankostore.in',
}) => {
  // Contact Form state
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactSubject, setContactSubject] = useState('');
  const [contactMsg, setContactMsg] = useState('');
  const [sending, setSending] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setSendError(null);
    try {
      await api.sendContact({
        name: contactName,
        email: contactEmail,
        phone: contactPhone,
        subject: contactSubject,
        message: contactMsg,
      });
      setSentSuccess(true);
      setContactName('');
      setContactEmail('');
      setContactPhone('');
      setContactSubject('');
      setContactMsg('');
    } catch (err: any) {
      setSendError(err.message || 'Failed to send message. Please try WhatsApp support.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* 1. About Us */}
      {page === 'about' && (
        <div className="space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-bold text-[#087A42] uppercase tracking-wider">
              Our Story
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#202720]">
              About FanKO Store
            </h1>
            <p className="text-sm text-[#5E695E]">
              Smart Products. Better Living.
            </p>
          </div>

          <div className="bg-white rounded-3xl border border-[#E5E8E3] p-6 sm:p-10 space-y-6 shadow-xs text-sm text-[#5E695E] leading-relaxed">
            <p>
              At <strong className="text-[#202720]">FanKO Store</strong>, we believe an organized, clutter-free home creates mental clarity and brings joy to daily living. We curate and craft smart, durable kitchen essentials, countertop organizers, storage solutions, and daily-use accessories specifically designed for contemporary Indian households.
            </p>

            <h2 className="text-base font-bold text-[#202720] pt-2">Our Mission</h2>
            <p>
              To replace clumsy, single-purpose plastic clutter with thoughtfully engineered, long-lasting organizational tools that simplify everyday tasks—from morning tea and cooking prep to vanity grooming and hygiene.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-[#E5E8E3]">
              <div className="p-4 bg-[#F7F8F6] rounded-2xl">
                <p className="font-bold text-[#202720] mb-1">Functional Design</p>
                <p className="text-xs">Every product solves a specific friction point in daily Indian home routines.</p>
              </div>
              <div className="p-4 bg-[#F7F8F6] rounded-2xl">
                <p className="font-bold text-[#202720] mb-1">Durable Materials</p>
                <p className="text-xs">Food-grade borosilicate glass, BPA-free plastics, and heavy-duty springs built to last.</p>
              </div>
              <div className="p-4 bg-[#F7F8F6] rounded-2xl">
                <p className="font-bold text-[#202720] mb-1">Pan-India Support</p>
                <p className="text-xs">Fast doorstep shipping, responsive WhatsApp customer care, and easy replacements.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Contact Us */}
      {page === 'contact' && (
        <div className="space-y-8">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <span className="text-xs font-bold text-[#087A42] uppercase tracking-wider">
              Get in Touch
            </span>
            <h1 className="text-3xl font-extrabold text-[#202720]">
              Contact Customer Care
            </h1>
            <p className="text-xs sm:text-sm text-[#5E695E]">
              We're here to assist you with order tracking, product specifications, or delivery queries.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* WhatsApp Card */}
            <div className="bg-white rounded-3xl border border-[#E5E8E3] p-6 text-center space-y-3 shadow-xs">
              <div className="w-12 h-12 rounded-2xl bg-[#E8F5EE] text-[#087A42] flex items-center justify-center mx-auto">
                <MessageCircle className="w-6 h-6" />
              </div>
              <h2 className="text-sm font-bold text-[#202720]">WhatsApp Chat</h2>
              <p className="text-xs text-[#5E695E]">Fastest responses for order updates & photo queries.</p>
              <a
                href={`https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}?text=Hi%20FanKO%20Store%2C%20I%20have%20an%20inquiry`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block px-4 py-2 bg-[#087A42] text-white text-xs font-bold rounded-xl hover:bg-[#066336] transition-colors"
              >
                Chat on WhatsApp
              </a>
            </div>

            {/* Email Support Card */}
            <div className="bg-white rounded-3xl border border-[#E5E8E3] p-6 text-center space-y-3 shadow-xs">
              <div className="w-12 h-12 rounded-2xl bg-[#FFF4E5] text-[#FF7900] flex items-center justify-center mx-auto">
                <Mail className="w-6 h-6" />
              </div>
              <h2 className="text-sm font-bold text-[#202720]">Email Support</h2>
              <p className="text-xs text-[#5E695E]">Official customer care and corporate inquiries.</p>
              <a
                href={`mailto:${supportEmail}`}
                className="inline-block px-4 py-2 bg-[#202720] text-white text-xs font-bold rounded-xl hover:bg-black transition-colors"
              >
                {supportEmail}
              </a>
            </div>

            {/* Hours Card */}
            <div className="bg-white rounded-3xl border border-[#E5E8E3] p-6 text-center space-y-3 shadow-xs">
              <div className="w-12 h-12 rounded-2xl bg-[#F7F8F6] text-[#202720] flex items-center justify-center mx-auto">
                <Phone className="w-6 h-6" />
              </div>
              <h2 className="text-sm font-bold text-[#202720]">Support Hours</h2>
              <p className="text-xs text-[#5E695E]">Monday to Saturday</p>
              <p className="text-xs font-bold text-[#202720]">10:00 AM - 7:00 PM IST</p>
            </div>

          </div>

          {/* Contact Message Form */}
          <div className="bg-white rounded-3xl border border-[#E5E8E3] p-6 sm:p-10 shadow-xs">
            <h2 className="text-base font-bold text-[#202720] mb-4">Send Us a Direct Message</h2>
            
            {sentSuccess ? (
              <div className="p-6 bg-[#E8F5EE] border border-[#087A42]/20 rounded-2xl text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-[#087A42] mx-auto" />
                <h3 className="text-sm font-bold text-[#202720]">Message Sent Successfully</h3>
                <p className="text-xs text-[#5E695E]">
                  Our customer support representative will review your message and reply via email or WhatsApp within 24 hours.
                </p>
                <button
                  onClick={() => setSentSuccess(false)}
                  className="mt-2 text-xs text-[#087A42] font-semibold hover:underline"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleContactSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-[#202720] block mb-1">Your Name *</label>
                    <input
                      type="text"
                      required
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      className="w-full text-xs px-3.5 py-2.5 bg-[#F7F8F6] border border-[#E5E8E3] rounded-xl focus:outline-none focus:border-[#087A42]"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-[#202720] block mb-1">Email Address *</label>
                    <input
                      type="email"
                      required
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      className="w-full text-xs px-3.5 py-2.5 bg-[#F7F8F6] border border-[#E5E8E3] rounded-xl focus:outline-none focus:border-[#087A42]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-[#202720] block mb-1">Phone Number (Optional)</label>
                    <input
                      type="tel"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      className="w-full text-xs px-3.5 py-2.5 bg-[#F7F8F6] border border-[#E5E8E3] rounded-xl focus:outline-none focus:border-[#087A42]"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-[#202720] block mb-1">Subject</label>
                    <input
                      type="text"
                      placeholder="e.g. Order Tracking Inquiry or Product Question"
                      value={contactSubject}
                      onChange={(e) => setContactSubject(e.target.value)}
                      className="w-full text-xs px-3.5 py-2.5 bg-[#F7F8F6] border border-[#E5E8E3] rounded-xl focus:outline-none focus:border-[#087A42]"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-[#202720] block mb-1">Message *</label>
                  <textarea
                    rows={4}
                    required
                    value={contactMsg}
                    onChange={(e) => setContactMsg(e.target.value)}
                    placeholder="How can we help you?"
                    className="w-full text-xs p-3.5 bg-[#F7F8F6] border border-[#E5E8E3] rounded-xl focus:outline-none focus:border-[#087A42]"
                  />
                </div>

                {sendError && (
                  <p className="text-xs text-rose-600 font-semibold">{sendError}</p>
                )}

                <button
                  type="submit"
                  disabled={sending}
                  className="px-6 py-3 bg-[#087A42] hover:bg-[#066336] text-white text-xs font-bold rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {sending ? 'Sending...' : 'Send Message'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* 3. FAQs */}
      {page === 'faqs' && (
        <div className="space-y-8">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <span className="text-xs font-bold text-[#087A42] uppercase tracking-wider">
              Help Center
            </span>
            <h1 className="text-3xl font-extrabold text-[#202720]">
              Frequently Asked Questions
            </h1>
            <p className="text-xs sm:text-sm text-[#5E695E]">
              Clear answers to common questions about orders, payments, shipping, and returns.
            </p>
          </div>

          <div className="bg-white rounded-3xl border border-[#E5E8E3] p-6 sm:p-10 divide-y divide-[#E5E8E3] shadow-xs space-y-6">
            <div className="pt-4 first:pt-0">
              <h2 className="text-sm font-bold text-[#202720] mb-2">How long does shipping take across India?</h2>
              <p className="text-xs text-[#5E695E] leading-relaxed">
                All orders are dispatched from our central warehouse within 24 to 48 hours. Depending on your Indian postal code, deliveries to metro cities typically take 2-4 business days, while tier-2 and tier-3 regions take 3-6 business days.
              </p>
            </div>

            <div className="pt-6">
              <h2 className="text-sm font-bold text-[#202720] mb-2">Is Cash on Delivery (COD) available?</h2>
              <p className="text-xs text-[#5E695E] leading-relaxed">
                Yes! Cash on Delivery is available for all eligible pin codes across India with no mandatory advance registration. You can pay cash or scan the delivery agent's UPI QR code upon arrival.
              </p>
            </div>

            <div className="pt-6">
              <h2 className="text-sm font-bold text-[#202720] mb-2">What payment methods do you accept online?</h2>
              <p className="text-xs text-[#5E695E] leading-relaxed">
                We accept all major payment methods powered securely by Razorpay: UPI (Google Pay, PhonePe, Paytm, BHIM), RuPay cards, Visa, Mastercard, and NetBanking across 50+ Indian banks.
              </p>
            </div>

            <div className="pt-6">
              <h2 className="text-sm font-bold text-[#202720] mb-2">What if I receive a broken or defective item?</h2>
              <p className="text-xs text-[#5E695E] leading-relaxed">
                We offer a hassle-free 7-day replacement policy. If any item arrives damaged during transit or contains a manufacturing defect, simply contact our WhatsApp support with your order number and photos of the package. We will dispatch a free replacement or issue a full refund.
              </p>
            </div>

            <div className="pt-6">
              <h2 className="text-sm font-bold text-[#202720] mb-2">How do I track my package?</h2>
              <p className="text-xs text-[#5E695E] leading-relaxed">
                You can track your order status directly on our website using the "Track Order" link in the menu by entering your unique order reference (e.g. FKO-2026-1042).
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 4. Shipping Policy */}
      {page === 'shipping' && (
        <div className="space-y-6">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <span className="text-xs font-bold text-[#087A42] uppercase tracking-wider">Policies</span>
            <h1 className="text-3xl font-extrabold text-[#202720]">Shipping Policy</h1>
          </div>
          <div className="bg-white rounded-3xl border border-[#E5E8E3] p-6 sm:p-10 space-y-5 text-xs text-[#5E695E] leading-relaxed shadow-xs">
            <h2 className="text-sm font-bold text-[#202720]">1. Pan-India Delivery Coverage</h2>
            <p>FanKO Store delivers to over 19,000+ pin codes across all Indian states and Union Territories through reputed logistics partners.</p>

            <h2 className="text-sm font-bold text-[#202720]">2. Processing & Dispatch Timelines</h2>
            <p>Orders placed before 2:00 PM IST on business days are dispatched the same day. All other orders are dispatched within 24 to 48 hours, excluding Sundays and national holidays.</p>

            <h2 className="text-sm font-bold text-[#202720]">3. Shipping Rates</h2>
            <p>• <strong>Free Pan-India Delivery:</strong> On all orders of ₹499 and above.</p>
            <p>• <strong>Standard Shipping:</strong> A nominal delivery fee of ₹49 is applied to orders below ₹499.</p>

            <h2 className="text-sm font-bold text-[#202720]">4. Courier Partners & Tracking</h2>
            <p>Once dispatched, you will receive an SMS and email notification with your tracking number (AWB) and courier tracking link. Real tracking updates will reflect once scanned at the initial courier sorting hub.</p>
          </div>
        </div>
      )}

      {/* 5. Return & Refund Policy */}
      {page === 'returns' && (
        <div className="space-y-6">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <span className="text-xs font-bold text-[#087A42] uppercase tracking-wider">Policies</span>
            <h1 className="text-3xl font-extrabold text-[#202720]">Return & Refund Policy</h1>
          </div>
          <div className="bg-white rounded-3xl border border-[#E5E8E3] p-6 sm:p-10 space-y-5 text-xs text-[#5E695E] leading-relaxed shadow-xs">
            <h2 className="text-sm font-bold text-[#202720]">7-Day Replacement Guarantee</h2>
            <p>We take quality seriously. If you receive an item that is damaged during transit, missing components, or defective, you are eligible for a free replacement within 7 calendar days of delivery.</p>

            <h2 className="text-sm font-bold text-[#202720]">How to Request a Replacement:</h2>
            <ol className="list-decimal pl-5 space-y-1">
              <li>Take clear photos or a short video showing the outer shipping label and the damaged/defective product.</li>
              <li>Send the media along with your Order Number to our WhatsApp support (+{whatsappNumber}) or email support@fankostore.in.</li>
              <li>Our team will verify the claim within 24 business hours and arrange a replacement dispatch or return pickup.</li>
            </ol>

            <h2 className="text-sm font-bold text-[#202720]">Refund Processing</h2>
            <p>For prepaid Razorpay orders, refunds are processed back to the original source method (UPI/card/bank) within 5-7 working days. For COD orders, refunds are issued via direct UPI transfer to your verified account.</p>
          </div>
        </div>
      )}

      {/* 6. Privacy Policy */}
      {page === 'privacy' && (
        <div className="space-y-6">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <span className="text-xs font-bold text-[#087A42] uppercase tracking-wider">Legal</span>
            <h1 className="text-3xl font-extrabold text-[#202720]">Privacy Policy</h1>
          </div>
          <div className="bg-white rounded-3xl border border-[#E5E8E3] p-6 sm:p-10 space-y-5 text-xs text-[#5E695E] leading-relaxed shadow-xs">
            <p>At FanKO Store, your privacy and data security are paramount. We comply with Indian Digital Personal Data Protection (DPDP) principles.</p>
            <h2 className="text-sm font-bold text-[#202720]">1. Information We Collect</h2>
            <p>We collect essential delivery information: customer full name, delivery address, postal PIN code, mobile phone number, and email address solely for order processing, logistics dispatch, and invoice generation.</p>

            <h2 className="text-sm font-bold text-[#202720]">2. Payment Data Security</h2>
            <p>We never store or have access to your credit/debit card numbers, CVV, NetBanking passwords, or UPI PINs. All financial transactions are handled on 256-bit PCI-DSS compliant secure gateways managed directly by Razorpay.</p>

            <h2 className="text-sm font-bold text-[#202720]">3. No Data Selling</h2>
            <p>We do not sell, rent, or trade your personal information to third-party marketing brokers under any circumstances.</p>
          </div>
        </div>
      )}

      {/* 7. Terms & Conditions */}
      {page === 'terms' && (
        <div className="space-y-6">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <span className="text-xs font-bold text-[#087A42] uppercase tracking-wider">Legal</span>
            <h1 className="text-3xl font-extrabold text-[#202720]">Terms & Conditions</h1>
          </div>
          <div className="bg-white rounded-3xl border border-[#E5E8E3] p-6 sm:p-10 space-y-5 text-xs text-[#5E695E] leading-relaxed shadow-xs">
            <p>By accessing and purchasing from FanKO Store, you agree to the following terms:</p>
            <h2 className="text-sm font-bold text-[#202720]">1. Pricing & Currency</h2>
            <p>All prices displayed on FanKO Store are in Indian National Rupees (INR ₹) and are inclusive of all applicable Goods and Services Tax (GST).</p>

            <h2 className="text-sm font-bold text-[#202720]">2. Order Acceptance</h2>
            <p>Order receipt confirmation does not signify our final acceptance of your order. FanKO Store reserves the right to cancel or hold orders in case of product unavailability or suspected fraudulent payment attempts.</p>

            <h2 className="text-sm font-bold text-[#202720]">3. Governing Law & Jurisdiction</h2>
            <p>These terms and any transactions conducted on this website are governed by the laws of India, subject to exclusive jurisdiction of the competent courts in Gurugram / Haryana.</p>
          </div>
        </div>
      )}

    </div>
  );
};
