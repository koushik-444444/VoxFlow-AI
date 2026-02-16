'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Zap, 
  Shield, 
  Cpu, 
  Globe, 
  MessageSquare, 
  ArrowRight, 
  Play, 
  ChevronDown,
  CheckCircle2,
  Mail,
  Instagram,
  Twitter,
  Github,
  ChevronRight,
  ChevronLeft
} from 'lucide-react'

interface LandingPageProps {
  onStart: () => void
}

export function LandingPage({ onStart }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-[#050506] text-white selection:bg-gemini-blue/30 overflow-x-hidden">
      {/* Dynamic Background */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-gemini-blue/10 blur-[120px] rounded-full animate-glow-breathe" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-gemini-violet/10 blur-[120px] rounded-full animate-glow-breathe" style={{ animationDelay: '2s' }} />
        <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-gemini-pink/5 blur-[120px] rounded-full animate-glow-breathe" style={{ animationDelay: '4s' }} />
      </div>

      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 px-6 py-4 flex justify-between items-center glass-panel border-x-0 border-t-0 bg-black/20 backdrop-blur-2xl">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gemini-gradient p-[1px]">
            <div className="w-full h-full bg-black rounded-lg flex items-center justify-center">
              <img src="/voxflow-logo.png" alt="Logo" className="w-5 h-5 invert" />
            </div>
          </div>
          <span className="text-xl font-bold tracking-tighter">VoxFlow</span>
        </div>
        
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gemini-muted hover:text-white transition-colors cursor-pointer">
          <a href="#features" className="hover:text-gemini-blue transition-colors">Features</a>
          <a href="#pricing" className="hover:text-gemini-blue transition-colors">Pricing</a>
          <a href="#faq" className="hover:text-gemini-blue transition-colors">FAQ</a>
        </div>

        <button 
          onClick={onStart}
          className="px-5 py-2 rounded-full bg-white text-black text-sm font-bold hover:scale-105 transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)]"
        >
          Get Started
        </button>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 pt-40 pb-20 px-6 max-w-7xl mx-auto flex flex-col items-center text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="space-y-6 max-w-4xl"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-gemini-border bg-gemini-surface/50 backdrop-blur-md text-[10px] uppercase tracking-[0.2em] font-black text-gemini-blue drop-shadow-glow">
            <Zap className="w-3 h-3 fill-current" />
            Next-Gen Voice Intelligence
          </div>
          
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-[0.9] text-white">
            Conversations that <br />
            <span className="text-transparent bg-clip-text bg-gemini-gradient animate-gradient bg-[length:200%_200%]">feel human.</span>
          </h1>
          
          <p className="text-lg md:text-xl text-gemini-muted max-w-2xl mx-auto leading-relaxed font-light">
            VoxFlow breaks the barrier between human speech and machine intelligence. 
            Experience sub-second latency, natural prosody, and true multimodal understanding.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
            <button 
              onClick={onStart}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gemini-blue text-white font-bold text-lg flex items-center justify-center gap-2 hover:bg-blue-400 hover:shadow-[0_0_30px_rgba(75,144,255,0.4)] transition-all group"
            >
              Start Speaking Free
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button className="w-full sm:w-auto px-8 py-4 rounded-2xl border border-gemini-border bg-white/5 backdrop-blur-md font-bold text-lg flex items-center justify-center gap-2 hover:bg-white/10 transition-all">
              <Play className="w-5 h-5 fill-current" />
              Watch Demo
            </button>
          </div>
        </motion.div>

        {/* Visual Teaser */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, duration: 1 }}
          className="mt-24 w-full max-w-5xl aspect-video rounded-[32px] border border-gemini-border bg-gradient-to-b from-white/5 to-transparent p-1 shadow-2xl relative overflow-hidden group"
        >
          <div className="absolute inset-0 bg-black/40 z-10 flex items-center justify-center backdrop-blur-sm group-hover:backdrop-blur-none transition-all duration-700">
             <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center border border-white/20 hover:scale-110 transition-all cursor-pointer">
                <Play className="w-8 h-8 fill-white" />
             </div>
          </div>
          <img 
            src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop" 
            alt="Interface Preview" 
            className="w-full h-full object-cover rounded-[30px]"
          />
        </motion.div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative z-10 py-32 px-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <FeatureCard 
            icon={<Cpu className="w-6 h-6 text-gemini-blue" />}
            title="Groq Powered"
            description="Ultra-fast inference using LPU™ technology for responses faster than human reaction time."
          />
          <FeatureCard 
            icon={<Globe className="w-6 h-6 text-gemini-violet" />}
            title="Multilingual"
            description="Real-time translation and transcription across 95+ languages with localized accents."
          />
          <FeatureCard 
            icon={<Shield className="w-6 h-6 text-gemini-pink" />}
            title="Privacy First"
            description="End-to-end encrypted audio streams and zero-persistence memory options for total security."
          />
        </div>
      </section>

      {/* Content Section 1 */}
      <section className="relative z-10 py-20 px-6 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
        <div className="space-y-8 order-2 lg:order-1">
          <h2 className="text-4xl md:text-5xl font-black leading-tight">
            Infinite intelligence, <br />
            <span className="text-gemini-blue">just a word away.</span>
          </h2>
          <p className="text-gemini-muted text-lg leading-relaxed">
            Whether you're brainstorming your next big idea, learning a new language, or just need a friendly voice to talk to, VoxFlow's neural architecture adapts to your needs. Our model doesn't just process text; it understands the nuance of your tone and the intent behind your words.
          </p>
          <ul className="space-y-4 pt-4">
            <ListItem text="Sub-500ms end-to-end latency" />
            <ListItem text="Emotional intelligence & tone detection" />
            <ListItem text="Automatic context preservation" />
          </ul>
        </div>
        <div className="order-1 lg:order-2 p-1 rounded-[40px] bg-gradient-to-tr from-gemini-blue/30 to-gemini-pink/30 shadow-2xl overflow-hidden aspect-square">
           <img 
              src="https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?q=80&w=2574&auto=format&fit=crop" 
              className="w-full h-full object-cover rounded-[39px]" 
              alt="AI Core"
           />
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="relative z-10 py-32 px-6">
        <div className="max-w-7xl mx-auto text-center mb-20">
          <h2 className="text-5xl font-black tracking-tighter mb-4">Plans for every flow.</h2>
          <p className="text-gemini-muted">Scalable pricing for individuals and enterprises.</p>
        </div>
        
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          <PricingCard 
            name="Starter"
            price="0"
            features={['30 minutes / month', 'Standard Voice latency', 'Access to Llama 3 8B', 'Community support']}
            buttonText="Start Free"
            onClick={onStart}
          />
          <PricingCard 
            name="Pro"
            price="19"
            popular
            features={['Unlimited minutes', 'Ultra-low latency priority', 'Access to GPT-4o & Claude 3.5', 'Custom voice cloning', 'Priority support']}
            buttonText="Go Pro"
            onClick={onStart}
          />
          <PricingCard 
            name="Enterprise"
            price="Custom"
            features={['Unlimited users', 'On-premise deployment', 'Custom LLM fine-tuning', 'Dedicated account manager', '99.9% uptime SLA']}
            buttonText="Contact Sales"
          />
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="relative z-10 py-32 px-6 max-w-4xl mx-auto">
        <h2 className="text-4xl font-black tracking-tighter mb-16 text-center">Frequently Asked</h2>
        <div className="space-y-4">
          <FAQItem 
            question="How does VoxFlow achieve such low latency?" 
            answer="We utilize specialized LPU™ (Language Processing Unit) hardware from Groq for inference, combined with highly optimized audio streaming protocols that process chunks as small as 100ms."
          />
          <FAQItem 
            question="Can I use custom voices?" 
            answer="Yes! Our Pro and Enterprise tiers include voice cloning technology that allows you to create a digital twin of any voice from just 30 seconds of reference audio."
          />
          <FAQItem 
            question="Is my voice data being stored?" 
            answer="By default, we only process audio transiently. Enterprise users can opt for zero-logging environments where no data ever touches a persistent disk."
          />
          <FAQItem 
            question="Which LLMs power the conversations?" 
            answer="VoxFlow is model-agnostic. We currently support Llama 3, Mixtral, GPT-4o, and Claude 3.5, with the ability to hot-swap during a live session."
          />
        </div>
      </section>

      {/* CTA / Newsletter */}
      <section className="relative z-10 py-32 px-6">
        <div className="max-w-5xl mx-auto bg-gradient-to-br from-gemini-surface to-black border border-gemini-border rounded-[48px] p-12 md:p-20 text-center overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-full bg-gemini-blue/5 blur-[100px] rounded-full translate-y-1/2" />
          
          <div className="relative z-10 space-y-8">
            <h2 className="text-4xl md:text-6xl font-black tracking-tighter">Ready to join the future?</h2>
            <p className="text-gemini-muted text-lg max-w-xl mx-auto leading-relaxed">
              Stay updated with the latest in voice AI research and product updates. Join 10,000+ others in the VoxFlow community.
            </p>
            
            <form className="max-w-md mx-auto flex flex-col sm:flex-row gap-4 pt-4" onSubmit={(e) => e.preventDefault()}>
              <div className="flex-1 relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gemini-muted" />
                <input 
                  type="email" 
                  placeholder="Email address" 
                  className="w-full pl-12 pr-6 py-4 rounded-2xl bg-black border border-gemini-border focus:border-gemini-blue outline-none transition-all"
                />
              </div>
              <button className="px-8 py-4 rounded-2xl bg-white text-black font-black hover:scale-105 transition-all">
                Subscribe
              </button>
            </form>
            
            <p className="text-[10px] text-gemini-muted uppercase tracking-widest pt-8">
              No spam. Unsubscribe anytime.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-gemini-border bg-black/50 backdrop-blur-xl px-6 py-20 mt-20">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start gap-12">
          <div className="space-y-6 max-w-xs">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gemini-gradient p-[1px]">
                <div className="w-full h-full bg-black rounded-lg flex items-center justify-center">
                  <img src="/voxflow-logo.png" alt="Logo" className="w-5 h-5 invert" />
                </div>
              </div>
              <span className="text-xl font-bold tracking-tighter">VoxFlow</span>
            </div>
            <p className="text-gemini-muted text-sm leading-relaxed">
              Redefining human-AI interaction through high-fidelity, real-time voice intelligence.
            </p>
            <div className="flex items-center gap-4 text-gemini-muted">
               <Twitter className="w-5 h-5 hover:text-white cursor-pointer transition-colors" />
               <Instagram className="w-5 h-5 hover:text-white cursor-pointer transition-colors" />
               <Github className="w-5 h-5 hover:text-white cursor-pointer transition-colors" />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-12 sm:gap-24">
            <FooterCol title="Product" links={['Features', 'API', 'Pricing', 'Documentation']} />
            <FooterCol title="Company" links={['About', 'Blog', 'Careers', 'Privacy']} />
            <FooterCol title="Support" links={['Help Center', 'Status', 'Contact', 'Twitter']} />
          </div>
        </div>
        <div className="max-w-7xl mx-auto pt-20 flex flex-col sm:flex-row justify-between items-center gap-4 text-[10px] uppercase tracking-widest text-gemini-muted font-bold">
           <span>© 2026 VoxFlow AI Inc.</span>
           <div className="flex gap-8">
              <span className="hover:text-white cursor-pointer">Terms of Service</span>
              <span className="hover:text-white cursor-pointer">Privacy Policy</span>
              <span className="hover:text-white cursor-pointer">Cookies</span>
           </div>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="p-8 rounded-[32px] bg-gemini-surface/30 border border-gemini-border hover:bg-gemini-surface/50 hover:border-gemini-muted/30 transition-all group shadow-xl">
      <div className="w-12 h-12 rounded-2xl bg-black border border-gemini-border flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-3">{title}</h3>
      <p className="text-gemini-muted text-sm leading-relaxed">{description}</p>
    </div>
  )
}

