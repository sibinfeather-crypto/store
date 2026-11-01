import React, { useState } from 'react';
import { User, MapPin, Package, LogOut, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

interface AccountViewProps {
  onNavigate: (view: string, param?: string) => void;
}

export const AccountView: React.FC<AccountViewProps> = ({ onNavigate }) => {
  const { customer, loginCustomer, logoutCustomer } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [quickOrderNumber, setQuickOrderNumber] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && email.trim() && phone.trim()) {
      loginCustomer(name.trim(), email.trim(), phone.trim());
    }
  };

  const handleQuickTrack = (e: React.FormEvent) => {
    e.preventDefault();
    if (quickOrderNumber.trim()) {
      onNavigate('track-order', quickOrderNumber.trim());
    }
  };

  if (!customer) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 space-y-6">
        <div className="bg-white rounded-3xl border border-[#E5E8E3] p-6 sm:p-8 space-y-6 shadow-xs text-center">
          <div className="w-14 h-14 rounded-full bg-[#E8F5EE] text-[#087A42] flex items-center justify-center mx-auto">
            <User className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-[#202720]">My Account</h1>
            <p className="text-xs text-[#5E695E] mt-1">
              Sign in with your name & contact to view saved addresses and track orders easily.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-3.5 text-left">
            <div>
              <label className="text-xs font-bold text-[#202720] block mb-1">Your Full Name</label>
              <input
                type="text"
                placeholder="e.g. Priya Patel"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full text-xs px-3.5 py-2.5 bg-[#F7F8F6] border border-[#E5E8E3] rounded-xl focus:outline-none focus:border-[#087A42]"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-[#202720] block mb-1">Email Address</label>
              <input
                type="email"
                placeholder="priya@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full text-xs px-3.5 py-2.5 bg-[#F7F8F6] border border-[#E5E8E3] rounded-xl focus:outline-none focus:border-[#087A42]"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-[#202720] block mb-1">Mobile Number</label>
              <input
                type="tel"
                placeholder="9876543210"
                maxLength={10}
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
                required
                className="w-full text-xs px-3.5 py-2.5 bg-[#F7F8F6] border border-[#E5E8E3] rounded-xl focus:outline-none focus:border-[#087A42]"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-[#087A42] hover:bg-[#066336] text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              Access Account
            </button>
          </form>

          <p className="text-[11px] text-[#5E695E]">
            Guest orders can also be tracked directly using the Order Reference number.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Profile Header */}
      <div className="bg-white rounded-3xl border border-[#E5E8E3] p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#E8F5EE] text-[#087A42] flex items-center justify-center font-extrabold text-xl">
            {customer.name[0]?.toUpperCase()}
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-[#202720]">{customer.name}</h1>
            <p className="text-xs text-[#5E695E]">{customer.email} · +91 {customer.phone}</p>
          </div>
        </div>

        <button
          onClick={logoutCustomer}
          className="px-4 py-2 bg-[#F7F8F6] hover:bg-rose-50 text-slate-600 hover:text-rose-600 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors border border-[#E5E8E3]"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Quick Order Tracker */}
        <div className="bg-white rounded-3xl border border-[#E5E8E3] p-6 space-y-4 shadow-xs">
          <h2 className="text-sm font-bold text-[#202720] flex items-center gap-2 pb-2 border-b border-[#E5E8E3]">
            <Package className="w-4 h-4 text-[#087A42]" />
            <span>Track An Order</span>
          </h2>
          <p className="text-xs text-[#5E695E]">
            Have an order number from your confirmation email or SMS?
          </p>
          <form onSubmit={handleQuickTrack} className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. FKO-2026-1042"
              value={quickOrderNumber}
              onChange={(e) => setQuickOrderNumber(e.target.value.toUpperCase())}
              className="flex-1 text-xs px-3 py-2 bg-[#F7F8F6] border border-[#E5E8E3] rounded-xl uppercase font-mono"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-[#087A42] text-white text-xs font-bold rounded-xl hover:bg-[#066336]"
            >
              Track
            </button>
          </form>
        </div>

        {/* Saved Addresses */}
        <div className="bg-white rounded-3xl border border-[#E5E8E3] p-6 space-y-4 shadow-xs">
          <h2 className="text-sm font-bold text-[#202720] flex items-center gap-2 pb-2 border-b border-[#E5E8E3]">
            <MapPin className="w-4 h-4 text-[#FF7900]" />
            <span>Saved Shipping Addresses</span>
          </h2>
          {customer.savedAddresses && customer.savedAddresses.length > 0 ? (
            <div className="space-y-3">
              {customer.savedAddresses.map((addr, idx) => (
                <div key={idx} className="p-3 bg-[#F7F8F6] rounded-xl border border-[#E5E8E3] text-xs space-y-1">
                  <p className="font-bold text-[#202720]">{addr.fullName}</p>
                  <p className="text-[#5E695E]">{addr.addressLine}</p>
                  <p className="text-[#5E695E]">{addr.city}, {addr.state} - {addr.pincode}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-[#5E695E]">
              Your delivery address will be saved here automatically on your next checkout.
            </p>
          )}
        </div>

      </div>

    </div>
  );
};
