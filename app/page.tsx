import Link from 'next/link'
import { TryNowButton } from '@/components/TryNowButton'
import { Github, Target, Trophy, Shield, ArrowRight, Check } from 'lucide-react'

export default function LandingPage() {
  return (
    <main className="min-h-screen">
      {/* Header */}
      <header className="border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Target className="h-8 w-8 text-primary-600" />
            <span className="font-bold text-xl text-gray-900">Stakes</span>
          </Link>
          <nav className="flex items-center gap-6">
            <Link href="/pricing" className="text-gray-600 hover:text-gray-900 font-medium">
              Pricing
            </Link>
            <Link href="/account" className="text-gray-600 hover:text-gray-900 font-medium">
              Account
            </Link>
            <TryNowButton />
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="py-20 md:py-32">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-100 text-primary-700 text-sm font-medium mb-6">
            <Github className="h-4 w-4" />
            Powered by GitHub Releases
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Ship Every Week,
            <br />
            <span className="text-primary-600">Or Lose Your Deposit</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            The accountability tool for indie builders. Connect your GitHub repo,
            set your weekly cutoff, and prove you&apos;re shipping. Your deposit is
            refunded on success — or donated if you miss a week.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <TryNowButton size="large" />
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 px-6 py-3 text-gray-700 font-medium hover:text-gray-900 transition-colors"
            >
              View Pricing
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <p className="text-sm text-gray-500 mt-6">
            No signup required. Try the full experience for free.
          </p>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            How It Works
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="w-12 h-12 rounded-lg bg-primary-100 flex items-center justify-center mb-4">
                <Github className="h-6 w-6 text-primary-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">1. Connect Your Repo</h3>
              <p className="text-gray-600">
                Link any public GitHub repository. We&apos;ll track your releases automatically.
              </p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="w-12 h-12 rounded-lg bg-success-100 flex items-center justify-center mb-4">
                <Target className="h-6 w-6 text-success-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">2. Set Your Cutoff</h3>
              <p className="text-gray-600">
                Choose your weekly deadline. Sunday midnight? Friday EOD? You decide.
              </p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="w-12 h-12 rounded-lg bg-warning-100 flex items-center justify-center mb-4">
                <Trophy className="h-6 w-6 text-warning-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">3. Ship & Win</h3>
              <p className="text-gray-600">
                Publish a release before cutoff. Your scorecard tracks your streak.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Real Accountability,
                <br />Real Stakes
              </h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="p-1 rounded-full bg-success-100">
                    <Check className="h-4 w-4 text-success-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">4-Week Deposit Sprints</h4>
                    <p className="text-gray-600 text-sm">
                      Put money on the line. Ship all 4 weeks and get it back.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-1 rounded-full bg-success-100">
                    <Check className="h-4 w-4 text-success-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Automatic Verification</h4>
                    <p className="text-gray-600 text-sm">
                      GitHub Releases prove you shipped. No self-reporting needed.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-1 rounded-full bg-success-100">
                    <Check className="h-4 w-4 text-success-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Flexible Evidence</h4>
                    <p className="text-gray-600 text-sm">
                      Rate limited? Add a manual link to your blog post, tweet, or demo.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-1 rounded-full bg-success-100">
                    <Check className="h-4 w-4 text-success-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Try Before You Commit</h4>
                    <p className="text-gray-600 text-sm">
                      Run simulated sprints with your real release history. No signup.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-2xl p-8">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-gray-900">Sprint Summary</h4>
                  <span className="text-xs px-2 py-1 bg-success-100 text-success-700 rounded-full">
                    Simulation
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-3 rounded-lg bg-success-50">
                    <p className="text-2xl font-bold text-success-600">3</p>
                    <p className="text-xs text-success-600">Shipped</p>
                  </div>
                  <div className="p-3 rounded-lg bg-warning-50">
                    <p className="text-2xl font-bold text-warning-600">1</p>
                    <p className="text-xs text-warning-600">Grace</p>
                  </div>
                  <div className="p-3 rounded-lg bg-danger-50">
                    <p className="text-2xl font-bold text-danger-600">0</p>
                    <p className="text-xs text-danger-600">Missed</p>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-success-50 rounded-lg text-center">
                  <p className="text-sm text-success-700 font-medium">
                    Sprint passed! Deposit would be refunded.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <Shield className="h-12 w-12 text-primary-400 mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Ship Consistently?
          </h2>
          <p className="text-gray-400 mb-8 max-w-xl mx-auto">
            Start with a free simulation. See how you would have done over the
            last 4 weeks. No signup, no credit card.
          </p>
          <TryNowButton size="large" />
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-gray-100">
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary-600" />
            <span className="font-semibold text-gray-900">Stakes Goal Tracker</span>
          </div>
          <p className="text-sm text-gray-500">
            Built for indie builders who ship.
          </p>
        </div>
      </footer>
    </main>
  )
}
