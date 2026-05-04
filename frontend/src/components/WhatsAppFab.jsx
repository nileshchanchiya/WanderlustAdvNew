import React from "react";
import { MessageCircle } from "lucide-react";

const WHATSAPP_NUMBER = process.env.REACT_APP_WHATSAPP_NUMBER || "918160317044";
const DEFAULT_MSG = encodeURIComponent(
  "Hi Wanderlust Adventure — I'd love to plan a trip. Could you help?"
);

export default function WhatsAppFab() {
  const href = `https://wa.me/${WHATSAPP_NUMBER}?text=${DEFAULT_MSG}`;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-24 right-5 z-50 inline-flex items-center gap-2 rounded-full bg-[#25D366] hover:bg-[#1FAE54] text-white px-4 py-3 shadow-lg shadow-black/10 transition-all hover:-translate-y-0.5"
      data-testid="whatsapp-fab"
      aria-label="Chat on WhatsApp"
    >
      <MessageCircle className="h-5 w-5" strokeWidth={1.8} fill="currentColor" fillOpacity="0.15" />
      <span className="font-medium text-sm hidden sm:inline">Chat on WhatsApp</span>
    </a>
  );
}
