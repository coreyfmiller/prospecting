import Link from "next/link"
import { Check, Search, BarChart3, FileText, Mail, MapPin, Zap, ArrowRight, Star, Shield, TrendingUp } from "lucide-react"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="MarketMojo.ai" className="h-8" />
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm">
            <a href="#features" className="text-slate-600 hover:text-[#03556e] transition-colors">Features</a>
            <a href="#how-it-works" className="text-slate-600 hover:text-[#03556e] transition-colors">How It Works</a>
            <a href="#pricing" className="text-slate-600 hover:text-[#03556e] transition-colors">Pricing</a>
            <a href="#faq" className="text-slate-600 hover:text-[#03556e] transition-colors">FAQ</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-slate-600 hover:text-[#03556e] transition-colors hidden sm:block">
              Log in
            </Link>
            <Link href="/login" className="text-sm font-medium bg-[#03556e] text-white px-4 py-2 rounded-lg hover:bg-[#03556e]/90 transition-colors">
              Start Free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-[#06adc3]/10 text-[#03556e] text-sm font-medium px-4 py-1.5 rounded-full mb-6">
              <Zap className="w-3.5 h-3.5" />
              5 free scans on signup
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 mb-6">
              Find businesses that need you —{" "}
              <span className="text-[#06adc3]">before your competitors do</span>
            </h1>
            <p className="text-lg sm:text-xl text-slate-600 mb-8 max-w-2xl mx-auto">
              Search any area, instantly audit their online presence, and generate professional reports that close deals. Built for agencies and freelancers who sell web design, SEO, and digital services.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href="/login" className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#03556e] text-white font-medium px-8 py-3.5 rounded-lg hover:bg-[#03556e]/90 transition-colors text-base">
                Start Prospecting Free <ArrowRight className="w-4 h-4" />
              </Link>
              <a href="#how-it-works" className="w-full sm:w-auto inline-flex items-center justify-center gap-2 border border-slate-200 text-slate-700 font-medium px-8 py-3.5 rounded-lg hover:bg-slate-50 transition-colors text-base">
                See How It Works
              </a>
            </div>
            <p className="text-sm text-slate-500 mt-4">No credit card required. Search is always free.</p>
          </div>

          {/* Hero Image */}
          <div className="relative max-w-5xl mx-auto">
            <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent z-10 pointer-events-none" />
            <div className="rounded-xl border border-slate-200 shadow-2xl overflow-hidden">
              <img src="/cards.png" alt="MarketMojo dashboard showing local business audit results" className="w-full" />
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof Bar */}
      <section className="py-12 border-y border-slate-100 bg-slate-50/50">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <p className="text-sm text-slate-500 mb-4">Trusted by agencies and freelancers to find qualified leads</p>
          <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-12">
            <div className="text-center">
              <p className="text-2xl font-bold text-[#03556e]">10,000+</p>
              <p className="text-xs text-slate-500">Businesses Scanned</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-[#03556e]">85%</p>
              <p className="text-xs text-slate-500">Have Website Issues</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-[#03556e]">30 sec</p>
              <p className="text-xs text-slate-500">Average Scan Time</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-[#03556e]">$1/scan</p>
              <p className="text-xs text-slate-500">Full Intelligence Report</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              From search to signed client in three steps
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Stop wasting hours on Google Maps. Find, qualify, and pitch local businesses in minutes.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-14 h-14 rounded-2xl bg-[#06adc3]/10 flex items-center justify-center mx-auto mb-5">
                <Search className="w-7 h-7 text-[#06adc3]" />
              </div>
              <div className="text-sm font-bold text-[#06adc3] mb-2">STEP 1</div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Search Any Area</h3>
              <p className="text-slate-600">
                Enter a city and category. We pull every local business from Google Places and instantly show you who has a website, who doesn't, and who's on Facebook only.
              </p>
            </div>
            <div className="text-center">
              <div className="w-14 h-14 rounded-2xl bg-[#06adc3]/10 flex items-center justify-center mx-auto mb-5">
                <BarChart3 className="w-7 h-7 text-[#06adc3]" />
              </div>
              <div className="text-sm font-bold text-[#06adc3] mb-2">STEP 2</div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Analyze & Score</h3>
              <p className="text-slate-600">
                One click gives you SEO scores, AI visibility ratings, site quality assessments, Google Business audits, and a full list of what's broken. All powered by AI.
              </p>
            </div>
            <div className="text-center">
              <div className="w-14 h-14 rounded-2xl bg-[#06adc3]/10 flex items-center justify-center mx-auto mb-5">
                <FileText className="w-7 h-7 text-[#06adc3]" />
              </div>
              <div className="text-sm font-bold text-[#06adc3] mb-2">STEP 3</div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Pitch & Close</h3>
              <p className="text-slate-600">
                Generate a branded PDF audit report and a personalized outreach email. Hand the prospect hard data that shows exactly why they need your services.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features - Analysis */}
      <section id="features" className="py-20 px-6 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="text-sm font-bold text-[#06adc3] mb-3">AI-POWERED ANALYSIS</div>
              <h2 className="text-3xl font-bold text-slate-900 mb-4">
                Know more about their website than they do
              </h2>
              <p className="text-lg text-slate-600 mb-6">
                Our AI crawls their site and delivers a complete assessment — design quality, content gaps, SEO issues, conversion problems, and a pitch-ready recommendation.
              </p>
              <ul className="space-y-3">
                {[
                  "SEO score, AI visibility score, and domain authority",
                  "Design, content, and conversion quality ratings",
                  "Critical issues detected automatically",
                  "Strengths and weaknesses breakdown",
                  "Google Business Profile completeness audit",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-[#06adc3] shrink-0 mt-0.5" />
                    <span className="text-slate-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl border border-slate-200 shadow-xl overflow-hidden">
              <img src="/siteanalysis.png" alt="AI-powered site analysis showing scores and assessment" className="w-full" />
            </div>
          </div>
        </div>
      </section>

      {/* Features - Reports */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1">
              <div className="relative">
                <div className="rounded-xl border border-slate-200 shadow-xl overflow-hidden transform rotate-1">
                  <img src="/report1.jpg" alt="Professional PDF audit report cover page" className="w-full" />
                </div>
                <div className="absolute -bottom-4 -right-4 w-2/3 rounded-xl border border-slate-200 shadow-xl overflow-hidden transform -rotate-2">
                  <img src="/report2.jpg" alt="PDF report showing performance scores" className="w-full" />
                </div>
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <div className="text-sm font-bold text-[#06adc3] mb-3">BRANDED REPORTS</div>
              <h2 className="text-3xl font-bold text-slate-900 mb-4">
                Professional reports with your brand, not ours
              </h2>
              <p className="text-lg text-slate-600 mb-6">
                Generate polished PDF audit reports in one click. Add your logo and company name — your prospects see your brand as the expert, backed by real data.
              </p>
              <ul className="space-y-3">
                {[
                  "White-labeled with your company name and logo",
                  "Overall health score with clear verdict",
                  "Detailed breakdown of every issue found",
                  "AI-generated recommendations and next steps",
                  "Ready to email or present in a meeting",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-[#06adc3] shrink-0 mt-0.5" />
                    <span className="text-slate-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="py-20 px-6 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Everything you need to prospect smarter</h2>
            <p className="text-lg text-slate-600">One tool replaces hours of manual research</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Search, title: "Local Business Search", desc: "Search any city and category. See every business with their web presence status instantly." },
              { icon: BarChart3, title: "SEO & AI Scoring", desc: "SEO score, AI visibility (GEO), and domain authority for every site you scan." },
              { icon: MapPin, title: "Google Business Audit", desc: "Completeness score, missing fields, photo count, review analysis — the full GBP picture." },
              { icon: Mail, title: "Email Finder", desc: "Automatically find business owner emails. Draft personalized outreach in seconds." },
              { icon: FileText, title: "PDF Reports", desc: "One-click branded audit reports. Professional enough to hand directly to a prospect." },
              { icon: Shield, title: "Chain Filtering", desc: "Automatically hide big chains and franchises. Focus on the local businesses that actually need you." },
              { icon: TrendingUp, title: "Pipeline Tracking", desc: "Tag prospects, track your pipeline stages, add notes. A lightweight CRM built for prospecting." },
              { icon: Star, title: "Priority Leads", desc: "Mark hot leads, dismiss dead ends. Your prospect list stays clean and actionable." },
              { icon: Zap, title: "Batch Scanning", desc: "Scan entire search results at once. Analyze 20+ businesses in a single click." },
            ].map((feature) => (
              <div key={feature.title} className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md transition-shadow">
                <feature.icon className="w-8 h-8 text-[#06adc3] mb-4" />
                <h3 className="font-bold text-slate-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-slate-600">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              One closed deal pays for a year
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Each scan costs less than a coffee. Search is always free — you only pay when you analyze, audit, or generate reports.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Starter */}
            <div className="rounded-2xl border border-slate-200 p-8 hover:shadow-lg transition-shadow">
              <h3 className="font-bold text-lg text-slate-900 mb-1">Starter</h3>
              <p className="text-sm text-slate-500 mb-4">For freelancers getting started</p>
              <div className="mb-6">
                <span className="text-4xl font-bold text-slate-900">$30</span>
                <span className="text-slate-500">/mo</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2 text-sm text-slate-700"><Check className="w-4 h-4 text-[#06adc3]" /> 30 scan credits/month</li>
                <li className="flex items-center gap-2 text-sm text-slate-700"><Check className="w-4 h-4 text-[#06adc3]" /> Unlimited searches</li>
                <li className="flex items-center gap-2 text-sm text-slate-700"><Check className="w-4 h-4 text-[#06adc3]" /> AI site analysis</li>
                <li className="flex items-center gap-2 text-sm text-slate-700"><Check className="w-4 h-4 text-[#06adc3]" /> PDF reports</li>
                <li className="flex items-center gap-2 text-sm text-slate-700"><Check className="w-4 h-4 text-[#06adc3]" /> Email finder</li>
              </ul>
              <Link href="/login" className="block w-full text-center py-3 rounded-lg border border-slate-200 font-medium text-slate-700 hover:bg-slate-50 transition-colors">
                Get Started
              </Link>
              <p className="text-xs text-slate-500 text-center mt-3">$1.00 per scan</p>
            </div>

            {/* Pro */}
            <div className="rounded-2xl border-2 border-[#06adc3] p-8 relative shadow-lg">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#06adc3] text-white text-xs font-bold px-3 py-1 rounded-full">
                MOST POPULAR
              </div>
              <h3 className="font-bold text-lg text-slate-900 mb-1">Pro</h3>
              <p className="text-sm text-slate-500 mb-4">For active prospectors</p>
              <div className="mb-6">
                <span className="text-4xl font-bold text-slate-900">$95</span>
                <span className="text-slate-500">/mo</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2 text-sm text-slate-700"><Check className="w-4 h-4 text-[#06adc3]" /> 100 scan credits/month</li>
                <li className="flex items-center gap-2 text-sm text-slate-700"><Check className="w-4 h-4 text-[#06adc3]" /> Unlimited searches</li>
                <li className="flex items-center gap-2 text-sm text-slate-700"><Check className="w-4 h-4 text-[#06adc3]" /> AI site analysis</li>
                <li className="flex items-center gap-2 text-sm text-slate-700"><Check className="w-4 h-4 text-[#06adc3]" /> PDF reports</li>
                <li className="flex items-center gap-2 text-sm text-slate-700"><Check className="w-4 h-4 text-[#06adc3]" /> Email finder</li>
                <li className="flex items-center gap-2 text-sm text-slate-700"><Check className="w-4 h-4 text-[#06adc3]" /> AI email drafting</li>
                <li className="flex items-center gap-2 text-sm text-slate-700"><Check className="w-4 h-4 text-[#06adc3]" /> Batch scanning</li>
              </ul>
              <Link href="/login" className="block w-full text-center py-3 rounded-lg bg-[#03556e] text-white font-medium hover:bg-[#03556e]/90 transition-colors">
                Get Started
              </Link>
              <p className="text-xs text-slate-500 text-center mt-3">$0.95 per scan</p>
            </div>

            {/* Agency */}
            <div className="rounded-2xl border border-slate-200 p-8 hover:shadow-lg transition-shadow">
              <h3 className="font-bold text-lg text-slate-900 mb-1">Agency</h3>
              <p className="text-sm text-slate-500 mb-4">For teams doing volume</p>
              <div className="mb-6">
                <span className="text-4xl font-bold text-slate-900">$225</span>
                <span className="text-slate-500">/mo</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2 text-sm text-slate-700"><Check className="w-4 h-4 text-[#06adc3]" /> 250 scan credits/month</li>
                <li className="flex items-center gap-2 text-sm text-slate-700"><Check className="w-4 h-4 text-[#06adc3]" /> Unlimited searches</li>
                <li className="flex items-center gap-2 text-sm text-slate-700"><Check className="w-4 h-4 text-[#06adc3]" /> Everything in Pro</li>
                <li className="flex items-center gap-2 text-sm text-slate-700"><Check className="w-4 h-4 text-[#06adc3]" /> White-label reports</li>
                <li className="flex items-center gap-2 text-sm text-slate-700"><Check className="w-4 h-4 text-[#06adc3]" /> Priority support</li>
              </ul>
              <Link href="/login" className="block w-full text-center py-3 rounded-lg border border-slate-200 font-medium text-slate-700 hover:bg-slate-50 transition-colors">
                Get Started
              </Link>
              <p className="text-xs text-slate-500 text-center mt-3">$0.90 per scan</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 px-6 bg-slate-50">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-12">Frequently asked questions</h2>
          <div className="space-y-6">
            {[
              {
                q: "What counts as a 'scan credit'?",
                a: "One credit is used each time you analyze a website, run a Google Business audit, or find an email. Searching for businesses and viewing results is always free and unlimited."
              },
              {
                q: "Can I try it before paying?",
                a: "Yes. You get 5 free scan credits when you sign up — no credit card required. Search is always free, so you can browse businesses in any area without using credits."
              },
              {
                q: "Do the PDF reports show my brand or yours?",
                a: "Yours. Set your company name and upload your logo in settings. Reports show your brand prominently — MarketMojo.ai only appears in small footer text as the generation engine."
              },
              {
                q: "What data sources do you use?",
                a: "We pull business listings from Google Places, crawl websites with a headless browser, analyze content with AI (Gemini), check domain authority via Moz, and audit Google Business Profiles directly."
              },
              {
                q: "Is this different from SEMrush or BrightLocal?",
                a: "Those tools are built for managing existing clients. MarketMojo is built for finding new ones. We focus on prospecting — discovering businesses that need your services and giving you the data to pitch them."
              },
              {
                q: "What if a site can't be analyzed?",
                a: "Some sites have enterprise-level bot protection (Cloudflare, etc.) that blocks automated tools. If we can't analyze a site, we'll tell you exactly why and refund the credit automatically."
              },
            ].map((faq) => (
              <div key={faq.q} className="bg-white rounded-xl border border-slate-200 p-6">
                <h3 className="font-bold text-slate-900 mb-2">{faq.q}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-6 bg-[#03556e]">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Start finding leads in 30 seconds
          </h2>
          <p className="text-lg text-white/70 mb-8">
            Search is free. No credit card required. See which businesses in your area need your services right now.
          </p>
          <Link href="/login" className="inline-flex items-center gap-2 bg-[#06adc3] text-white font-medium px-8 py-4 rounded-lg hover:bg-[#06adc3]/90 transition-colors text-lg">
            Start Prospecting Free <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-slate-100">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="MarketMojo.ai" className="h-6" />
          </div>
          <p className="text-sm text-slate-500">
            Local Intelligence. Real Results.
          </p>
          <div className="flex items-center gap-6 text-sm text-slate-500">
            <a href="#" className="hover:text-slate-700 transition-colors">Privacy</a>
            <a href="#" className="hover:text-slate-700 transition-colors">Terms</a>
            <a href="mailto:support@marketmojo.ai" className="hover:text-slate-700 transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
