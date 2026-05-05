import React from "react";
import { Link } from "react-router-dom";
import { Instagram, Facebook, Mail, Phone, Linkedin, AtSign } from "lucide-react";
import logoImg from "@/assets/logo.svg";

export default function Footer() {
  return (
    <footer className="bg-navy text-white/90">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 grid lg:grid-cols-12 gap-10">
        <div className="lg:col-span-4">
          <Link to="/" className="flex items-center">
            <img src={logoImg} alt="Wanderlust Adventure" className="w-auto brightness-0 invert" style={{ height: '72px' }} />
          </Link>
          <p className="mt-5 text-sm text-white/70 leading-relaxed max-w-sm">
            A customer-first travel agency crafting personalised journeys across India and the world.
          </p>
        </div>

        <div className="lg:col-span-2">
          <div className="label-caps text-white/50 mb-4">Company</div>
          <ul className="space-y-2 text-sm">
            <li><Link to="/about" className="hover:text-gold">About Us</Link></li>
            <li><Link to="/services" className="hover:text-gold">Services</Link></li>
            <li><Link to="/destinations" className="hover:text-gold">Destinations</Link></li>
            <li><Link to="/contact" className="hover:text-gold">Contact</Link></li>
          </ul>
        </div>

        <div className="lg:col-span-2">
          <div className="label-caps text-white/50 mb-4">Account</div>
          <ul className="space-y-2 text-sm">
            <li><Link to="/signup" className="hover:text-gold">Plan a Trip</Link></li>
            <li><Link to="/login" className="hover:text-gold">Sign in</Link></li>
            <li><Link to="/account" className="hover:text-gold">My Account</Link></li>
          </ul>
        </div>

        <div className="lg:col-span-4">
          <div className="label-caps text-white/50 mb-4">Get in touch</div>
          <ul className="space-y-2.5 text-sm">
            <li className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-gold" strokeWidth={1.5} />
              <a href="tel:+918160317044" className="hover:text-gold">+91 8160317044</a>
            </li>
            <li className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-gold" strokeWidth={1.5} />
              <a href="mailto:info@wanderlustadventure.in" className="hover:text-gold">
                info@wanderlustadventure.in
              </a>
            </li>
            <li className="flex items-start gap-2 text-white/70">
              <span className="text-gold mt-0.5">◆</span>
              <span>Everest Park, Kalawad Road,<br />Rajkot, Gujarat 360005 · India</span>
            </li>
          </ul>
          <div className="mt-5 flex items-center gap-3">
            <a href="https://www.instagram.com/wanderlustadventure.in/" target="_blank" rel="noopener noreferrer" className="h-9 w-9 rounded-full border border-white/20 grid place-items-center hover:border-gold hover:text-gold transition-colors" aria-label="Instagram">
              <Instagram className="h-4 w-4" strokeWidth={1.5} />
            </a>
            <a href="https://www.facebook.com/wanderlustadventures.in" target="_blank" rel="noopener noreferrer" className="h-9 w-9 rounded-full border border-white/20 grid place-items-center hover:border-gold hover:text-gold transition-colors" aria-label="Facebook">
              <Facebook className="h-4 w-4" strokeWidth={1.5} />
            </a>
            <a href="https://www.linkedin.com/company/wanderlustadventure" target="_blank" rel="noopener noreferrer" className="h-9 w-9 rounded-full border border-white/20 grid place-items-center hover:border-gold hover:text-gold transition-colors" aria-label="LinkedIn">
              <Linkedin className="h-4 w-4" strokeWidth={1.5} />
            </a>
            <a href="https://www.threads.com/@wanderlustadventure.in" target="_blank" rel="noopener noreferrer" className="h-9 w-9 rounded-full border border-white/20 grid place-items-center hover:border-gold hover:text-gold transition-colors" aria-label="Threads">
              <AtSign className="h-4 w-4" strokeWidth={1.5} />
            </a>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-wrap items-center justify-between text-xs text-white/60">
          <div>© 2026 Wanderlust Adventure · Rajkot, Gujarat · Founded by Nilesh Chanchiya</div>
          <div className="font-mono">Travel · Curated · Personal</div>
        </div>
      </div>
    </footer>
  );
}
