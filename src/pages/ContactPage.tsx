import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Send, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { contactService } from '../services/contactService';
import { getErrorMessage } from '../utils';

const ContactPage: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      await contactService.submitMessage(formData);
      setSuccessMessage('Your message has been sent.');
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: '',
      });
    } catch (error: any) {
      setErrorMessage(getErrorMessage(error, 'Failed to send message'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="pt-20 bg-noir-bg min-h-screen relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] right-[-5%] w-[50%] h-[60%] bg-noir-accent/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[40%] h-[50%] bg-noir-accent/5 rounded-full blur-[100px]" />
        <div className="absolute inset-0 noir-pattern opacity-10" />
      </div>

      <section className="py-32 px-6 relative z-10">
        <div className="container mx-auto">
          <div className="text-center mb-20">
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-noir-accent font-mono font-semibold text-xs uppercase tracking-[0.3em] mb-6 block"
            >
              Contact Us
            </motion.span>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-2xl md:text-6xl font-display font-semibold text-noir-ink mb-8 tracking-normal uppercase"
            >
              Let's Start a <span className="text-noir-accent italic font-serif font-normal lowercase">Conversation.</span>
            </motion.h1>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Contact Info */}
            <div className="space-y-8">
              {[
                { icon: Phone, title: 'Call Us', detail: '+1 (800) EVENTO-GLOBAL', desc: 'Mon-Fri from 9am to 6pm.' },
                { icon: Mail, title: 'Email Support', detail: 'hello@evento.com', desc: 'We usually reply within 24h.' },
                { icon: MapPin, title: 'Global HQ', detail: '123 Celebration Way, NY', desc: 'Visit our creative studio.' },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-noir-card p-8 rounded-none border border-noir-border shadow-sm group hover:border-noir-accent transition-all"
                >
                  <div className="w-12 h-12 rounded-none bg-noir-bg flex items-center justify-center text-noir-accent mb-6 group-hover:bg-noir-accent group-hover:text-noir-bg transition-all border border-noir-border">
                    <item.icon className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-mono font-semibold text-noir-muted uppercase tracking-widest mb-2">{item.title}</h4>
                  <p className="text-lg font-display font-semibold text-noir-ink mb-2 uppercase">{item.detail}</p>
                  <p className="text-sm text-noir-muted">{item.desc}</p>
                </motion.div>
              ))}
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-2">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-noir-card p-10 md:p-16 rounded-none border border-noir-border shadow-2xl shadow-black/50"
              >
                <form onSubmit={handleSubmit} className="space-y-8">
                  {successMessage && (
                    <div className="flex items-center gap-3 border border-emerald-500/20 bg-emerald-500/10 px-6 py-4 text-emerald-600 text-xs font-mono font-semibold uppercase tracking-widest">
                      <CheckCircle2 className="w-5 h-5" />
                      {successMessage}
                    </div>
                  )}

                  {errorMessage && (
                    <div className="flex items-center gap-3 border border-rose-500/20 bg-rose-500/10 px-6 py-4 text-rose-600 text-xs font-mono font-semibold uppercase tracking-widest">
                      <AlertCircle className="w-5 h-5" />
                      {errorMessage}
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <label className="text-xs font-mono font-semibold text-noir-muted uppercase tracking-widest ml-1">Full Name</label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        className="w-full bg-noir-bg border border-noir-border rounded-none px-6 py-4 text-noir-ink focus:outline-none focus:ring-1 focus:ring-noir-accent focus:border-noir-accent transition-all placeholder:text-noir-muted/30"
                        placeholder="John Doe"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-mono font-semibold text-noir-muted uppercase tracking-widest ml-1">Email Address</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className="w-full bg-noir-bg border border-noir-border rounded-none px-6 py-4 text-noir-ink focus:outline-none focus:ring-1 focus:ring-noir-accent focus:border-noir-accent transition-all placeholder:text-noir-muted/30"
                        placeholder="john@example.com"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-mono font-semibold text-noir-muted uppercase tracking-widest ml-1">Subject</label>
                    <input
                      type="text"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      required
                      className="w-full bg-noir-bg border border-noir-border rounded-none px-6 py-4 text-noir-ink focus:outline-none focus:ring-1 focus:ring-noir-accent focus:border-noir-accent transition-all placeholder:text-noir-muted/30"
                      placeholder="How can we help?"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-mono font-semibold text-noir-muted uppercase tracking-widest ml-1">Message</label>
                    <textarea
                      rows={6}
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      required
                      className="w-full bg-noir-bg border border-noir-border rounded-none px-6 py-4 text-noir-ink focus:outline-none focus:ring-1 focus:ring-noir-accent focus:border-noir-accent transition-all resize-none placeholder:text-noir-muted/30"
                      placeholder="Your message here..."
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn-noir w-full !py-5 flex items-center justify-center gap-3 group !rounded-none uppercase font-display tracking-widest disabled:opacity-60"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Sending Message
                      </>
                    ) : (
                      <>
                        Send Message
                        <Send className="w-5 h-5 group-hover:translate-x-2 group-hover:-translate-y-2 transition-transform" />
                      </>
                    )}
                  </button>
                </form>
              </motion.div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ContactPage;
