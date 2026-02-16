'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Zap, 
  Shield, 
  Cpu, 
  Globe, 
  ArrowRight, 
  Play, 
  Plus,
  CheckCircle2,
  Mail,
  Instagram,
  Twitter,
  Github,
  ChevronRight,
  ChevronLeft,
  FileText
} from 'lucide-react'
import { useStore } from '@/store/useStore'

interface LandingPageProps {
  onStart: () => void
}

export function LandingPage({ onStart }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-[#050506] text-white selection:bg-gemini-blue/30 overflow-x-hidden relative">
      <div className="grain-overlay" />
      
      {/* Artistic Ambient Layer */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <motion.div 
          animate={{ 
            scale: [1, 1.1, 1],
            opacity: [0.15, 0.25, 0.15],
            x: [0, 50, 0],
            y: [0, -30, 0]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute top-[-10%] right-[-5%] hero-orb" 
        />
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.2, 0.1],
            x: [0, -40, 0],
            y: [0, 60, 0]
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear", delay: 2 }}
          className="absolute bottom-[-10%] left-[-10%] hero-orb" 
          style={{ background: 'radial-gradient(circle, #ff8fab 0%, transparent 70%)' }}
        />
      </div>

      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 px-10 py-8 flex justify-between items-start mix-blend-difference text-white">
        <div className="flex flex-col gap-1">
          <span className="text-2xl font-black tracking-tighter leading-none">VOXFLOW</span>
          <span className="text-mono-technical text-[8px] opacity-60">Intelligence v1.0 • Stable Release</span>
        </div>
        
        <div className="flex items-center gap-10">
          <div className="hidden lg:flex items-center gap-8 text-[10px] font-black uppercase tracking-[0.2em] text-white/40">
            <a href="#features" className="hover:text-white transition-colors">Architecture</a>
            <a href="#pricing" className="hover:text-white transition-colors">Licensing</a>
            <a href="#faq" className="hover:text-white transition-colors">Resources</a>
          </div>

          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onStart}
            className="text-[10px] font-black uppercase tracking-[0.2em] px-6 py-3 border border-white/20 rounded-full hover:bg-white hover:text-black transition-all"
          >
            Access Terminal
          </motion.button>
        </div>
      </nav>

      {/* Hero Section - Artistic Redesign */}
      <section className="relative z-10 min-h-screen flex flex-col justify-center px-10 lg:px-20 pt-20 text-white">
        <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-10 items-end text-white">
          
          {/* Main Typography Block */}
          <div className="lg:col-span-8 space-y-12 text-white">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="inline-block glass-pill text-mono-technical text-[9px] mb-8">
                Neural Sound Architecture • Low Latency Mode Active
              </div>
              
              <h1 className="text-[12vw] lg:text-[10vw] font-black text-editorial leading-[0.8] tracking-[-0.06em] text-white">
                SPEECH<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-gemini-blue via-gemini-violet to-gemini-pink italic pr-4">UNBOUND</span>
              </h1>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 1 }}
              className="max-w-xl"
            >
              <p className="text-xl lg:text-2xl text-white/60 leading-relaxed font-light italic">
                Bridging the gap between biological speech and synthetic intelligence. A high-fidelity conversation experience powered by Groq LPU™ technology.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.8 }}
              className="flex flex-wrap items-center gap-6"
            >
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onStart}
                className="px-12 py-6 rounded-full bg-white text-black font-black text-xs uppercase tracking-[0.3em] shadow-[0_0_40px_rgba(255,255,255,0.2)] hover:shadow-[0_0_60px_rgba(255,255,255,0.4)] transition-all"
              >
                Initiate Flow
              </motion.button>
              
              <div className="flex items-center gap-4 text-mono-technical text-[9px] opacity-40">
                <div className="w-10 h-[1px] bg-white/40" />
                No GPU Required • Open Source Core
              </div>
            </motion.div>
          </div>

          {/* Artistic Sidebar Info */}
          <div className="hidden lg:flex lg:col-span-4 flex-col items-end gap-20 pb-10">
            <div className="text-right space-y-4">
              <span className="text-mono-technical text-[10px] text-gemini-blue block">Latency Control</span>
              <p className="text-4xl font-black tracking-tighter">&lt;0.5s</p>
              <p className="text-[10px] opacity-40 leading-relaxed">Near-instant processing for<br />fluid human-like turn taking.</p>
            </div>

            <div className="text-right space-y-4">
              <span className="text-mono-technical text-[10px] text-gemini-pink block">Global Reach</span>
              <p className="text-4xl font-black tracking-tighter">95+</p>
              <p className="text-[10px] opacity-40 leading-relaxed">Real-time transcription and<br />translation across languages.</p>
            </div>

            <div className="relative group">
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="w-32 h-32 rounded-full border border-dashed border-white/20 flex items-center justify-center"
              >
                <div className="w-20 h-20 rounded-full bg-gemini-gradient animate-pulse opacity-40 blur-xl" />
              </motion.div>
              <div className="absolute inset-0 flex items-center justify-center text-mono-technical text-[8px] font-bold">
                PROSODY 1.0
              </div>
            </div>
          </div>
        </div>

        {/* Decorative Floating Text */}
        <div className="absolute left-[-100px] bottom-[10%] rotate-90 hidden lg:block">
          <span className="text-mono-technical text-[10px] opacity-20 tracking-[1em] uppercase">Synthetic Intelligence • Sonic Architecture</span>
        </div>
      </section>

      {/* Partners / Logo Cloud */}
      <section className="relative z-10 py-10 opacity-30 grayscale hover:grayscale-0 transition-all duration-1000 border-t border-white/5 bg-black">
        <div className="max-w-7xl mx-auto px-6 flex flex-wrap justify-center gap-12 md:gap-24 items-center grayscale invert opacity-50">
           <img src="https://upload.wikimedia.org/wikipedia/commons/b/b9/Nvidia_logo.svg" className="h-6 md:h-8" alt="Nvidia" />
           <img src="https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg" className="h-6 md:h-8" alt="Google" />
           <img src="https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg" className="h-6 md:h-8" alt="Microsoft" />
           <img src="https://upload.wikimedia.org/wikipedia/commons/5/51/IBM_logo.svg" className="h-8 md:h-12" alt="IBM" />
           <img src="https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg" className="h-8 md:h-10" alt="Apple" />
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative z-10 py-32 px-10 lg:px-20 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-white">
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

      {/* Content Section 1 - Artistic Spread */}
      <section className="relative z-10 py-40 px-10 lg:px-20 max-w-7xl mx-auto border-t border-white/5">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-20 items-center">
          <div className="lg:col-span-6 space-y-12 order-2 lg:order-1">
            <div className="text-mono-technical text-[9px] text-gemini-blue animate-pulse flex items-center gap-4">
              <div className="w-2 h-2 rounded-full bg-current" />
              Real-time Neural Synthesis
            </div>
            
            <h2 className="text-[6vw] lg:text-[4vw] font-black leading-[0.9] tracking-tighter uppercase">
              Infinite intelligence,<br />
              <span className="italic text-white/40 pr-4">just a word away.</span>
            </h2>
            
            <p className="text-xl text-white/40 leading-relaxed font-light italic max-w-lg">
              Our model doesn't just process text; it understands the nuance of your tone and the intent behind your words. A symphony of algorithms working in sub-500ms unison.
            </p>
            
            <ul className="space-y-6 pt-6">
              <ListItem text="Prosody Detection Engine v3" />
              <ListItem text="Contextual Memory Buffer (Zero Retention)" />
              <ListItem text="LPU™ Powered Inference Pipeline" />
            </ul>
          </div>
          
          <div className="lg:col-span-6 order-1 lg:order-2">
            <motion.div 
              whileHover={{ scale: 1.02, rotate: 1 }}
              className="relative aspect-square grayscale hover:grayscale-0 transition-all duration-1000 rounded-[2px] overflow-hidden group shadow-2xl"
            >
              <div className="absolute inset-0 bg-gemini-gradient opacity-10 group-hover:opacity-30 transition-opacity" />
              <img 
                src="https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?q=80&w=2574&auto=format&fit=crop" 
                className="w-full h-full object-cover scale-110 group-hover:scale-100 transition-transform duration-[2s]" 
                alt="AI Core"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Privacy Section - Brutalist */}
      <section className="relative z-10 py-40 px-10 lg:px-20 max-w-7xl mx-auto border-y border-white/5 bg-[#0a0a0b]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-20 items-center">
          <div className="lg:col-span-5 space-y-10">
            <h2 className="text-[5vw] lg:text-[3vw] font-black leading-[0.85] tracking-tighter uppercase text-white">
              Security by<br />
              <span className="text-gemini-pink italic">Omission.</span>
            </h2>
            <p className="text-lg text-white/40 leading-relaxed font-light italic">
              Your voice is a biological signature. We treat it as such. Zero-persistence by default, encryption by mandate.
            </p>
            <div className="flex gap-10">
              <div className="space-y-2">
                <span className="text-mono-technical text-[8px] opacity-40">Encryption Type</span>
                <p className="text-xl font-black">E2E AES-256</p>
              </div>
              <div className="space-y-2">
                <span className="text-mono-technical text-[8px] opacity-40">Retention Policy</span>
                <p className="text-xl font-black">0.00 SEC</p>
              </div>
            </div>
          </div>
          <div className="lg:col-span-7 flex justify-end">
            <div className="grid grid-cols-2 gap-2 w-full max-w-md grayscale opacity-20 hover:opacity-100 transition-all duration-700">
               {[1,2,3,4].map(i => (
                  <div key={i} className="aspect-square border border-white/10 flex items-center justify-center group">
                     <Shield className="w-12 h-12 text-white/10 group-hover:text-gemini-blue transition-colors" />
                  </div>
               ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="relative z-10 py-32 px-10 lg:px-20 max-w-7xl mx-auto text-white">
        <div className="max-w-7xl mx-auto text-left mb-20">
          <h2 className="text-[5vw] lg:text-[3vw] font-black tracking-tighter uppercase mb-4">Pricing Models</h2>
          <p className="text-white/40 font-light italic text-lg">Scalable intelligence for biological and synthetic entities.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <PricingCard 
            name="Starter"
            price="0"
            features={['30 minutes / month', 'Standard Voice latency', 'Access to Llama 3 8B', 'Community support']}
            buttonText="Initiate"
            onClick={onStart}
          />
          <PricingCard 
            name="Pro"
            price="19"
            popular
            features={['Unlimited minutes', 'Ultra-low latency priority', 'Access to GPT-4o & Claude 3.5', 'Custom voice cloning', 'Priority support']}
            buttonText="Upgrade"
            onClick={onStart}
          />
          <PricingCard 
            name="Enterprise"
            price="Custom"
            features={['Unlimited users', 'On-premise deployment', 'Custom LLM fine-tuning', 'Dedicated account manager', '99.9% uptime SLA']}
            buttonText="Contact"
          />
        </div>
      </section>

      {/* Testimonials */}
      <section className="relative z-10 py-32 px-10 lg:px-20 max-w-7xl mx-auto border-t border-white/5 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end gap-8 mb-20">
            <div className="max-w-2xl">
              <h2 className="text-4xl md:text-5xl font-black tracking-tighter mb-4 italic">Beloved by creators.</h2>
              <p className="text-white/40 text-lg font-light italic">Synthetic feedback from verified biological users.</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 border-t border-white/5">
            <TestimonialCard 
              text="The speed is genuinely shocking. I've used every AI voice tool out there, but VoxFlow feels like I'm actually talking to a person."
              author="Elena Sorova"
              role="Senior UX Researcher"
            />
            <TestimonialCard 
              text="We integrated the VoxFlow API into our support flow and saw a 40% increase in resolution speed. It's the only real-time solution."
              author="Marcus Chen"
              role="CTO at TechFlow"
            />
            <TestimonialCard 
              text="As a writer, the Text Writer mode is a game changer. I can dictate my thoughts while pacing the room, and the AI cleans it up."
              author="Sarah Jenkins"
              role="Bestselling Author"
            />
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="relative z-10 py-40 px-10 lg:px-20 max-w-7xl mx-auto border-t border-white/5">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-20">
          <div className="lg:col-span-4">
             <h2 className="text-[4vw] font-black tracking-tighter uppercase leading-[0.85]">Common<br />Queries.</h2>
             <div className="mt-8 w-12 h-[1px] bg-gemini-blue" />
          </div>
          <div className="lg:col-span-8">
            <div className="space-y-4">
              <FAQItem 
                question="Latency architecture?" 
                answer="We utilize specialized LPU™ (Language Processing Unit) hardware from Groq for inference, combined with highly optimized audio streaming protocols that process chunks as small as 100ms."
              />
              <FAQItem 
                question="Voice customization?" 
                answer="Yes! Our Pro and Enterprise tiers include voice cloning technology that allows you to create a digital twin of any voice from just 30 seconds of reference audio."
              />
              <FAQItem 
                question="Security protocols?" 
                answer="By default, we only process audio transiently. Enterprise users can opt for zero-logging environments where no data ever touches a persistent disk."
              />
              <FAQItem 
                question="Model swapping?" 
                answer="VoxFlow is model-agnostic. We currently support Llama 3, Mixtral, GPT-4o, and Claude 3.5, with the ability to hot-swap during a live session."
              />
            </div>
          </div>
        </div>
      </section>

      {/* CTA / Newsletter */}
      <section className="relative z-10 py-32 px-10 lg:px-20 max-w-7xl mx-auto border-t border-white/5">
        <div className="max-w-5xl mx-auto bg-white text-black p-12 md:p-24 text-center overflow-hidden relative rounded-[2px]">
          <div className="relative z-10 space-y-12">
            <h2 className="text-5xl md:text-7xl font-black tracking-tighter uppercase leading-[0.85]">Join the<br />Intelligence.</h2>
            <p className="text-xl max-w-xl mx-auto leading-relaxed font-light italic">
              Stay updated with the latest in voice AI research and product updates. Join 10,000+ biological entities in the community.
            </p>
            
            <form className="max-w-md mx-auto flex flex-col sm:flex-row gap-4 pt-4" onSubmit={(e) => e.preventDefault()}>
              <input 
                type="email" 
                placeholder="EMAIL_ADDR" 
                className="flex-1 px-6 py-4 rounded-full bg-black/5 border border-black/10 focus:border-black outline-none transition-all placeholder:text-black/30 font-medium"
              />
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-10 py-4 rounded-full bg-black text-white font-black uppercase text-[10px] tracking-widest shadow-xl"
              >
                Join
              </motion.button>
            </form>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 bg-black px-10 py-24 text-white">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-20 text-white">
          <div className="lg:col-span-6 space-y-12 text-white">
            <div className="flex flex-col gap-1 text-white">
              <span className="text-3xl font-black tracking-tighter text-white">VOXFLOW</span>
              <span className="text-mono-technical text-[9px] text-white/40">Architecting the future of human prosody.</span>
            </div>
            
            <div className="flex items-center gap-8 text-white/40">
               <Twitter className="w-4 h-4 hover:text-white cursor-pointer transition-colors" />
               <Instagram className="w-4 h-4 hover:text-white cursor-pointer transition-colors" />
               <Github className="w-4 h-4 hover:text-white cursor-pointer transition-colors" />
            </div>
          </div>

          <div className="lg:col-span-6 grid grid-cols-2 md:grid-cols-3 gap-12 text-white">
            <FooterCol title="Systems" links={['Architecture', 'API', 'Latency', 'LPU™']} />
            <FooterCol title="Protocol" links={['Security', 'Privacy', 'Compliance', 'Ethics']} />
            <FooterCol title="Meta" links={['About', 'Careers', 'Documentation', 'Changelog']} />
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto pt-24 flex flex-col md:flex-row justify-between items-center gap-8 text-mono-technical text-[8px] opacity-20">
           <span>© 2026 VOXFLOW ANALYTICS INC. ALL RIGHTS RESERVED.</span>
           <div className="flex gap-10">
              <span className="hover:opacity-100 cursor-pointer transition-opacity">Terms</span>
              <span className="hover:opacity-100 cursor-pointer transition-opacity">Privacy</span>
              <span className="hover:opacity-100 cursor-pointer transition-opacity">Contact</span>
           </div>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <motion.div 
      whileHover={{ y: -8 }}
      className="p-10 border border-white/5 bg-gradient-to-br from-white/[0.03] to-transparent rounded-[2px] transition-all group relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-30 transition-opacity">
        {icon}
      </div>
      <div className="space-y-6 relative z-10">
        <span className="text-mono-technical text-[8px] opacity-40">Module • 001</span>
        <h3 className="text-2xl font-black tracking-tighter uppercase text-white">{title}</h3>
        <p className="text-white/40 text-sm leading-relaxed font-light">{description}</p>
        <div className="pt-4">
          <div className="w-8 h-[1px] bg-gemini-blue group-hover:w-full transition-all duration-700" />
        </div>
      </div>
    </motion.div>
  )
}

function PricingCard({ name, price, features, buttonText, popular, onClick }: any) {
  return (
    <motion.div 
      whileHover={{ scale: 1.01 }}
      className={`p-12 border ${
        popular ? 'border-gemini-blue bg-gemini-blue/[0.03]' : 'border-white/10 bg-white/[0.02]'
      } rounded-[4px] flex flex-col relative transition-all text-white`}
    >
      {popular && (
        <div className="absolute top-0 right-0 p-4">
          <div className="text-mono-technical text-[8px] px-3 py-1 bg-gemini-blue text-white rounded-full">
            Recommended
          </div>
        </div>
      )}
      <div className="mb-12">
        <h3 className="text-mono-technical text-[10px] text-white/40 mb-4 uppercase tracking-widest">{name}</h3>
        <div className="flex items-baseline gap-2">
          <span className="text-6xl font-black tracking-tighter text-white">
            {price === 'Custom' ? '??' : `$${price}`}
          </span>
          {price !== 'Custom' && <span className="text-mono-technical text-[10px] opacity-40 uppercase">/ MO</span>}
        </div>
      </div>
      <div className="flex-1 space-y-6 mb-16 text-sm font-light text-white/60 italic">
        {features.map((f: string) => (
          <div key={f} className="flex items-start gap-4 border-b border-white/5 pb-4">
            <span className="text-mono-technical text-[8px] text-gemini-blue mt-1">•</span>
            <span>{f}</span>
          </div>
        ))}
      </div>
      <motion.button 
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onClick}
        className={`w-full py-6 rounded-[2px] font-black text-[10px] uppercase tracking-[0.3em] transition-all ${
          popular ? 'bg-gemini-blue text-white shadow-[0_20px_40px_rgba(75,144,255,0.2)]' : 'border border-white/20 hover:bg-white hover:text-black'
        }`}
      >
        {buttonText}
      </motion.button>
    </motion.div>
  )
}

