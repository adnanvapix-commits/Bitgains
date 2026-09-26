"use client";

import { motion } from "framer-motion";
import {
  ArrowRight,
  Shield,
  TrendingUp,
  BarChart3,
  Users,
  DollarSign,
  Lock,
  HelpCircle,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import LaunchPopup from "@/components/LaunchPopup";

export default function Home() {
  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(150deg, #FDFAF6 0%, #F0EBE3 60%, #FDFAF6 100%)' }}>
      {/* Launch Celebration Popup */}
      <LaunchPopup />
      {/* Navigation */}
      <nav className="relative z-10 px-4 sm:px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center space-x-3 group"
          >
            <div className="relative">
              <div className="w-13 h-13 rounded-xl overflow-hidden bg-gradient-to-br from-emerald-500/20 to-green-400/20 backdrop-blur-sm border border-emerald-400/30 p-1 shadow-lg shadow-emerald-500/25 group-hover:shadow-emerald-500/40 transition-all duration-300">
                <Image
                  src="/bitgain.PNG"
                  alt="BitGain Logo"
                  width={48}
                  height={48}
                  className="w-full h-full object-contain rounded-lg"
                />
              </div>
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-emerald-400/10 to-green-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
            <span className="text-xl sm:text-2xl font-bold text-white relative">
              <span className="bg-gradient-to-r from-emerald-400 via-green-400 to-emerald-300 bg-clip-text text-transparent drop-shadow-lg">
                BitGains
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 via-green-400 to-emerald-300 bg-clip-text text-transparent blur-sm opacity-50 -z-10">
                BitGains
              </div>
            </span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex items-center space-x-2 sm:space-x-4"
          >
            <Link
              href="/support"
              className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-1.5 sm:py-2 bg-gradient-to-r from-cyan-500/20 to-blue-400/20 text-cyan-400 border border-cyan-500/30 rounded-lg hover:from-cyan-500/30 hover:to-blue-400/30 transition-all duration-300 group"
              title="Help & Support"
            >
              <HelpCircle className="w-4 h-4 group-hover:scale-110 transition-transform" />
              <span className="text-xs sm:text-sm font-medium hidden sm:inline">
                Support
              </span>
            </Link>
            <Link
              href="/login"
              className="text-warm-700 hover:text-warm-900 transition-colors text-sm sm:text-base px-2 py-1 rounded-lg hover:bg-warm-400/10"
            >
              Login
            </Link>
            <Link
              href="/signup"
              className="btn-crypto text-sm sm:text-base px-3 sm:px-4 py-2"
            >
              Get Started
            </Link>
          </motion.div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative px-4 sm:px-6 py-12 sm:py-16 md:py-20">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-6 sm:space-y-8"
          >
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-white leading-tight">
              Stake USDT.
              <br />
              <span className="neon-text text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-green-400">
                Earn Every Month.
              </span>
            </h1>

            <p className="text-lg sm:text-xl md:text-2xl text-warm-700 max-w-4xl mx-auto leading-relaxed px-4 sm:px-0">
              Lock your USDT for one month and earn{" "}
              <span className="font-bold text-emerald-400">5% – 15% APM</span>.
              <br className="hidden sm:block" />
              <span className="sm:hidden"> </span>
              Your appreciation is paid once your lock period ends.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 sm:gap-4 justify-center items-stretch sm:items-center pt-6 sm:pt-8 px-4 sm:px-0 max-w-md sm:max-w-none mx-auto">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-full sm:w-auto"
              >
                <Link
                  href="/signup"
                  className="btn-crypto text-base sm:text-lg px-6 sm:px-8 py-4 sm:py-4 inline-flex items-center justify-center w-full sm:w-auto min-h-[52px]"
                >
                  Start Staking Now
                  <ArrowRight className="ml-2 w-4 sm:w-5 h-4 sm:h-5" />
                </Link>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-full sm:w-auto"
              >
                <Link
                  href="#features"
                  className="btn-crypto-outline text-base sm:text-lg px-6 sm:px-8 py-4 sm:py-4 w-full sm:w-auto text-center min-h-[52px] flex items-center justify-center"
                >
                  Learn More
                </Link>
              </motion.div>
            </div>
          </motion.div>
        </div>

        {/* Floating Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            animate={{
              y: [0, -20, 0],
              rotate: [0, 5, 0],
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute top-20 left-10 w-20 h-20 bg-emerald-500/20 rounded-full blur-xl"
          />
          <motion.div
            animate={{
              y: [0, 20, 0],
              rotate: [0, -5, 0],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute top-40 right-20 w-32 h-32 bg-cyan-500/20 rounded-full blur-xl"
          />
          <motion.div
            animate={{
              y: [0, -15, 0],
              x: [0, 10, 0],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute bottom-20 left-1/4 w-16 h-16 bg-green-500/20 rounded-full blur-xl"
          />
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="px-4 sm:px-6 py-12 sm:py-16 md:py-20">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-12 sm:mb-16"
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 sm:mb-6">
              Why Stake with Us?
            </h2>
            <p className="text-lg sm:text-xl text-warm-700 max-w-2xl mx-auto px-4 sm:px-0">
              We keep it straightforward and profitable for your USDT staking
              journey.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {[
              {
                icon: Shield,
                title: "Simple & Clear",
                description:
                  "We keep it straightforward — stake only USDT, no other coins or confusing plans.",
                color: "from-emerald-500 to-green-400",
              },
              {
                icon: TrendingUp,
                title: "Attractive Earnings",
                description:
                  "Earn between 5% and 15% APM depending on your stake amount. Bigger stakes bring higher rates.",
                color: "from-cyan-500 to-blue-400",
              },
              {
                icon: Lock,
                title: "One-Month Lock",
                description:
                  "Your USDT stays locked for one month. Get your deposit back plus earned appreciation.",
                color: "from-yellow-500 to-orange-400",
              },
              {
                icon: BarChart3,
                title: "Safe & Transparent",
                description:
                  "Your funds are protected with top-level security. Track your stake status anytime.",
                color: "from-purple-500 to-pink-400",
              },
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.2 }}
                viewport={{ once: true }}
                className="glass-card p-8 card-hover group"
              >
                <div
                  className={`w-16 h-16 bg-gradient-to-r ${feature.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}
                >
                  <feature.icon className="w-8 h-8 text-black" />
                </div>
                <h3 className="text-xl font-semibold text-dark-900 mb-4">
                  {feature.title}
                </h3>
                <p className="text-warm-700 leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="px-4 sm:px-6 py-12 sm:py-16 md:py-20">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-12 sm:mb-16"
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 sm:mb-6">
              How It Works
            </h2>
            <p className="text-lg sm:text-xl text-warm-700 max-w-2xl mx-auto px-4 sm:px-0">
              Four simple steps to start earning with your USDT
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {[
              {
                step: "1",
                title: "Deposit USDT",
                description:
                  "Connect your wallet and choose how much you want to stake.",
                color: "from-emerald-500 to-green-400",
              },
              {
                step: "2",
                title: "Lock for 1 Month",
                description:
                  "Your deposit is locked for exactly one calendar month.",
                color: "from-cyan-500 to-blue-400",
              },
              {
                step: "3",
                title: "Earn Appreciation",
                description:
                  "Once the lock is over, you receive your deposit + the earned reward in USDT.",
                color: "from-yellow-500 to-orange-400",
              },
              {
                step: "4",
                title: "Withdraw or Restake",
                description:
                  "After payout, you can withdraw your funds or stake again.",
                color: "from-purple-500 to-pink-400",
              },
            ].map((step, index) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.2 }}
                viewport={{ once: true }}
                className="glass-card p-8 card-hover group text-center"
              >
                <div
                  className={`w-16 h-16 bg-gradient-to-r ${step.color} rounded-full flex items-center justify-center mb-6 mx-auto group-hover:scale-110 transition-transform duration-300`}
                >
                  <span className="text-2xl font-bold text-black">
                    {step.step}
                  </span>
                </div>
                <h3 className="text-xl font-semibold text-dark-900 mb-4">
                  {step.title}
                </h3>
                <p className="text-warm-700 leading-relaxed">
                  {step.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Dashboard Features Section */}
      <section className="px-4 sm:px-6 py-12 sm:py-16 md:py-20">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-12 sm:mb-16"
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 sm:mb-6">
              Dashboard Features
            </h2>
            <p className="text-lg sm:text-xl text-warm-700 max-w-2xl mx-auto px-4 sm:px-0">
              Everything you need to manage your USDT staking journey
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 max-w-4xl mx-auto">
            {[
              "Track your current stakes and maturity dates",
              "View your reward history and past earnings",
              "See projected monthly earnings if you restake",
              "Get reminders when your stake is about to mature",
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="glass-card p-6 card-hover flex items-center"
              >
                <div className="w-3 h-3 bg-emerald-400 rounded-full mr-4 flex-shrink-0"></div>
                <p className="text-dark-900 text-lg">{feature}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="px-4 sm:px-6 py-12 sm:py-16 md:py-20">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-12 sm:mb-16"
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 sm:mb-6">
              Frequently Asked Questions
            </h2>
            <p className="text-lg sm:text-xl text-warm-700 px-4 sm:px-0">
              Everything you need to know about USDT staking
            </p>
          </motion.div>

          <div className="space-y-4 sm:space-y-6">
            {[
              {
                question: "Can I withdraw before the month ends?",
                answer:
                  "No, the funds must stay locked for one month. Rewards are only paid once the lock period is over.",
              },
              {
                question: "How often do I get paid?",
                answer:
                  "You receive your appreciation once per stake — at the end of the 1-month lock.",
              },
              {
                question: "Can I stake again after payout?",
                answer:
                  "Yes, you can withdraw or restake right away after receiving your deposit and rewards.",
              },
              {
                question: "What coin can I stake?",
                answer:
                  "We only accept USDT for staking. No other coins or tokens are supported.",
              },
            ].map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="glass-card p-6 sm:p-8"
              >
                <h3 className="text-lg sm:text-xl font-semibold text-dark-900 mb-3">
                  {faq.question}
                </h3>
                <p className="text-warm-700 leading-relaxed text-sm sm:text-base">
                  {faq.answer}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="px-6 py-20">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="grid md:grid-cols-4 gap-8"
          >
            {[
              { value: "$5M+", label: "Total USDT Staked", icon: DollarSign },
              { value: "5-15%", label: "Monthly APM", icon: TrendingUp },
              { value: "10K+", label: "Active Stakers", icon: Users },
              { value: "30 Days", label: "Lock Period", icon: Lock },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="glass-card-strong p-8 text-center card-hover"
              >
                <stat.icon className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
                <div className="text-3xl md:text-4xl font-bold neon-text mb-2">
                  {stat.value}
                </div>
                <div className="text-warm-700 text-lg">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 sm:px-6 py-12 sm:py-16 md:py-20">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="glass-card-strong p-6 sm:p-8 md:p-12"
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 sm:mb-6">
              Ready to grow your USDT?
            </h2>
            <p className="text-lg sm:text-xl text-warm-700 mb-6 sm:mb-8 max-w-2xl mx-auto px-4 sm:px-0">
              Lock it for one month, earn appreciation, and repeat whenever you
              want. Start your monthly earning journey today.
            </p>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link
                href="/signup"
                className="btn-crypto text-lg sm:text-xl px-8 sm:px-10 md:px-12 py-3 sm:py-4 inline-flex items-center justify-center w-full sm:w-auto"
              >
                Get Started Today
                <ArrowRight className="ml-2 w-5 sm:w-6 h-5 sm:h-6" />
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-4 sm:px-6 py-8 sm:py-12 border-t border-warm-600/20">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
            <div className="sm:col-span-2 md:col-span-1">
              <div className="flex items-center space-x-3 mb-4 group">
                <div className="relative">
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-gradient-to-br from-emerald-500/20 to-green-400/20 backdrop-blur-sm border border-emerald-400/30 p-1 shadow-lg shadow-emerald-500/25 group-hover:shadow-emerald-500/40 transition-all duration-300">
                    <Image
                      src="/bitgain.PNG"
                      alt="BitGain Logo"
                      width={48}
                      height={48}
                      className="w-full h-full object-contain rounded-lg"
                    />
                  </div>
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-emerald-400/10 to-green-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
                <span className="text-lg sm:text-xl font-bold text-white relative">
                  <span className="bg-gradient-to-r from-emerald-400 via-green-400 to-emerald-300 bg-clip-text text-transparent drop-shadow-lg">
                    BitGains
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 via-green-400 to-emerald-300 bg-clip-text text-transparent blur-sm opacity-50 -z-10">
                    BitGains
                  </div>
                </span>
              </div>
              <p className="text-warm-700 text-sm sm:text-base">
                The most secure and profitable way to stake your USDT.
              </p>
            </div>

            <div>
              <h3 className="text-dark-900 font-semibold mb-3 sm:mb-4 text-sm sm:text-base">
                Platform
              </h3>
              <ul className="space-y-2 text-warm-700 text-sm sm:text-base">
                <li>
                  <Link
                    href="/login"
                    className="hover:text-warm-900 transition-colors"
                  >
                    Login
                  </Link>
                </li>
                <li>
                  <Link
                    href="/signup"
                    className="hover:text-warm-900 transition-colors"
                  >
                    Sign Up
                  </Link>
                </li>
                <li>
                  <Link
                    href="/dashboard"
                    className="hover:text-warm-900 transition-colors"
                  >
                    Dashboard
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-dark-900 font-semibold mb-3 sm:mb-4 text-sm sm:text-base">
                Support
              </h3>
              <ul className="space-y-2 text-warm-700 text-sm sm:text-base">
                <li>
                  <Link
                    href="/support"
                    className="hover:text-warm-900 transition-colors"
                  >
                    Help & Support
                  </Link>
                </li>
                <li>
                  <Link
                    href="/support"
                    className="hover:text-warm-900 transition-colors"
                  >
                    Contact Us
                  </Link>
                </li>
                <li>
                  <Link
                    href="#features"
                    className="hover:text-warm-900 transition-colors"
                  >
                    Documentation
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-dark-900 font-semibold mb-3 sm:mb-4 text-sm sm:text-base">
                Legal
              </h3>
              <ul className="space-y-2 text-warm-700 text-sm sm:text-base">
                <li>
                  <Link href="#" className="hover:text-warm-900 transition-colors">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-warm-900 transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-warm-900 transition-colors">
                    Security
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-warm-600/20 mt-6 sm:mt-8 pt-6 sm:pt-8 text-center text-warm-700 text-sm sm:text-base">
            <p>&copy; 2024 USDT Staking Platform. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}


