import React, { useState } from 'react';
import { MessageCircle, X } from 'lucide-react';

interface WhatsAppButtonProps {
  phoneNumber?: string;
}

export const WhatsAppButton: React.FC<WhatsAppButtonProps> = ({
  phoneNumber = '919876543210',
}) => {
  const [showTooltip, setShowTooltip] = useState(false);

  const cleanNumber = phoneNumber.replace(/[^0-9]/g, '');
  const whatsappUrl = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(
    'Hi FanKO Store, I have a question about your home & kitchen products.'
  )}`;

  return (
    <div className="fixed bottom-6 right-6 z-30 flex items-center gap-3">
      {showTooltip && (
        <div className="hidden sm:flex items-center gap-2 bg-white text-[#202720] text-xs py-2 px-3 rounded-xl shadow-lg border border-[#E5E8E3] animate-in fade-in duration-200">
          <span>Need help? Chat with FanKO Support</span>
          <button
            onClick={() => setShowTooltip(false)}
            className="text-slate-400 hover:text-slate-600"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        onMouseEnter={() => setShowTooltip(true)}
        className="w-13 h-13 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
        aria-label="Chat with us on WhatsApp"
      >
        <MessageCircle className="w-7 h-7 fill-white text-[#25D366]" />
      </a>
    </div>
  );
};
