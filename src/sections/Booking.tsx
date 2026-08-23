import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Phone, CheckCircle2, ArrowRight, MapPin, Sparkles } from 'lucide-react';
import { LocationPicker } from '../components/LocationPicker';
import { ServiceLocation } from '../types';
import { formatCoordinates } from '../utils';

export const Booking: React.FC = () => {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [selectedServiceLocation, setSelectedServiceLocation] = useState<ServiceLocation | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedServiceLocation) {
      return;
    }

    setIsSubmitted(true);
    setTimeout(() => setIsSubmitted(false), 5000);
  };

  return (
    <section id="booking" className="py-24 md:py-32 px-6 bg-noir-bg relative overflow-hidden">
      <div className="absolute inset-0 noir-pattern pointer-events-none opacity-10" />
      <div className="container mx-auto relative z-10">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="text-noir-accent font-mono font-semibold text-[10px] uppercase tracking-[0.32em] mb-8 block">Booking Request</span>
            <h2 className="text-4xl md:text-6xl font-serif font-semibold text-noir-ink mb-6 leading-tight">
              Tell vendors what your event needs.
            </h2>
            <p className="text-xl text-noir-muted leading-relaxed mb-8 max-w-lg font-light tracking-normal">
              Share the essentials once, add the location pin, and keep the request structured enough for faster vendor responses.
            </p>
            
            <div className="space-y-8">
              <div className="flex items-center gap-8 group">
                <div className="w-20 h-20 rounded-none bg-white flex items-center justify-center text-noir-accent group-hover:bg-noir-accent group-hover:text-white transition-all duration-500 shadow-2xl border border-noir-border">
                  <Phone className="w-8 h-8" />
                </div>
                <div>
                  <span className="block text-noir-muted text-[10px] font-mono font-semibold uppercase tracking-[0.3em] mb-2">Call Us</span>
                  <span className="text-noir-ink text-xl md:text-2xl font-serif font-semibold tracking-normal">+1 (800) EVENTO</span>
                </div>
              </div>
              
              <div className="flex items-center gap-8 group">
                <div className="w-20 h-20 rounded-none bg-white flex items-center justify-center text-noir-accent group-hover:bg-noir-accent group-hover:text-white transition-all duration-500 shadow-2xl border border-noir-border">
                  <Mail className="w-8 h-8" />
                </div>
                <div>
                  <span className="block text-noir-muted text-[10px] font-mono font-semibold uppercase tracking-[0.3em] mb-2">Email Support</span>
                  <span className="text-noir-ink text-xl md:text-2xl font-serif font-semibold tracking-normal">hello@evento.com</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-8 md:p-12 rounded-[8px] shadow-2xl shadow-noir-blue/10 border border-noir-border relative">
            <div className="absolute -top-6 -right-6 w-16 h-16 bg-noir-blue rounded-[8px] flex items-center justify-center text-white border border-noir-border shadow-2xl">
              <Sparkles className="w-10 h-10" />
            </div>
            
            <AnimatePresence mode="wait">
              {!isSubmitted ? (
                <motion.form 
                  key="form"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  onSubmit={handleSubmit}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <label className="text-[10px] font-mono font-semibold text-noir-muted uppercase tracking-widest ml-1">Full Name</label>
                      <input
                        type="text" 
                        required
                        className="w-full bg-noir-bg border border-noir-border px-5 py-4 text-noir-ink rounded-[8px] focus:outline-none focus:ring-1 focus:ring-noir-blue focus:border-noir-blue transition-all placeholder:text-noir-muted/40"
                        placeholder="John Doe"
                      />
                    </div>
                    <div className="space-y-4">
                      <label className="text-[10px] font-mono font-semibold text-noir-muted uppercase tracking-widest ml-1">Work Email</label>
                      <input 
                        type="email" 
                        required
                        className="w-full bg-noir-bg border border-noir-border px-5 py-4 text-noir-ink rounded-[8px] focus:outline-none focus:ring-1 focus:ring-noir-blue focus:border-noir-blue transition-all placeholder:text-noir-muted/40"
                        placeholder="john@company.com"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <label className="text-[10px] font-mono font-semibold text-noir-muted uppercase tracking-widest ml-1">Event Date</label>
                      <input 
                        type="date" 
                        required
                        className="w-full bg-noir-bg border border-noir-border px-5 py-4 text-noir-ink rounded-[8px] focus:outline-none focus:ring-1 focus:ring-noir-blue focus:border-noir-blue transition-all"
                      />
                    </div>
                    <div className="space-y-4">
                      <label className="text-[10px] font-mono font-semibold text-noir-muted uppercase tracking-widest ml-1">Event Category</label>
                      <select className="w-full bg-noir-bg border border-noir-border px-5 py-4 text-noir-ink rounded-[8px] focus:outline-none focus:ring-1 focus:ring-noir-blue focus:border-noir-blue transition-all appearance-none">
                        <option className="bg-white">Corporate Summit</option>
                        <option className="bg-white">Product Launch</option>
                        <option className="bg-white">Private Gala</option>
                        <option className="bg-white">Wedding</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] font-mono font-semibold text-noir-muted uppercase tracking-widest ml-1">Brief Description</label>
                    <textarea 
                      rows={4}
                      className="w-full bg-noir-bg border border-noir-border px-5 py-4 text-noir-ink rounded-[8px] focus:outline-none focus:ring-1 focus:ring-noir-blue focus:border-noir-blue transition-all resize-none placeholder:text-noir-muted/40"
                      placeholder="Tell us a bit about your event..."
                    />
                  </div>

                  <div className="space-y-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <label className="text-[10px] font-mono font-semibold text-noir-muted uppercase tracking-widest ml-1">Service Location</label>
                        <p className="mt-2 text-xs uppercase tracking-wide text-noir-muted">
                          Pin the requested venue so the team knows exactly where the event support is needed.
                        </p>
                      </div>
                      <div className="inline-flex items-center gap-2 border border-noir-border bg-noir-bg px-4 py-3 text-[10px] font-mono font-semibold uppercase tracking-[0.25em] text-noir-ink">
                        <MapPin className="h-4 w-4 text-noir-accent" />
                        {selectedServiceLocation ? formatCoordinates(selectedServiceLocation) : 'Location required'}
                      </div>
                    </div>

                    <LocationPicker
                      selectedLocation={selectedServiceLocation}
                      onLocationSelect={(location) => setSelectedServiceLocation({ lat: location.lat, lng: location.lng })}
                      height={320}
                      title="Requested venue"
                    />
                  </div>

                  <button 
                    type="submit"
                    disabled={!selectedServiceLocation}
                    className="w-full btn-noir !rounded-[8px] !py-5 font-serif text-lg tracking-wide flex items-center justify-center gap-4 group"
                  >
                    {selectedServiceLocation ? 'Send Inquiry' : 'Select Service Location'}
                    <ArrowRight className="w-6 h-6 group-hover:translate-x-3 transition-transform" />
                  </button>
                </motion.form>
              ) : (
                <motion.div 
                  key="success"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-20"
                >
                  <div className="w-28 h-28 bg-noir-accent text-white rounded-none flex items-center justify-center mx-auto mb-12 shadow-2xl border border-noir-border">
                    <CheckCircle2 className="w-14 h-14" />
                  </div>
                  <h3 className="text-2xl font-serif font-semibold text-noir-ink mb-8 tracking-wide uppercase">Inquiry Sent!</h3>
                  <p className="text-noir-muted text-xl max-w-xs mx-auto font-light tracking-normal">
                    Thank you for reaching out. Our team will review your request and get back to you within 24 hours.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Decorative Background Elements */}
      <div className="absolute top-0 right-0 w-1/3 h-full bg-noir-accent/5 -skew-x-12 translate-x-1/2 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-1/4 h-1/2 bg-noir-accent/5 skew-x-12 -translate-x-1/2 pointer-events-none" />
    </section>
  );
};
