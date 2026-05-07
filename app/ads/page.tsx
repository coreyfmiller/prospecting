export default function AdsPage() {
  return (
    <div className="min-h-screen bg-slate-100 py-12 px-6">
      <div className="max-w-[600px] mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Ad Creatives</h1>
          <p className="text-sm text-slate-500">Screenshot these at 1080x1080 for Facebook/Instagram/Reddit</p>
        </div>

        <div className="flex flex-col items-center gap-16">

          {/* ─── AD 1 ─── */}
          <div>
            <p className="text-sm font-bold text-slate-500 mb-3 text-center">Ad #1 — Pain Point</p>
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
          </div>

          {/* ─── AD 2 ─── */}
          <div>
            <p className="text-sm font-bold text-slate-500 mb-3 text-center">Ad #2 — ROI Hook</p>
            <div className="w-[540px] h-[540px] bg-[#03556e] rounded-2xl overflow-hidden shadow-xl flex flex-col">
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
          </div>

          {/* ─── AD 3 ─── */}
          <div>
            <p className="text-sm font-bold text-slate-500 mb-3 text-center">Ad #3 — Social Proof</p>
            <div className="w-[540px] h-[540px] bg-white rounded-2xl overflow-hidden shadow-xl flex flex-col">
              <div className="flex-1 flex flex-col items-center justify-between p-10">
                <img src="/logo.png" alt="MarketMojo.ai" className="h-9" />
                <div className="text-center space-y-5">
                  <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 text-xs font-bold px-4 py-2 rounded-full">
                    <span className="w-2 h-2 bg-green-500 rounded-full" />
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
          </div>

          {/* ─── AD 4 ─── */}
          <div>
            <p className="text-sm font-bold text-slate-500 mb-3 text-center">Ad #4 — FOMO / Competitor</p>
            <div className="w-[540px] h-[540px] rounded-2xl overflow-hidden shadow-xl flex flex-col bg-gradient-to-br from-[#03556e] to-[#024a5f]">
              <div className="flex-1 flex flex-col p-10 justify-between">
                <img src="/logo.png" alt="MarketMojo.ai" className="h-9 brightness-0 invert self-start" />
                <div className="space-y-5">
                  <h2 className="text-3xl font-bold text-white leading-tight">
                    Your competitors are<br />already using AI to<br />
                    <span className="text-[#06adc3]">steal your leads.</span>
                  </h2>
                  <div className="space-y-2">
                    {["Search any city & category", "AI scores every website instantly", "Generate branded audit reports", "Find emails & draft outreach"].map((item) => (
                      <div key={item} className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded-full bg-[#06adc3]/20 flex items-center justify-center">
                          <span className="text-[#06adc3] text-xs">✓</span>
                        </div>
                        <p className="text-white/80 text-sm">{item}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-white/10 backdrop-blur border border-white/20 text-white text-center py-3 rounded-lg font-semibold text-sm">
                  Level the playing field → marketmojo.ai
                </div>
              </div>
            </div>
          </div>

          {/* ─── AD 5 ─── */}
          <div>
            <p className="text-sm font-bold text-slate-500 mb-3 text-center">Ad #5 — White-Label Reports</p>
            <div className="w-[540px] h-[540px] bg-white rounded-2xl overflow-hidden shadow-xl flex flex-col">
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

          {/* ─── AD 6 ─── */}
          <div>
            <p className="text-sm font-bold text-slate-500 mb-3 text-center">Ad #6 — Before/After</p>
            <div className="w-[540px] h-[540px] bg-white rounded-2xl overflow-hidden shadow-xl flex flex-col">
              <div className="h-2 bg-gradient-to-r from-[#03556e] to-[#06adc3]" />
              <div className="flex-1 flex flex-col p-10 justify-between">
                <img src="/logo.png" alt="MarketMojo.ai" className="h-9 self-center" />
                <div className="space-y-6">
                  <div className="bg-red-50 border border-red-100 rounded-xl p-4">
                    <p className="text-xs font-bold text-red-500 mb-2">❌ WITHOUT MARKETMOJO</p>
                    <p className="text-sm text-slate-700">3 hours on Google Maps. 50 tabs open. No idea who actually needs your services. Cold emails that get ignored.</p>
                  </div>
                  <div className="bg-green-50 border border-green-100 rounded-xl p-4">
                    <p className="text-xs font-bold text-green-600 mb-2">✓ WITH MARKETMOJO</p>
                    <p className="text-sm text-slate-700">30 seconds to find 20 businesses. AI tells you exactly what's wrong with their site. Branded report ready to send.</p>
                  </div>
                </div>
                <div className="w-full">
                  <div className="bg-[#03556e] text-white text-center py-3 rounded-lg font-semibold text-sm">
                    Try Free → marketmojo.ai
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ─── AD 7 ─── */}
          <div>
            <p className="text-sm font-bold text-slate-500 mb-3 text-center">Ad #7 — Reddit Question Hook</p>
            <div className="w-[540px] h-[540px] bg-slate-900 rounded-2xl overflow-hidden shadow-xl flex flex-col">
              <div className="flex-1 flex flex-col p-10 justify-between">
                <img src="/logo.png" alt="MarketMojo.ai" className="h-9 brightness-0 invert self-start" />
                <div className="space-y-5">
                  <h2 className="text-2xl font-bold text-white leading-tight">
                    How do you find clients<br />who actually need<br />a new website?
                  </h2>
                  <p className="text-white/60 text-sm leading-relaxed">
                    I built a tool that searches any city, finds every local business, and uses AI to score their website quality. It shows you exactly who has a bad site, no site, or outdated tech.
                  </p>
                  <p className="text-white/60 text-sm">
                    Then it generates a branded PDF audit you can send them as your pitch.
                  </p>
                  <p className="text-[#06adc3] text-sm font-semibold">
                    $1 per scan. Search is free.
                  </p>
                </div>
                <div className="bg-[#06adc3] text-white text-center py-3 rounded-lg font-semibold text-sm">
                  marketmojo.ai — Try it free
                </div>
              </div>
            </div>
          </div>

          {/* ─── AD 8 ─── */}
          <div>
            <p className="text-sm font-bold text-slate-500 mb-3 text-center">Ad #8 — The Math</p>
            <div className="w-[540px] h-[540px] bg-white rounded-2xl overflow-hidden shadow-xl flex flex-col">
              <div className="flex-1 flex flex-col items-center justify-between p-10">
                <img src="/logo.png" alt="MarketMojo.ai" className="h-9" />
                <div className="text-center space-y-6">
                  <h2 className="text-2xl font-bold text-slate-900 leading-tight">The math is simple.</h2>
                  <div className="space-y-3 text-left w-full max-w-xs mx-auto">
                    {[
                      { label: "Cost per scan", value: "$1", color: "text-[#03556e]" },
                      { label: "Scans to find a lead", value: "~5", color: "text-[#03556e]" },
                      { label: "Cost per qualified lead", value: "$5", color: "text-[#03556e]" },
                      { label: "Average deal value", value: "$2,000–$5,000", color: "text-green-600" },
                    ].map((row) => (
                      <div key={row.label} className="flex items-center justify-between py-2 border-b border-slate-100">
                        <span className="text-sm text-slate-600">{row.label}</span>
                        <span className={`text-sm font-bold ${row.color}`}>{row.value}</span>
                      </div>
                    ))}
                    <div className="flex items-center justify-between py-2 bg-green-50 rounded-lg px-3">
                      <span className="text-sm font-bold text-slate-900">ROI per deal</span>
                      <span className="text-sm font-bold text-green-600">400x–1000x</span>
                    </div>
                  </div>
                </div>
                <div className="w-full">
                  <div className="bg-[#03556e] text-white text-center py-3 rounded-lg font-semibold text-sm">
                    Start Free → marketmojo.ai
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ─── AD 9 ─── */}
          <div>
            <p className="text-sm font-bold text-slate-500 mb-3 text-center">Ad #9 — Testimonial</p>
            <div className="w-[540px] h-[540px] rounded-2xl overflow-hidden shadow-xl flex flex-col bg-[#03556e]">
              <div className="flex-1 flex flex-col p-10 justify-between">
                <img src="/logo.png" alt="MarketMojo.ai" className="h-9 brightness-0 invert self-start" />
                <div className="space-y-6">
                  <div className="text-5xl text-[#06adc3]">&ldquo;</div>
                  <p className="text-xl text-white font-medium leading-relaxed -mt-4">
                    I used to spend entire mornings on Google Maps looking for prospects. Now I find 20 qualified leads in the time it takes to make coffee.
                  </p>
                  <p className="text-white/60 text-sm">— What our users tell us</p>
                </div>
                <div className="bg-white text-[#03556e] text-center py-3 rounded-lg font-semibold text-sm">
                  See for yourself → marketmojo.ai
                </div>
              </div>
            </div>
          </div>

          {/* ─── AD 10 ─── */}
          <div>
            <p className="text-sm font-bold text-slate-500 mb-3 text-center">Ad #10 — 3-Step Process</p>
            <div className="w-[540px] h-[540px] bg-white rounded-2xl overflow-hidden shadow-xl flex flex-col">
              <div className="h-2 bg-gradient-to-r from-[#03556e] to-[#06adc3]" />
              <div className="flex-1 flex flex-col p-10 justify-between">
                <div className="flex items-center justify-between">
                  <img src="/logo.png" alt="MarketMojo.ai" className="h-8" />
                  <span className="text-xs text-slate-500">How it works</span>
                </div>
                <div className="space-y-5">
                  {[
                    { num: "1", title: "Search any city", desc: "Pick a location and category. See every business and their web presence." },
                    { num: "2", title: "AI analyzes their site", desc: "SEO score, design quality, missing features, Google Business audit — all automatic." },
                    { num: "3", title: "Send a branded report", desc: "One-click PDF with your logo. Professional enough to close the deal." },
                  ].map((step) => (
                    <div key={step.num} className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-[#06adc3]/10 flex items-center justify-center shrink-0">
                        <span className="text-[#06adc3] font-bold">{step.num}</span>
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 text-sm">{step.title}</p>
                        <p className="text-xs text-slate-500">{step.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="w-full">
                  <div className="bg-[#03556e] text-white text-center py-3 rounded-lg font-semibold text-sm">
                    Try Free → marketmojo.ai
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
