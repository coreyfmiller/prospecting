export default function AdsPage() {
  return (
    <div className="min-h-screen bg-slate-100 py-12 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Ad Creatives</h1>
          <p className="text-sm text-slate-500">Screenshot these at 1080x1080 for Facebook/Instagram/Reddit</p>
        </div>

        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-8 justify-items-center">

          {/* ─── AD 1: Pain Point + Product Shot ─── */}
          <div className="w-[540px] h-[540px] bg-white rounded-2xl overflow-hidden shadow-xl flex flex-col relative">
            {/* Top gradient bar */}
            <div className="h-2 bg-gradient-to-r from-[#03556e] to-[#06adc3]" />
            <div className="flex-1 flex flex-col items-center justify-between p-10">
              <img src="/logo.png" alt="MarketMojo.ai" className="h-10" />
              <div className="text-center space-y-4">
                <p className="text-[#03556e] text-sm font-semibold uppercase tracking-wide">Stop guessing. Start closing.</p>
                <h2 className="text-3xl font-bold text-slate-900 leading-tight">
                  Find local businesses<br />that need a website<br />
                  <span className="text-[#06adc3]">in 30 seconds</span>
                </h2>
                <p className="text-slate-500 text-sm max-w-xs mx-auto">
                  AI-powered prospecting for web designers, SEO consultants, and digital agencies.
                </p>
              </div>
              <div className="w-full">
                <div className="bg-[#03556e] text-white text-center py-3 rounded-lg font-semibold text-sm">
                  Try Free → marketmojo.ai
                </div>
              </div>
            </div>
          </div>

          {/* ─── AD 2: Screenshot + ROI Hook ─── */}
          <div className="w-[540px] h-[540px] bg-[#03556e] rounded-2xl overflow-hidden shadow-xl flex flex-col relative">
            <div className="flex-1 flex flex-col p-8">
              <div className="flex items-center justify-between mb-4">
                <img src="/logo.png" alt="MarketMojo.ai" className="h-8 brightness-0 invert" />
                <span className="text-[#06adc3] text-xs font-bold uppercase tracking-wider">For Agencies</span>
              </div>
              <div className="flex-1 flex flex-col justify-center space-y-5">
                <h2 className="text-2xl font-bold text-white leading-tight">
                  Each scan costs <span className="text-[#06adc3]">$1</span>.<br />
                  Each closed deal is worth <span className="text-[#06adc3]">$3,000+</span>.
                </h2>
                <p className="text-white/70 text-sm">
                  Search any city. See who needs a website. Get their scores, issues, and contact info. Generate a branded audit report. Close the deal.
                </p>
              </div>
              <div className="rounded-xl overflow-hidden border border-white/20 shadow-lg">
                <img src="/cards.png" alt="MarketMojo results" className="w-full h-32 object-cover object-top" />
              </div>
            </div>
          </div>

          {/* ─── AD 3: Social Proof + Simplicity ─── */}
          <div className="w-[540px] h-[540px] bg-white rounded-2xl overflow-hidden shadow-xl flex flex-col relative">
            <div className="flex-1 flex flex-col items-center justify-between p-10">
              <img src="/logo.png" alt="MarketMojo.ai" className="h-9" />
              <div className="text-center space-y-5">
                <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 text-xs font-bold px-4 py-2 rounded-full">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  10,000+ businesses scanned
                </div>
                <h2 className="text-3xl font-bold text-slate-900 leading-tight">
                  85% of local businesses<br />have website problems.
                </h2>
                <p className="text-slate-500 text-base">
                  Find them. Audit them. Pitch them.<br />
                  <span className="font-semibold text-[#03556e]">All in one tool.</span>
                </p>
              </div>
              <div className="grid grid-cols-3 gap-3 w-full">
                <div className="bg-slate-50 rounded-lg p-3 text-center">
                  <p className="text-lg font-bold text-[#03556e]">SEO</p>
                  <p className="text-[10px] text-slate-500">Score</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3 text-center">
                  <p className="text-lg font-bold text-[#03556e]">GBP</p>
                  <p className="text-[10px] text-slate-500">Audit</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3 text-center">
                  <p className="text-lg font-bold text-[#03556e]">PDF</p>
                  <p className="text-[10px] text-slate-500">Report</p>
                </div>
              </div>
              <div className="w-full">
                <div className="bg-[#06adc3] text-white text-center py-3 rounded-lg font-semibold text-sm">
                  Start Free at marketmojo.ai
                </div>
              </div>
            </div>
          </div>

          {/* ─── AD 4: FOMO / Competitor Angle ─── */}
          <div className="w-[540px] h-[540px] rounded-2xl overflow-hidden shadow-xl flex flex-col relative bg-gradient-to-br from-[#03556e] to-[#024a5f]">
            <div className="flex-1 flex flex-col p-10 justify-between">
              <img src="/logo.png" alt="MarketMojo.ai" className="h-9 brightness-0 invert self-start" />
              <div className="space-y-5">
                <h2 className="text-3xl font-bold text-white leading-tight">
                  Your competitors are<br />already using AI to<br />
                  <span className="text-[#06adc3]">steal your leads.</span>
                </h2>
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-[#06adc3]/20 flex items-center justify-center">
                      <span className="text-[#06adc3] text-xs">✓</span>
                    </div>
                    <p className="text-white/80 text-sm">Search any city & category</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-[#06adc3]/20 flex items-center justify-center">
                      <span className="text-[#06adc3] text-xs">✓</span>
                    </div>
                    <p className="text-white/80 text-sm">AI scores every website instantly</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-[#06adc3]/20 flex items-center justify-center">
                      <span className="text-[#06adc3] text-xs">✓</span>
                    </div>
                    <p className="text-white/80 text-sm">Generate branded audit reports</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-[#06adc3]/20 flex items-center justify-center">
                      <span className="text-[#06adc3] text-xs">✓</span>
                    </div>
                    <p className="text-white/80 text-sm">Find emails & draft outreach</p>
                  </div>
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur border border-white/20 text-white text-center py-3 rounded-lg font-semibold text-sm">
                Level the playing field → marketmojo.ai
              </div>
            </div>
          </div>

          {/* ─── AD 5: Report Preview + Authority ─── */}
          <div className="w-[540px] h-[540px] bg-white rounded-2xl overflow-hidden shadow-xl flex flex-col relative">
            <div className="h-2 bg-gradient-to-r from-[#06adc3] to-[#03556e]" />
            <div className="flex-1 flex flex-col p-8">
              <div className="flex items-center justify-between mb-5">
                <img src="/logo.png" alt="MarketMojo.ai" className="h-8" />
                <span className="text-xs font-bold text-[#03556e] bg-[#06adc3]/10 px-3 py-1 rounded-full">White-Label Reports</span>
              </div>
              <div className="flex-1 flex gap-4 items-center">
                <div className="flex-1 space-y-4">
                  <h2 className="text-xl font-bold text-slate-900 leading-tight">
                    Hand prospects a<br />professional audit<br />
                    <span className="text-[#06adc3]">with your brand on it</span>
                  </h2>
                  <p className="text-slate-500 text-xs leading-relaxed">
                    One click generates a PDF with scores, issues, and recommendations. Add your logo — they see you as the expert.
                  </p>
                  <div className="bg-[#03556e] text-white text-center py-2.5 rounded-lg font-semibold text-xs">
                    Try Free → marketmojo.ai
                  </div>
                </div>
                <div className="w-44 shrink-0">
                  <div className="rounded-lg overflow-hidden shadow-xl border border-slate-200 transform rotate-2">
                    <img src="/report1.jpg" alt="Audit report preview" className="w-full" />
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
