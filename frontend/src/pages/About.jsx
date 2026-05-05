import React from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Seo from "@/components/Seo";
import { ArrowUpRight, Award, Heart, Target, Eye } from "lucide-react";
import logoImg from "@/assets/logo.svg";

export default function About() {
  return (
    <div className="min-h-screen bg-ink-0">
      <Seo
        title="About Wanderlust Adventure — Rajkot Travel Agency Founded by Nilesh Chanchiya"
        description="Learn about Wanderlust Adventure, Rajkot's leading travel agency founded in 2021 by Nilesh Chanchiya. We serve travellers across Gujarat with honest, personalised travel planning."
        path="/about"
      />
      <Navbar />

      {/* HERO */}
      <section className="relative border-b border-navy/10 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.06]">
          <img
            src="https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=2000&q=80"
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
            decoding="async"
          />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
          <img src={logoImg} alt="Wanderlust Adventure" className="w-auto mb-8" style={{ height: '80px' }} />
          <div className="label-caps text-gold-ink">Who we are</div>
          <h1 className="font-serif text-5xl sm:text-6xl lg:text-7xl font-normal text-navy mt-5 leading-[1.02] tracking-tight max-w-4xl">
            A travel agency <em className="text-gold">built around you.</em>
          </h1>
          <p className="mt-7 text-lg text-ink-600 max-w-3xl leading-relaxed">
            Wanderlust Adventure is a customer-first travel agency focused on delivering highly
            personalised travel experiences. We combine expert planning, smart budgeting and deep
            destination knowledge to create seamless journeys that feel genuinely yours.
          </p>
        </div>
      </section>

      {/* MISSION & VISION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid md:grid-cols-2 gap-5">
          <div className="bg-white border border-navy/10 rounded-xl p-10">
            <Target className="h-6 w-6 text-gold-ink" strokeWidth={1.5} />
            <div className="label-caps text-ink-500 mt-5">Mission</div>
            <h2 className="font-serif text-3xl font-semibold text-navy mt-2 leading-tight">
              To make travel simple, efficient and unforgettable.
            </h2>
            <p className="mt-5 text-ink-600 leading-relaxed">
              We remove the friction from trip planning — research, bookings, paperwork, logistics —
              so the only thing you think about is the experience.
            </p>
          </div>
          <div className="bg-navy text-white rounded-xl p-10">
            <Eye className="h-6 w-6 text-gold" strokeWidth={1.5} />
            <div className="label-caps text-white/60 mt-5">Vision</div>
            <h2 className="font-serif text-3xl font-semibold mt-2 leading-tight">
              To be the trusted travel partner of every explorer.
            </h2>
            <p className="mt-5 text-white/80 leading-relaxed">
              A name travellers return to — not because they have to, but because they want to.
              One trip at a time, one story at a time.
            </p>
          </div>
        </div>
      </section>

      {/* VALUES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="mb-12">
          <div className="label-caps text-gold-ink">What we stand for</div>
          <h2 className="font-serif text-4xl sm:text-5xl font-semibold text-navy mt-3 leading-tight">
            Four values. No exceptions.
          </h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-px bg-navy/10 border border-navy/10 rounded-xl overflow-hidden">
          {[
            { icon: Heart, title: "Customer first", desc: "Every decision tested against one question: is this better for the traveller?" },
            { icon: Award, title: "Craft", desc: "Itineraries are crafted, not generated. Details matter more than volume." },
            { icon: Target, title: "Transparency", desc: "Clear pricing, clear plans, clear communication. No surprises." },
            { icon: Eye, title: "Long view", desc: "We plan for the relationship, not the transaction." },
          ].map((v) => (
            <div key={v.title} className="bg-white p-8 hover:bg-ink-50 transition-colors">
              <v.icon className="h-5 w-5 text-navy mb-4" strokeWidth={1.5} />
              <h3 className="font-serif text-xl font-semibold text-navy">{v.title}</h3>
              <p className="mt-2 text-ink-600 leading-relaxed text-sm">{v.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* NUMBERS */}
      <section className="bg-navy-soft border-y border-navy/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 grid sm:grid-cols-3 gap-10 text-center">
          {[
            { k: "1,200+", label: "Happy travellers" },
            { k: "50+", label: "Destinations" },
            { k: "10 yrs", label: "Of curated trips" },
          ].map((s) => (
            <div key={s.label}>
              <div className="font-serif text-5xl sm:text-6xl font-normal text-navy">{s.k}</div>
              <div className="label-caps text-ink-500 mt-2">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <h2 className="font-serif text-4xl sm:text-5xl font-semibold text-navy leading-tight">
          Shall we start a conversation?
        </h2>
        <p className="mt-4 text-ink-600 max-w-xl mx-auto">
          Tell us where you want to go — we'll do the rest.
        </p>
        <div className="mt-8 flex justify-center gap-3 flex-wrap">
          <Link
            to="/contact"
            className="inline-flex items-center gap-2 bg-navy hover:bg-navy-hover text-white rounded-lg px-6 py-3 font-semibold transition-colors"
            data-testid="about-cta-contact"
          >
            Start planning <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
