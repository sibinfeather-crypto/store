import React, { useState, useEffect } from 'react';
import { X, Sparkles } from 'lucide-react';
import { api } from '../services/api.ts';

export const AnnouncementBar: React.FC = () => {
  const [text, setText] = useState<string>(
    'Free Pan-India Delivery on Orders Above ₹499 | Cash on Delivery (COD) Available'
  );
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    api.getSettings()
      .then((s) => {
        if (s.announcementText) setText(s.announcementText);
        if (s.announcementActive === false) setVisible(false);
      })
      .catch(() => {});
  }, []);

  if (!visible || !text) return null;

  return (
    <aside aria-label="Announcement" className="bg-[#087A42] text-white text-xs font-medium py-2 px-4 relative z-40 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-center text-center pr-6">
        <p className="flex items-center gap-1.5 truncate">
          <Sparkles className="w-3.5 h-3.5 text-[#FF7900] shrink-0" />
          <span>{text}</span>
        </p>
      </div>
      <button
        onClick={() => setVisible(false)}
        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-white/80 hover:text-white transition-colors"
        aria-label="Dismiss announcement"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </aside>
  );
};