function PricingCard({ name, price, features, buttonText, popular, onClick }: any) {
  return (
    <div className={`p-10 rounded-[40px] flex flex-col relative transition-all border ${
      popular ? 'bg-gemini-surface border-gemini-blue shadow-[0_0_50px_rgba(75,144,255,0.15)] scale-105 z-10' : 'bg-gemini-surface/30 border-gemini-border hover:bg-gemini-surface/50'
    }`}>
      {popular && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-4 py-1 rounded-full bg-gemini-gradient text-[10px] font-black uppercase tracking-widest shadow-xl">
          Most Popular
        </div>
      )}
      <div className="mb-8">
        <h3 className="text-sm font-bold uppercase tracking-widest text-gemini-muted mb-2">{name}</h3>
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-black tracking-tighter">${price}</span>
          {price !== 'Custom' && <span className="text-gemini-muted text-sm">/month</span>}
        </div>
      </div>
      <div className="flex-1 space-y-4 mb-10 text-sm">
        {features.map((f: string) => (
          <div key={f} className="flex items-start gap-3">
            <CheckCircle2 className="w-4 h-4 text-gemini-blue shrink-0 mt-0.5" />
            <span className="text-gemini-text/80">{f}</span>
          </div>
        ))}
      </div>
      <button 
        onClick={onClick}
        className={`w-full py-4 rounded-2xl font-black transition-all ${
          popular ? 'bg-white text-black hover:scale-[1.02]' : 'bg-white/5 border border-gemini-border hover:bg-white/10'
        }`}
      >
        {buttonText}
      </button>
    </div>
  )
}

