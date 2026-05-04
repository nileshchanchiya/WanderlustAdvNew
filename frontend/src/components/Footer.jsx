import React from "react";
import { Link } from "react-router-dom";
import { Plane, Instagram, Facebook, Mail, Phone } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-navy text-white/90">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 grid lg:grid-cols-12 gap-10">
        <div className="lg:col-span-4">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="h-9 w-9 rounded-lg bg-white text-navy grid place-items-center">
              <Plane className="h-4 w-4 -rotate-12" strokeWidth={2} />
            </span>
            <span className="flex flex-col leading-none">
              <span className="font-serif text-[18px] font-semibold">Wanderlust</span>
              <span className="text-[10px] tracking-[0.22em] uppercase text-gold -mt-0.5">
                Adventure
              </span>
            </span>
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
            <li><Link to="/dashboard" className="hover:text-gold">My Trips</Link></li>
          </ul>
        </div>

        <div className="lg:col-span-4">
          <div className="label-caps text-white/50 mb-4">Get in touch</div>
          <ul className="space-y-2.5 text-sm">
            <li className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-gold" strokeWidth={1.5} />
              <a href="tel:+919876543210" className="hover:text-gold">+91 98765 43210</a>
            </li>
            <li className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-gold" strokeWidth={1.5} />
              <a href="mailto:hello@wanderlustadventure.com" className="hover:text-gold">
                hello@wanderlustadventure.com
              </a>
            </li>
          </ul>
          <div className="mt-5 flex items-center gap-3">
            <a href="#" className="h-9 w-9 rounded-full border border-white/20 grid place-items-center hover:border-gold hover:text-gold" aria-label="instagram">
              <Instagram className="h-4 w-4" strokeWidth={1.5} />
            </a>
            <a href="#" className="h-9 w-9 rounded-full border border-white/20 grid place-items-center hover:border-gold hover:text-gold" aria-label="facebook">
              <Facebook className="h-4 w-4" strokeWidth={1.5} />
            </a>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-wrap items-center justify-between text-xs text-white/60">
          <div>© 2026 Wanderlust Adventure. All rights reserved.</div>
          <div className="font-mono">Travel · Curated · Personal</div>
        </div>
      </div>
    </footer>
  );
}