function TestimonialCard({ text, author, role }: { text: string, author: string, role: string }) {
  return (
    <motion.div 
      whileHover={{ y: -10 }}
      className="p-12 border-l border-white/10 bg-white/[0.01] transition-all flex flex-col justify-between group text-white"
    >
      <div className="space-y-8 text-white">
        <span className="text-mono-technical text-[8px] text-gemini-blue tracking-[0.5em] uppercase">Quote • Verified</span>
        <p className="text-2xl font-light leading-relaxed italic text-white/60 group-hover:text-white transition-colors duration-700">
          “{text}”
        </p>
      </div>
      <div className="mt-16 space-y-2 text-white">
        <p className="font-black text-xs uppercase tracking-widest text-white">{author}</p>
        <p className="text-mono-technical text-[8px] text-white/40 uppercase">{role}</p>
      </div>
    </motion.div>
  )
}

function FAQItem({ question, answer }: { question: string, answer: string }) {
  const [open, setOpen] = useState(false)
  return (
    <motion.div 
      className="border-b border-white/10 overflow-hidden text-white"
    >
      <button 
        onClick={() => setOpen(!open)}
        className="w-full py-10 flex justify-between items-center text-left group"
      >
        <h3 className="text-2xl lg:text-3xl font-black tracking-tighter uppercase group-hover:text-gemini-blue transition-colors text-white">{question}</h3>
        <motion.div
          animate={{ rotate: open ? 45 : 0 }}
          className="text-white/20"
        >
          <Plus className="w-8 h-8 font-light" />
        </motion.div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            <p className="pb-10 text-white/40 text-lg leading-relaxed max-w-2xl font-light italic">
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function ListItem({ text }: { text: string }) {
  return (
    <li className="flex items-center gap-3 text-white">
      <div className="w-5 h-5 rounded-full bg-gemini-blue/10 flex items-center justify-center">
        <ChevronRight className="w-3 h-3 text-gemini-blue" />
      </div>
      <span className="text-white/80 font-medium italic">{text}</span>
    </li>
  )
}

function FooterCol({ title, links }: { title: string, links: string[] }) {
  return (
    <div className="space-y-6 text-white">
      <h4 className="text-sm font-black uppercase tracking-widest text-white">{title}</h4>
      <ul className="space-y-4 text-white">
        {links.map(l => (
          <li key={l} className="text-white/40 text-[10px] uppercase font-bold tracking-widest hover:text-gemini-blue cursor-pointer transition-colors font-medium">{l}</li>
        ))}
      </ul>
    </div>
  )
}