function FAQItem({ question, answer }: { question: string, answer: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div 
      className="p-6 rounded-[24px] bg-gemini-surface/20 border border-gemini-border cursor-pointer transition-all hover:bg-gemini-surface/40"
      onClick={() => setOpen(!open)}
    >
      <div className="flex justify-between items-center gap-4">
        <h3 className="text-lg font-bold">{question}</h3>
        <ChevronDown className={`w-5 h-5 text-gemini-muted transition-transform duration-300 ${open ? 'rotate-180 text-white' : ''}`} />
      </div>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0, marginTop: 0 }}
            animate={{ height: 'auto', opacity: 1, marginTop: 16 }}
            exit={{ height: 0, opacity: 0, marginTop: 0 }}
            className="overflow-hidden"
          >
            <p className="text-gemini-muted leading-relaxed">{answer}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function ListItem({ text }: { text: string }) {
  return (
    <li className="flex items-center gap-3">
      <div className="w-5 h-5 rounded-full bg-gemini-blue/10 flex items-center justify-center">
        <ChevronRight className="w-3 h-3 text-gemini-blue" />
      </div>
      <span className="text-gemini-text font-medium">{text}</span>
    </li>
  )
}

function FooterCol({ title, links }: { title: string, links: string[] }) {
  return (
    <div className="space-y-6">
      <h4 className="text-sm font-black uppercase tracking-widest text-white">{title}</h4>
      <ul className="space-y-4">
        {links.map(l => (
          <li key={l} className="text-gemini-muted text-sm hover:text-gemini-blue cursor-pointer transition-colors font-medium">{l}</li>
        ))}
      </ul>
    </div>
  )
}
