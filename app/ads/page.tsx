"use client"

import { useState } from "react"

const ads = [
  // ─── ORIGINAL 10 ───
  {
    id: 1,
    label: "Pain Point",
    content: (
      <div className="w-[540px] h-[540px] bg-white rounded-2xl overflow-hidden shadow-xl flex flex-col">
        <div className="h-2 bg-gradient-to-r from-[#03556e] to-[#06adc3]" />
        <div className="flex-1 flex flex-col items-center justify-between p-10">
          <img src="/logo.png" alt="MarketMojo.ai" className="h-10" />
          <div className="text-center space-y-4">
            <p className="text-[#03556e] text-sm font-semibold uppercase tracking-wide">Stop guessing. Start closing.</p>
            <h2 className="text-3xl font-bold text-slate-900 leading-tight">
              Find local businesses<br />that need a website<br />
              <span className="text-[#06adc3]">in 30 seconds</span>
            </h2>
            <p className="text-slate-500 text-sm max-w-xs mx-auto">AI-powered prospecting for web designers, SEO consultants, and digital agencies.</p>
          </div>
          <div className="w-full"><div className="bg-[#03556e] text-white text-center py-3 rounded-lg font-semibold text-sm">Try Free → marketmojo.ai</div></div>
        </div>
      </div>
    ),
  },
  {
    id: 2,
    label: "ROI Hook",
    content: (
      <div className="w-[540px] h-[540px] bg-[#03556e] rounded-2xl overflow-hidden shadow-xl flex flex-col">
        <div className="flex-1 flex flex-col p-8">
          <div className="flex items-center justify-between mb-4">
            <img src="/logo.png" alt="MarketMojo.ai" className="h-8 brightness-0 invert" />
            <span className="text-[#06adc3] text-xs font-bold uppercase tracking-wider">For Agencies</span>
          </div>
          <div className="flex-1 flex flex-col justify-center space-y-5">
            <h2 className="text-2xl font-bold text-white leading-tight">Each scan costs <span className="text-[#06adc3]">$1</span>.<br />Each closed deal is worth <span className="text-[#06adc3]">$3,000+</span>.</h2>
            <p className="text-white/70 text-sm">Search any city. See who needs a website. Get their scores, issues, and contact info. Generate a branded audit report. Close the deal.</p>
          </div>
          <div className="rounded-xl overflow-hidden border border-white/20 shadow-lg">
            <img src="/cards.png" alt="MarketMojo results" className="w-full h-32 object-cover object-top" />
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 3,
    label: "Social Proof",
    content: (
      <div className="w-[540px] h-[540px] bg-white rounded-2xl overflow-hidden shadow-xl flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-between p-10">
          <img src="/logo.png" alt="MarketMojo.ai" className="h-9" />
          <div className="text-center space-y-5">
            <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 text-xs font-bold px-4 py-2 rounded-full"><span className="w-2 h-2 bg-green-500 rounded-full" />10,000+ businesses scanned</div>
            <h2 className="text-3xl font-bold text-slate-900 leading-tight">85% of local businesses<br />have website problems.</h2>
            <p className="text-slate-500 text-base">Find them. Audit them. Pitch them.<br /><span className="font-semibold text-[#03556e]">All in one tool.</span></p>
          </div>
          <div className="grid grid-cols-3 gap-3 w-full">
            <div className="bg-slate-50 rounded-lg p-3 text-center"><p className="text-lg font-bold text-[#03556e]">SEO</p><p className="text-[10px] text-slate-500">Score</p></div>
            <div className="bg-slate-50 rounded-lg p-3 text-center"><p className="text-lg font-bold text-[#03556e]">GBP</p><p className="text-[10px] text-slate-500">Audit</p></div>
            <div className="bg-slate-50 rounded-lg p-3 text-center"><p className="text-lg font-bold text-[#03556e]">PDF</p><p className="text-[10px] text-slate-500">Report</p></div>
          </div>
          <div className="w-full"><div className="bg-[#06adc3] text-white text-center py-3 rounded-lg font-semibold text-sm">Start Free at marketmojo.ai</div></div>
        </div>
      </div>
    ),
  },
  {
    id: 4,
    label: "FOMO / Competitor",
    content: (
      <div className="w-[540px] h-[540px] rounded-2xl overflow-hidden shadow-xl flex flex-col bg-gradient-to-br from-[#03556e] to-[#024a5f]">
        <div className="flex-1 flex flex-col p-10 justify-between">
          <img src="/logo.png" alt="MarketMojo.ai" className="h-9 brightness-0 invert self-start" />
          <div className="space-y-5">
            <h2 className="text-3xl font-bold text-white leading-tight">Your competitors are<br />already using AI to<br /><span className="text-[#06adc3]">steal your leads.</span></h2>
            <div className="space-y-2">
              {["Search any city & category", "AI scores every website instantly", "Generate branded audit reports", "Find emails & draft outreach"].map((item) => (
                <div key={item} className="flex items-center gap-3"><div className="w-5 h-5 rounded-full bg-[#06adc3]/20 flex items-center justify-center"><span className="text-[#06adc3] text-xs">✓</span></div><p className="text-white/80 text-sm">{item}</p></div>
              ))}
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur border border-white/20 text-white text-center py-3 rounded-lg font-semibold text-sm">Level the playing field → marketmojo.ai</div>
        </div>
      </div>
    ),
  },
  {
    id: 5,
    label: "White-Label Reports",
    content: (
      <div className="w-[540px] h-[540px] bg-white rounded-2xl overflow-hidden shadow-xl flex flex-col">
        <div className="h-2 bg-gradient-to-r from-[#06adc3] to-[#03556e]" />
        <div className="flex-1 flex flex-col p-8">
          <div className="flex items-center justify-between mb-5">
            <img src="/logo.png" alt="MarketMojo.ai" className="h-8" />
            <span className="text-xs font-bold text-[#03556e] bg-[#06adc3]/10 px-3 py-1 rounded-full">White-Label Reports</span>
          </div>
          <div className="flex-1 flex gap-4 items-center">
            <div className="flex-1 space-y-4">
              <h2 className="text-xl font-bold text-slate-900 leading-tight">Hand prospects a<br />professional audit<br /><span className="text-[#06adc3]">with your brand on it</span></h2>
              <p className="text-slate-500 text-xs leading-relaxed">One click generates a PDF with scores, issues, and recommendations. Add your logo — they see you as the expert.</p>
              <div className="bg-[#03556e] text-white text-center py-2.5 rounded-lg font-semibold text-xs">Try Free → marketmojo.ai</div>
            </div>
            <div className="w-44 shrink-0"><div className="rounded-lg overflow-hidden shadow-xl border border-slate-200 transform rotate-2"><img src="/report1.jpg" alt="Audit report preview" className="w-full" /></div></div>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 6,
    label: "Before/After",
    content: (
      <div className="w-[540px] h-[540px] bg-white rounded-2xl overflow-hidden shadow-xl flex flex-col">
        <div className="h-2 bg-gradient-to-r from-[#03556e] to-[#06adc3]" />
        <div className="flex-1 flex flex-col p-10 justify-between">
          <img src="/logo.png" alt="MarketMojo.ai" className="h-9 self-center" />
          <div className="space-y-6">
            <div className="bg-red-50 border border-red-100 rounded-xl p-4"><p className="text-xs font-bold text-red-500 mb-2">❌ WITHOUT MARKETMOJO</p><p className="text-sm text-slate-700">3 hours on Google Maps. 50 tabs open. No idea who actually needs your services. Cold emails that get ignored.</p></div>
            <div className="bg-green-50 border border-green-100 rounded-xl p-4"><p className="text-xs font-bold text-green-600 mb-2">✓ WITH MARKETMOJO</p><p className="text-sm text-slate-700">30 seconds to find 20 businesses. AI tells you exactly what&apos;s wrong with their site. Branded report ready to send.</p></div>
          </div>
          <div className="w-full"><div className="bg-[#03556e] text-white text-center py-3 rounded-lg font-semibold text-sm">Try Free → marketmojo.ai</div></div>
        </div>
      </div>
    ),
  },
  {
    id: 7,
    label: "Reddit Question Hook",
    content: (
      <div className="w-[540px] h-[540px] bg-slate-900 rounded-2xl overflow-hidden shadow-xl flex flex-col">
        <div className="flex-1 flex flex-col p-10 justify-between">
          <img src="/logo.png" alt="MarketMojo.ai" className="h-9 brightness-0 invert self-start" />
          <div className="space-y-5">
            <h2 className="text-2xl font-bold text-white leading-tight">How do you find clients<br />who actually need<br />a new website?</h2>
            <p className="text-white/60 text-sm leading-relaxed">I built a tool that searches any city, finds every local business, and uses AI to score their website quality. It shows you exactly who has a bad site, no site, or outdated tech.</p>
            <p className="text-white/60 text-sm">Then it generates a branded PDF audit you can send them as your pitch.</p>
            <p className="text-[#06adc3] text-sm font-semibold">$1 per scan. Search is free.</p>
          </div>
          <div className="bg-[#06adc3] text-white text-center py-3 rounded-lg font-semibold text-sm">marketmojo.ai — Try it free</div>
        </div>
      </div>
    ),
  },
  {
    id: 8,
    label: "The Math",
    content: (
      <div className="w-[540px] h-[540px] bg-white rounded-2xl overflow-hidden shadow-xl flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-between p-10">
          <img src="/logo.png" alt="MarketMojo.ai" className="h-9" />
          <div className="text-center space-y-6">
            <h2 className="text-2xl font-bold text-slate-900 leading-tight">The math is simple.</h2>
            <div className="space-y-3 text-left w-full max-w-xs mx-auto">
              {[{l:"Cost per scan",v:"$1",c:"text-[#03556e]"},{l:"Scans to find a lead",v:"~5",c:"text-[#03556e]"},{l:"Cost per qualified lead",v:"$5",c:"text-[#03556e]"},{l:"Average deal value",v:"$2,000–$5,000",c:"text-green-600"}].map((r)=>(<div key={r.l} className="flex items-center justify-between py-2 border-b border-slate-100"><span className="text-sm text-slate-600">{r.l}</span><span className={`text-sm font-bold ${r.c}`}>{r.v}</span></div>))}
              <div className="flex items-center justify-between py-2 bg-green-50 rounded-lg px-3"><span className="text-sm font-bold text-slate-900">ROI per deal</span><span className="text-sm font-bold text-green-600">400x–1000x</span></div>
            </div>
          </div>
          <div className="w-full"><div className="bg-[#03556e] text-white text-center py-3 rounded-lg font-semibold text-sm">Start Free → marketmojo.ai</div></div>
        </div>
      </div>
    ),
  },
  {
    id: 9,
    label: "Testimonial",
    content: (
      <div className="w-[540px] h-[540px] rounded-2xl overflow-hidden shadow-xl flex flex-col bg-[#03556e]">
        <div className="flex-1 flex flex-col p-10 justify-between">
          <img src="/logo.png" alt="MarketMojo.ai" className="h-9 brightness-0 invert self-start" />
          <div className="space-y-6">
            <div className="text-5xl text-[#06adc3]">&ldquo;</div>
            <p className="text-xl text-white font-medium leading-relaxed -mt-4">I used to spend entire mornings on Google Maps looking for prospects. Now I find 20 qualified leads in the time it takes to make coffee.</p>
            <p className="text-white/60 text-sm">— What our users tell us</p>
          </div>
          <div className="bg-white text-[#03556e] text-center py-3 rounded-lg font-semibold text-sm">See for yourself → marketmojo.ai</div>
        </div>
      </div>
    ),
  },
  {
    id: 10,
    label: "3-Step Process",
    content: (
      <div className="w-[540px] h-[540px] bg-white rounded-2xl overflow-hidden shadow-xl flex flex-col">
        <div className="h-2 bg-gradient-to-r from-[#03556e] to-[#06adc3]" />
        <div className="flex-1 flex flex-col p-10 justify-between">
          <div className="flex items-center justify-between"><img src="/logo.png" alt="MarketMojo.ai" className="h-8" /><span className="text-xs text-slate-500">How it works</span></div>
          <div className="space-y-5">
            {[{n:"1",t:"Search any city",d:"Pick a location and category. See every business and their web presence."},{n:"2",t:"AI analyzes their site",d:"SEO score, design quality, missing features, Google Business audit — all automatic."},{n:"3",t:"Send a branded report",d:"One-click PDF with your logo. Professional enough to close the deal."}].map((s)=>(<div key={s.n} className="flex items-start gap-4"><div className="w-10 h-10 rounded-full bg-[#06adc3]/10 flex items-center justify-center shrink-0"><span className="text-[#06adc3] font-bold">{s.n}</span></div><div><p className="font-bold text-slate-900 text-sm">{s.t}</p><p className="text-xs text-slate-500">{s.d}</p></div></div>))}
          </div>
          <div className="w-full"><div className="bg-[#03556e] text-white text-center py-3 rounded-lg font-semibold text-sm">Try Free → marketmojo.ai</div></div>
        </div>
      </div>
    ),
  },
  // ─── NEW 10: HIGHER CONVERTING ───
  {
    id: 11,
    label: "Urgency + Scarcity",
    content: (
      <div className="w-[540px] h-[540px] bg-white rounded-2xl overflow-hidden shadow-xl flex flex-col">
        <div className="h-2 bg-gradient-to-r from-amber-400 to-amber-600" />
        <div className="flex-1 flex flex-col items-center justify-between p-10">
          <img src="/logo.png" alt="MarketMojo.ai" className="h-9" />
          <div className="text-center space-y-4">
            <div className="inline-flex items-center gap-2 bg-amber-50 text-amber-700 text-xs font-bold px-4 py-2 rounded-full border border-amber-200">⚡ Limited: 5 free scans on signup</div>
            <h2 className="text-3xl font-bold text-slate-900 leading-tight">Every day you wait,<br />another agency closes<br /><span className="text-amber-600">your next client.</span></h2>
            <p className="text-slate-500 text-sm max-w-sm mx-auto">There are 847 businesses in your city without a proper website. Someone is going to sell them one. Will it be you?</p>
          </div>
          <div className="w-full space-y-2">
            <div className="bg-[#03556e] text-white text-center py-3 rounded-lg font-semibold text-sm">Claim Your Free Scans → marketmojo.ai</div>
            <p className="text-xs text-slate-400 text-center">No credit card required</p>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 12,
    label: "Specific Niche (Restaurants)",
    content: (
      <div className="w-[540px] h-[540px] bg-[#03556e] rounded-2xl overflow-hidden shadow-xl flex flex-col">
        <div className="flex-1 flex flex-col p-10 justify-between">
          <div className="flex items-center justify-between">
            <img src="/logo.png" alt="MarketMojo.ai" className="h-8 brightness-0 invert" />
            <span className="bg-white/10 text-white/80 text-xs px-3 py-1 rounded-full">Niche Targeting</span>
          </div>
          <div className="space-y-5">
            <h2 className="text-3xl font-bold text-white leading-tight">I searched<br />&ldquo;restaurants in Dallas&rdquo;</h2>
            <div className="bg-white/10 rounded-xl p-5 space-y-3">
              <div className="flex justify-between"><span className="text-white/70 text-sm">Results found</span><span className="text-white font-bold">47 businesses</span></div>
              <div className="flex justify-between"><span className="text-white/70 text-sm">No website at all</span><span className="text-red-400 font-bold">12 businesses</span></div>
              <div className="flex justify-between"><span className="text-white/70 text-sm">Outdated website</span><span className="text-amber-400 font-bold">19 businesses</span></div>
              <div className="flex justify-between"><span className="text-white/70 text-sm">Potential revenue</span><span className="text-[#06adc3] font-bold">$62,000+</span></div>
            </div>
            <p className="text-white/60 text-xs">That&apos;s one search. One category. One city.</p>
          </div>
          <div className="bg-[#06adc3] text-white text-center py-3 rounded-lg font-semibold text-sm">Find your niche → marketmojo.ai</div>
        </div>
      </div>
    ),
  },
  {
    id: 13,
    label: "Objection Killer",
    content: (
      <div className="w-[540px] h-[540px] bg-white rounded-2xl overflow-hidden shadow-xl flex flex-col">
        <div className="flex-1 flex flex-col p-10 justify-between">
          <img src="/logo.png" alt="MarketMojo.ai" className="h-9 self-start" />
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-slate-900 leading-tight">&ldquo;But how do I convince them<br />they need a new website?&rdquo;</h2>
            <p className="text-slate-500 text-sm">You don&apos;t. The data does.</p>
            <div className="space-y-2">
              <div className="flex items-center gap-3 bg-slate-50 rounded-lg p-3"><span className="text-red-500 font-bold text-lg">3/10</span><span className="text-sm text-slate-700">Their site quality score</span></div>
              <div className="flex items-center gap-3 bg-slate-50 rounded-lg p-3"><span className="text-red-500 font-bold text-lg">22/100</span><span className="text-sm text-slate-700">Their SEO score</span></div>
              <div className="flex items-center gap-3 bg-slate-50 rounded-lg p-3"><span className="text-amber-500 font-bold text-lg">5</span><span className="text-sm text-slate-700">Critical issues found</span></div>
            </div>
            <p className="text-slate-500 text-xs italic">Show them this in a branded PDF. Let the numbers do the selling.</p>
          </div>
          <div className="w-full"><div className="bg-[#03556e] text-white text-center py-3 rounded-lg font-semibold text-sm">Get the data → marketmojo.ai</div></div>
        </div>
      </div>
    ),
  },
  {
    id: 14,
    label: "Time Comparison",
    content: (
      <div className="w-[540px] h-[540px] rounded-2xl overflow-hidden shadow-xl flex flex-col bg-gradient-to-b from-slate-900 to-slate-800">
        <div className="flex-1 flex flex-col p-10 justify-between">
          <img src="/logo.png" alt="MarketMojo.ai" className="h-9 brightness-0 invert self-start" />
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white leading-tight">What takes you 4 hours<br />takes MarketMojo <span className="text-[#06adc3]">30 seconds</span>.</h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center"><p className="text-3xl font-bold text-red-400">4h</p><p className="text-xs text-white/50 mt-1">Manual research</p></div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center"><p className="text-3xl font-bold text-[#06adc3]">30s</p><p className="text-xs text-white/50 mt-1">With MarketMojo</p></div>
            </div>
            <div className="text-white/60 text-sm space-y-1">
              <p>✓ Find 20+ prospects instantly</p>
              <p>✓ AI scores each website</p>
              <p>✓ Generate pitch-ready reports</p>
            </div>
          </div>
          <div className="bg-[#06adc3] text-white text-center py-3 rounded-lg font-semibold text-sm">Save 4 hours today → marketmojo.ai</div>
        </div>
      </div>
    ),
  },
  {
    id: 15,
    label: "Screenshot Proof",
    content: (
      <div className="w-[540px] h-[540px] bg-white rounded-2xl overflow-hidden shadow-xl flex flex-col">
        <div className="flex-1 flex flex-col p-6">
          <div className="flex items-center justify-between mb-4">
            <img src="/logo.png" alt="MarketMojo.ai" className="h-8" />
            <span className="text-xs font-bold text-[#03556e]">Real results. Real data.</span>
          </div>
          <div className="flex-1 rounded-xl overflow-hidden border border-slate-200 shadow-inner">
            <img src="/siteanalysis.png" alt="Site analysis results" className="w-full h-full object-cover object-top" />
          </div>
          <div className="mt-4 space-y-3">
            <p className="text-sm font-bold text-slate-900 text-center">This is what you get for every business you scan.</p>
            <div className="bg-[#03556e] text-white text-center py-3 rounded-lg font-semibold text-sm">See it yourself → marketmojo.ai</div>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 16,
    label: "Freelancer Income",
    content: (
      <div className="w-[540px] h-[540px] bg-[#03556e] rounded-2xl overflow-hidden shadow-xl flex flex-col">
        <div className="flex-1 flex flex-col p-10 justify-between">
          <img src="/logo.png" alt="MarketMojo.ai" className="h-9 brightness-0 invert self-start" />
          <div className="space-y-5">
            <h2 className="text-3xl font-bold text-white leading-tight">What if you closed<br /><span className="text-[#06adc3]">3 more deals</span><br />this month?</h2>
            <div className="bg-white/10 rounded-xl p-5">
              <div className="space-y-3">
                <div className="flex justify-between items-center"><span className="text-white/70 text-sm">3 deals × $2,500 avg</span><span className="text-2xl font-bold text-[#06adc3]">$7,500</span></div>
                <div className="h-px bg-white/20" />
                <div className="flex justify-between items-center"><span className="text-white/70 text-sm">MarketMojo cost</span><span className="text-sm text-white/70">-$30/mo</span></div>
                <div className="flex justify-between items-center"><span className="text-white/70 text-sm font-bold">Net profit</span><span className="text-xl font-bold text-green-400">+$7,470</span></div>
              </div>
            </div>
            <p className="text-white/50 text-xs">Based on 30 scans finding 6 qualified leads, closing 50%.</p>
          </div>
          <div className="bg-white text-[#03556e] text-center py-3 rounded-lg font-semibold text-sm">Start earning more → marketmojo.ai</div>
        </div>
      </div>
    ),
  },
  {
    id: 17,
    label: "Problem Aware",
    content: (
      <div className="w-[540px] h-[540px] bg-white rounded-2xl overflow-hidden shadow-xl flex flex-col">
        <div className="h-2 bg-gradient-to-r from-[#03556e] to-[#06adc3]" />
        <div className="flex-1 flex flex-col p-10 justify-between">
          <img src="/logo.png" alt="MarketMojo.ai" className="h-9 self-start" />
          <div className="space-y-5">
            <h2 className="text-2xl font-bold text-slate-900 leading-tight">You&apos;re great at building websites.<br /><span className="text-slate-400">Finding clients? Not so much.</span></h2>
            <p className="text-slate-600 text-sm leading-relaxed">Most web designers are incredible at their craft but terrible at prospecting. You didn&apos;t learn sales in design school.</p>
            <p className="text-slate-600 text-sm leading-relaxed">What if a tool could find businesses that need you, show you exactly what&apos;s wrong with their site, and hand you a professional report to pitch them?</p>
            <p className="text-[#03556e] text-sm font-bold">That&apos;s MarketMojo.</p>
          </div>
          <div className="w-full"><div className="bg-[#03556e] text-white text-center py-3 rounded-lg font-semibold text-sm">Focus on design. We&apos;ll find the clients. →</div></div>
        </div>
      </div>
    ),
  },
  {
    id: 18,
    label: "Feature Stack",
    content: (
      <div className="w-[540px] h-[540px] rounded-2xl overflow-hidden shadow-xl flex flex-col bg-gradient-to-br from-[#03556e] via-[#044d63] to-[#024a5f]">
        <div className="flex-1 flex flex-col p-10 justify-between">
          <div className="flex items-center justify-between">
            <img src="/logo.png" alt="MarketMojo.ai" className="h-8 brightness-0 invert" />
            <span className="text-[#06adc3] text-xs font-bold">ALL-IN-ONE</span>
          </div>
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-white leading-tight">One tool. Everything you need<br />to fill your pipeline.</h2>
            <div className="grid grid-cols-2 gap-2">
              {["Local business search","AI site analysis","SEO scoring","GBP audit","Email finder","PDF reports","AI email drafting","Pipeline CRM"].map((f)=>(<div key={f} className="bg-white/10 rounded-lg px-3 py-2 text-xs text-white/90 font-medium">{f}</div>))}
            </div>
          </div>
          <div className="space-y-2">
            <div className="bg-[#06adc3] text-white text-center py-3 rounded-lg font-semibold text-sm">Try all features free → marketmojo.ai</div>
            <p className="text-white/40 text-xs text-center">Replaces 4+ tools. Starts at $30/mo.</p>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 19,
    label: "Direct Challenge",
    content: (
      <div className="w-[540px] h-[540px] bg-white rounded-2xl overflow-hidden shadow-xl flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-between p-10">
          <img src="/logo.png" alt="MarketMojo.ai" className="h-9" />
          <div className="text-center space-y-5">
            <h2 className="text-3xl font-bold text-slate-900 leading-tight">I bet you can&apos;t find<br />10 prospects in your city<br /><span className="text-[#06adc3]">in under 60 seconds.</span></h2>
            <p className="text-slate-500 text-sm max-w-sm mx-auto">Search is free. No signup required to browse. Pick any city, any category — see how many businesses need your help.</p>
            <div className="bg-slate-50 rounded-xl p-4 w-full">
              <p className="text-xs text-slate-500 mb-1">Average results per search:</p>
              <p className="text-2xl font-bold text-[#03556e]">20–40 businesses</p>
              <p className="text-xs text-slate-500 mt-1">~60% have website issues</p>
            </div>
          </div>
          <div className="w-full"><div className="bg-[#03556e] text-white text-center py-3 rounded-lg font-semibold text-sm">Take the challenge → marketmojo.ai</div></div>
        </div>
      </div>
    ),
  },
  {
    id: 20,
    label: "Emotional / Identity",
    content: (
      <div className="w-[540px] h-[540px] rounded-2xl overflow-hidden shadow-xl flex flex-col bg-slate-900">
        <div className="flex-1 flex flex-col p-10 justify-between">
          <img src="/logo.png" alt="MarketMojo.ai" className="h-9 brightness-0 invert self-start" />
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-white leading-tight">Built for the freelancer<br />who&apos;s tired of<br /><span className="text-[#06adc3]">feast or famine.</span></h2>
            <div className="space-y-3 text-white/70 text-sm">
              <p>You finish a project. Then silence.</p>
              <p>You scramble for the next client. Post on social. Wait.</p>
              <p>What if you had a pipeline of qualified leads — businesses that actually need what you sell — ready every morning?</p>
            </div>
            <p className="text-[#06adc3] font-semibold text-sm">That&apos;s what consistent prospecting looks like.</p>
          </div>
          <div className="bg-[#06adc3] text-white text-center py-3 rounded-lg font-semibold text-sm">End the feast-or-famine cycle → marketmojo.ai</div>
        </div>
      </div>
    ),
  },
]

export default function AdsPage() {
  const [hidden, setHidden] = useState<Set<number>>(new Set())

  const dismiss = (id: number) => {
    setHidden((prev) => new Set([...prev, id]))
  }

  const visibleAds = ads.filter((ad) => !hidden.has(ad.id))

  return (
    <div className="min-h-screen bg-slate-100 py-12 px-6">
      <div className="max-w-[600px] mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Ad Creatives ({visibleAds.length} remaining)</h1>
          <p className="text-sm text-slate-500 mb-4">Screenshot these at 1080x1080 for Facebook/Instagram/Reddit</p>
          {hidden.size > 0 && (
            <button onClick={() => setHidden(new Set())} className="text-xs text-[#06adc3] hover:underline">
              Reset all ({hidden.size} dismissed)
            </button>
          )}
        </div>

        <div className="flex flex-col items-center gap-16">
          {visibleAds.map((ad) => (
            <div key={ad.id} className="relative">
              <div className="flex items-center justify-between mb-3 px-1">
                <p className="text-sm font-bold text-slate-500">Ad #{ad.id} — {ad.label}</p>
                <button
                  onClick={() => dismiss(ad.id)}
                  className="text-xs text-slate-400 hover:text-red-500 transition-colors px-2 py-1 rounded hover:bg-red-50"
                >
                  ✕ Dismiss
                </button>
              </div>
              {ad.content}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
