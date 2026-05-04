import React, { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import api, { formatApiError } from "@/lib/api";
import { toast } from "sonner";
import { Phone, Mail, MessageCircle, Send, Loader2, CheckCircle2, MapPin } from "lucide-react";

const INITIAL = {
  name: "",
  email: "",
  phone: "",
  destination: "",
  travel_dates: "",
  budget: "",
  message: "",
};

export default function Contact() {
  const [form, setForm] = useState(INITIAL);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const onChange = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) {
      toast.error("Name and email are required");
      return;
    }
    setSubmitting(true);
    try {
      await api.post("/inquiries", form);
      setDone(true);
      setForm(INITIAL);
      toast.success("Inquiry sent — we'll be in touch within 24 hours");
    } catch (ex) {
      toast.error(formatApiError(ex));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-ink-0">
      <Navbar />

      <section className="border-b border-navy/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="label-caps text-gold-ink">Get in touch</div>
          <h1 className="font-serif text-5xl sm:text-6xl font-normal text-navy mt-4 leading-[1.02] tracking-tight">
            Let's talk about <em className="text-gold">your trip.</em>
          </h1>
          <p className="mt-5 text-lg text-ink-600 max-w-2xl leading-relaxed">
            Fill out the form and a travel consultant will reach out within 24 hours with a personalised plan and quote.
          </p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 grid lg:grid-cols-12 gap-10">
        {/* Contact info */}
        <aside className="lg:col-span-4 space-y-4">
          <a
            href="tel:+919876543210"
            className="flex items-start gap-4 p-6 bg-white border border-navy/10 rounded-xl hover:border-gold transition-colors"
            data-testid="contact-phone-link"
          >
            <span className="h-10 w-10 rounded-lg bg-navy-soft text-navy grid place-items-center shrink-0">
              <Phone className="h-4 w-4" strokeWidth={1.5} />
            </span>
            <div>
              <div className="label-caps text-ink-500">Call</div>
              <div className="font-mono text-base text-navy mt-1">+91 98765 43210</div>
              <div className="text-xs text-ink-500 mt-1">Mon–Sat · 10am – 8pm IST</div>
            </div>
          </a>
          <a
            href="mailto:hello@wanderlustadventure.com"
            className="flex items-start gap-4 p-6 bg-white border border-navy/10 rounded-xl hover:border-gold transition-colors"
            data-testid="contact-email-link"
          >
            <span className="h-10 w-10 rounded-lg bg-navy-soft text-navy grid place-items-center shrink-0">
              <Mail className="h-4 w-4" strokeWidth={1.5} />
            </span>
            <div>
              <div className="label-caps text-ink-500">Email</div>
              <div className="text-sm text-navy mt-1 break-all">hello@wanderlustadventure.com</div>
              <div className="text-xs text-ink-500 mt-1">We reply within 24h</div>
            </div>
          </a>
          <a
            href="https://wa.me/919876543210"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start gap-4 p-6 bg-[#25D366] text-white rounded-xl hover:bg-[#1FAE54] transition-colors"
            data-testid="contact-whatsapp-link"
          >
            <span className="h-10 w-10 rounded-lg bg-white/20 grid place-items-center shrink-0">
              <MessageCircle className="h-4 w-4" strokeWidth={1.5} />
            </span>
            <div>
              <div className="label-caps text-white/80">Quick chat</div>
              <div className="text-base font-semibold mt-1">Message on WhatsApp</div>
              <div className="text-xs text-white/80 mt-1">Fastest replies</div>
            </div>
          </a>
          <div className="p-6 bg-white border border-navy/10 rounded-xl">
            <div className="flex items-center gap-2 label-caps">
              <MapPin className="h-3.5 w-3.5 text-gold-ink" strokeWidth={1.5} />
              Office
            </div>
            <div className="mt-3 text-sm text-ink-700 leading-relaxed">
              Wanderlust Adventure HQ<br />
              Koregaon Park, Pune 411001<br />
              Maharashtra, India
            </div>
          </div>
        </aside>

        {/* Form */}
        <div className="lg:col-span-8">
          {done ? (
            <div className="bg-white border border-navy/10 rounded-xl p-10 text-center" data-testid="contact-success">
              <CheckCircle2 className="h-10 w-10 text-gold-ink mx-auto" strokeWidth={1.5} />
              <h2 className="font-serif text-3xl font-semibold text-navy mt-5">Thank you.</h2>
              <p className="text-ink-600 mt-3 max-w-md mx-auto">
                We've got your inquiry and will be in touch within 24 hours with a personalised plan.
              </p>
              <button
                onClick={() => setDone(false)}
                className="mt-6 inline-flex items-center gap-2 text-navy font-medium hover:text-gold-ink"
              >
                Send another inquiry
              </button>
            </div>
          ) : (
            <form
              onSubmit={onSubmit}
              className="bg-white border border-navy/10 rounded-xl p-8 space-y-5"
              data-testid="contact-form"
            >
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Full name *" required>
                  <input
                    type="text"
                    value={form.name}
                    onChange={onChange("name")}
                    required
                    className="w-full bg-white border border-navy/15 rounded-md px-3 py-2.5 focus:ring-2 focus:ring-navy/15 focus:border-navy outline-none transition-all"
                    data-testid="contact-name-input"
                  />
                </Field>
                <Field label="Email *" required>
                  <input
                    type="email"
                    value={form.email}
                    onChange={onChange("email")}
                    required
                    className="w-full bg-white border border-navy/15 rounded-md px-3 py-2.5 focus:ring-2 focus:ring-navy/15 focus:border-navy outline-none transition-all"
                    data-testid="contact-email-input"
                  />
                </Field>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Phone / WhatsApp">
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={onChange("phone")}
                    placeholder="+91 …"
                    className="w-full bg-white border border-navy/15 rounded-md px-3 py-2.5 focus:ring-2 focus:ring-navy/15 focus:border-navy outline-none"
                    data-testid="contact-phone-input"
                  />
                </Field>
                <Field label="Destination">
                  <input
                    type="text"
                    value={form.destination}
                    onChange={onChange("destination")}
                    placeholder="e.g. Bali, Maldives, Kerala"
                    className="w-full bg-white border border-navy/15 rounded-md px-3 py-2.5 focus:ring-2 focus:ring-navy/15 focus:border-navy outline-none"
                    data-testid="contact-destination-input"
                  />
                </Field>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Travel dates">
                  <input
                    type="text"
                    value={form.travel_dates}
                    onChange={onChange("travel_dates")}
                    placeholder="e.g. Mid-March 2026, 7 nights"
                    className="w-full bg-white border border-navy/15 rounded-md px-3 py-2.5 focus:ring-2 focus:ring-navy/15 focus:border-navy outline-none"
                    data-testid="contact-dates-input"
                  />
                </Field>
                <Field label="Budget (per person)">
                  <select
                    value={form.budget}
                    onChange={onChange("budget")}
                    className="w-full bg-white border border-navy/15 rounded-md px-3 py-2.5 focus:ring-2 focus:ring-navy/15 focus:border-navy outline-none"
                    data-testid="contact-budget-input"
                  >
                    <option value="">Select range</option>
                    <option>Under ₹30,000</option>
                    <option>₹30,000 – ₹80,000</option>
                    <option>₹80,000 – ₹1.5L</option>
                    <option>₹1.5L – ₹3L</option>
                    <option>₹3L+</option>
                  </select>
                </Field>
              </div>
              <Field label="Tell us about your trip">
                <textarea
                  value={form.message}
                  onChange={onChange("message")}
                  rows={5}
                  placeholder="Who's travelling, what you're hoping for, special requests…"
                  className="w-full bg-white border border-navy/15 rounded-md px-3 py-2.5 focus:ring-2 focus:ring-navy/15 focus:border-navy outline-none resize-none"
                  data-testid="contact-message-input"
                />
              </Field>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 bg-navy hover:bg-navy-hover text-white rounded-lg px-7 py-3 font-semibold transition-colors disabled:opacity-60"
                data-testid="contact-submit-btn"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Start Planning Your Trip
              </button>
              <p className="text-xs text-ink-500">We never share your details. Expect a reply within 24 hours.</p>
            </form>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="label-caps mb-2 block">{label}</span>
      {children}
    </label>
  );
}
