import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { SenjaTestimonials } from "@/components/funnel/SenjaTestimonials";

export default function RoadmapInfo() {
  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: 'var(--titan-font-base)' }}>

      {/* ─── NAV ─── */}
      <nav className="w-full px-6 py-5 flex items-center justify-between max-w-6xl mx-auto">
        <img src="/logo.png" alt="Doctor Lead Flow" className="h-10 w-auto" />
        <Link href="/quiz">
          <Button
            size="sm"
            className="rounded-lg font-semibold px-5 py-2 text-sm shadow-sm hover:shadow-md transition-all"
            style={{ background: 'var(--titan-grad-primary)', color: '#FFFFFF' }}
          >
            Start My Roadmap
          </Button>
        </Link>
      </nav>

      {/* ─── HERO ─── */}
      <section className="py-20 px-6 text-center">
        <div className="max-w-4xl mx-auto space-y-8">
          <p
            className="text-sm font-semibold uppercase tracking-widest"
            style={{ color: 'var(--titan-blue)' }}
          >
            Free for Health Professionals
          </p>

          <h1
            className="font-bold text-4xl sm:text-5xl md:text-6xl leading-tight"
            style={{
              color: 'var(--titan-text-primary)',
              letterSpacing: 'var(--titan-tracking-tight)',
              lineHeight: 'var(--titan-leading-tight)',
            }}
          >
            Get Your Free Personalized CEO Scaling Roadmap
            <span
              className="block mt-2"
              style={{
                background: 'var(--titan-grad-primary)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              ...in Under 3 Minutes
            </span>
          </h1>

          <p
            className="text-lg sm:text-xl max-w-2xl mx-auto"
            style={{
              color: 'var(--titan-text-secondary)',
              lineHeight: 'var(--titan-leading-relaxed)',
            }}
          >
            Discover your #1 business bottleneck and get a personalized action plan to break
            through your revenue plateau — whether you're at $30K, $60K, or $90K/month.
          </p>

          <div className="w-full max-w-2xl mx-auto">
            <Link href="/quiz">
              <button
                className="w-full text-lg rounded-xl font-bold shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5"
                style={{
                  padding: '16px 40px',
                  background: 'var(--titan-grad-primary)',
                  color: '#FFFFFF',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Start My Free Roadmap
              </button>
            </Link>
            <p
              className="text-sm mt-3"
              style={{ color: 'var(--titan-text-muted)' }}
            >
              No credit card required • Under 3 minutes
            </p>
          </div>

          <div
            className="inline-flex items-center gap-2 px-5 py-3 rounded-full border text-sm font-medium"
            style={{
              borderColor: 'var(--titan-green)',
              color: 'var(--titan-green)',
              backgroundColor: '#F0FDF4',
            }}
          >
            <span
              className="w-2 h-2 rounded-full inline-block"
              style={{ backgroundColor: 'var(--titan-green)' }}
            />
            Requested by 5,000+ health professionals
          </div>
        </div>
      </section>

      {/* ─── WHAT YOU'LL GET ─── */}
      <section className="py-20 px-6" style={{ backgroundColor: '#F8FAFC' }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2
              className="text-3xl sm:text-4xl font-bold mb-4"
              style={{ color: 'var(--titan-text-primary)' }}
            >
              Here's What's Inside Your Free Roadmap
            </h2>
            <p
              className="text-lg max-w-xl mx-auto"
              style={{ color: 'var(--titan-text-secondary)' }}
            >
              Everything you need to diagnose your bottlenecks and build a clear path forward.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[
              {
                number: '01',
                title: 'Business Health Score',
                body: 'See exactly where your practice stands across 4 key growth areas: lead generation, offer clarity, social presence, and conversion.',
              },
              {
                number: '02',
                title: 'Gap Analysis',
                body: 'Discover the gap between where you are now and where you could be — with projected revenue, leads, and close rate improvements.',
              },
              {
                number: '03',
                title: 'Personalized Action Plan',
                body: 'Get a week-by-week implementation roadmap tailored to your specific business type, revenue level, and goals.',
              },
              {
                number: '04',
                title: 'Bonus Playbooks',
                body: 'Receive 4 done-for-you playbooks: Offer Optimization, Facebook Ads, Instagram Growth, and Lead Generation.',
              },
            ].map((item) => (
              <div
                key={item.number}
                className="bg-white rounded-2xl p-8 shadow-sm border hover:shadow-md transition-shadow"
                style={{ borderColor: '#E2E8F0' }}
              >
                <p
                  className="text-sm font-bold mb-3"
                  style={{ color: 'var(--titan-blue)' }}
                >
                  {item.number}
                </p>
                <h3
                  className="text-xl font-bold mb-3"
                  style={{ color: 'var(--titan-text-primary)' }}
                >
                  {item.title}
                </h3>
                <p style={{ color: 'var(--titan-text-secondary)', lineHeight: 'var(--titan-leading-relaxed)' }}>
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2
              className="text-3xl sm:text-4xl font-bold mb-4"
              style={{ color: 'var(--titan-text-primary)' }}
            >
              How It Works
            </h2>
            <p
              className="text-lg max-w-xl mx-auto"
              style={{ color: 'var(--titan-text-secondary)' }}
            >
              Three simple steps to your personalized scaling plan.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: '1',
                title: 'Take the 3-Minute Assessment',
                body: 'Answer a few questions about your business, marketing, and operations.',
              },
              {
                step: '2',
                title: 'Get Your Personalized Roadmap',
                body: 'Our AI analyzes your responses and generates a custom scaling plan.',
              },
              {
                step: '3',
                title: 'Start Implementing',
                body: 'Follow your week-by-week action plan and track progress on your dashboard.',
              },
            ].map((item, idx) => (
              <div key={idx} className="text-center space-y-4">
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center text-white text-xl font-bold mx-auto shadow-md"
                  style={{ background: 'var(--titan-grad-primary)' }}
                >
                  {item.step}
                </div>
                <h3
                  className="text-xl font-bold"
                  style={{ color: 'var(--titan-text-primary)' }}
                >
                  {item.title}
                </h3>
                <p style={{ color: 'var(--titan-text-secondary)', lineHeight: 'var(--titan-leading-relaxed)' }}>
                  {item.body}
                </p>
              </div>
            ))}
          </div>

          <div className="text-center mt-14">
            <Link href="/quiz">
              <button
                className="text-lg px-10 py-6 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5"
                style={{ background: 'var(--titan-grad-primary)', color: '#FFFFFF', border: 'none', cursor: 'pointer' }}
              >
                Start My Free Roadmap
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* ─── SOCIAL PROOF / RESULTS ─── */}
      <section className="py-20 px-6" style={{ backgroundColor: '#F8FAFC' }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2
              className="text-3xl sm:text-4xl font-bold mb-4"
              style={{ color: 'var(--titan-text-primary)' }}
            >
              Our Strategies Have Generated $1.5M+ in Tracked Client Results
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              { stat: '5,000+', label: 'Health Professionals Assessed' },
              { stat: '$1.5M+', label: 'In Tracked Client Results' },
              { stat: '4.8/5', label: 'Average Satisfaction Rating' },
            ].map((item, idx) => (
              <div
                key={idx}
                className="bg-white rounded-2xl p-8 text-center shadow-sm border"
                style={{ borderColor: '#E2E8F0' }}
              >
                <p
                  className="text-4xl sm:text-5xl font-bold mb-2"
                  style={{
                    background: 'var(--titan-grad-primary)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  {item.stat}
                </p>
                <p
                  className="text-base font-medium"
                  style={{ color: 'var(--titan-text-secondary)' }}
                >
                  {item.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── TESTIMONIALS ─── */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2
              className="text-3xl sm:text-4xl font-bold mb-4"
              style={{ color: 'var(--titan-text-primary)' }}
            >
              What Health Professionals Are Saying
            </h2>
          </div>
          <SenjaTestimonials />
        </div>
      </section>

      {/* ─── WHO THIS IS FOR ─── */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2
              className="text-3xl sm:text-4xl font-bold mb-4"
              style={{ color: 'var(--titan-text-primary)' }}
            >
              This Roadmap Is For You If...
            </h2>
          </div>

          <ul className="space-y-5">
            {[
              "You're a health professional (chiropractor, dentist, med spa, PT, etc.)",
              "You're doing $5K-$100K+/month and want to scale predictably",
              "You're tired of guessing what to focus on next",
              "You want a clear, step-by-step plan — not more generic advice",
              "You're ready to invest 3 minutes to get a personalized roadmap",
            ].map((item, idx) => (
              <li key={idx} className="flex items-start gap-4">
                <span
                  className="mt-1 flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-white text-sm font-bold"
                  style={{ backgroundColor: 'var(--titan-green)' }}
                >
                  ✓
                </span>
                <span
                  className="text-lg"
                  style={{ color: 'var(--titan-text-secondary)', lineHeight: 'var(--titan-leading-relaxed)' }}
                >
                  {item}
                </span>
              </li>
            ))}
          </ul>

          <div className="text-center mt-12">
            <Link href="/quiz">
              <button
                className="text-lg px-10 py-6 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5"
                style={{ background: 'var(--titan-grad-primary)', color: '#FFFFFF', border: 'none', cursor: 'pointer' }}
              >
                Start My Free Roadmap
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section className="py-20 px-6" style={{ backgroundColor: '#F8FAFC' }}>
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2
              className="text-3xl sm:text-4xl font-bold mb-4"
              style={{ color: 'var(--titan-text-primary)' }}
            >
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-4">
            {[
              {
                q: 'Is this really free?',
                a: 'Yes, 100% free. No credit card required. We built this tool to help health professionals identify their biggest growth opportunities.',
              },
              {
                q: 'How long does it take?',
                a: 'The assessment takes about 3 minutes. Your personalized roadmap is generated instantly.',
              },
              {
                q: "What kind of businesses is this for?",
                a: 'This is designed specifically for health professionals — chiropractors, dentists, med spas, physical therapists, and similar practices doing $5K-$100K+/month.',
              },
              {
                q: 'How is the roadmap personalized?',
                a: 'Our AI analyzes your specific business type, revenue level, marketing efforts, operations, and goals to create a custom action plan — not a one-size-fits-all template.',
              },
              {
                q: 'What happens after I complete the assessment?',
                a: "You'll immediately get access to your dashboard with your Business Health Score, gap analysis, personalized roadmap, and 4 bonus playbooks. We'll also email you a link so you can access it anytime.",
              },
            ].map((item, idx) => (
              <details
                key={idx}
                className="bg-white rounded-xl border overflow-hidden group"
                style={{ borderColor: '#E2E8F0' }}
              >
                <summary
                  className="px-6 py-5 cursor-pointer flex items-center justify-between text-base font-semibold select-none list-none"
                  style={{ color: 'var(--titan-text-primary)' }}
                >
                  {item.q}
                  <span
                    className="ml-4 flex-shrink-0 text-xl leading-none transition-transform group-open:rotate-45"
                    style={{ color: 'var(--titan-blue)' }}
                  >
                    +
                  </span>
                </summary>
                <div
                  className="px-6 pb-5 text-base"
                  style={{
                    color: 'var(--titan-text-secondary)',
                    lineHeight: 'var(--titan-leading-relaxed)',
                    borderTop: '1px solid #E2E8F0',
                    paddingTop: '1rem',
                  }}
                >
                  {item.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FINAL CTA ─── */}
      <section
        className="py-24 px-6 text-center"
        style={{ backgroundColor: 'var(--titan-text-primary)' }}
      >
        <div className="max-w-3xl mx-auto space-y-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-white leading-tight">
            Ready to Discover Your Scaling Roadmap?
          </h2>
          <p
            className="text-lg"
            style={{ color: '#94A3B8' }}
          >
            Join 5,000+ health professionals who've already gotten their personalized growth plan.
          </p>
          <div className="flex flex-col items-center gap-4">
            <Link href="/quiz">
              <button
                className="text-lg px-10 py-6 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5"
                style={{ background: 'var(--titan-grad-primary)', color: '#FFFFFF', border: 'none', cursor: 'pointer' }}
              >
                Start My Free Roadmap
              </button>
            </Link>
            <p className="text-sm" style={{ color: '#64748B' }}>
              No credit card required • Under 3 minutes
            </p>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer
        className="py-8 px-6 border-t"
        style={{ borderColor: '#E2E8F0', backgroundColor: '#F8FAFC' }}
      >
        <div
          className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm"
          style={{ color: 'var(--titan-text-muted)' }}
        >
          <p>&copy; {new Date().getFullYear()} Doctor Lead Flow LLC</p>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:underline" style={{ color: 'var(--titan-text-muted)' }}>
              Privacy Policy
            </a>
            <a href="#" className="hover:underline" style={{ color: 'var(--titan-text-muted)' }}>
              Terms
            </a>
          </div>
        </div>
      </footer>

    </div>
  );
}
