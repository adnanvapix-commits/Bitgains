"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Rocket,
  Sparkles,
  PartyPopper,
  TrendingUp,
  Shield,
  Clock,
  Users,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

// Confetti particle component
const ConfettiParticle = ({
  delay,
  color,
}: {
  delay: number;
  color: string;
}) => (
  <motion.div
    className={`absolute w-3 h-3 ${color}`}
    style={{
      left: `${Math.random() * 100}%`,
      top: -20,
    }}
    initial={{ y: 0, opacity: 1, rotate: 0 }}
    animate={{
      y: [0, 600],
      opacity: [1, 1, 0],
      rotate: [0, 360, 720],
      x: [0, Math.random() * 100 - 50],
    }}
    transition={{
      duration: 3 + Math.random() * 2,
      delay: delay,
      repeat: Infinity,
      repeatDelay: Math.random() * 2,
      ease: "easeIn",
    }}
  />
);

// Floating emoji component
const FloatingEmoji = ({ emoji, delay }: { emoji: string; delay: number }) => (
  <motion.div
    className="absolute text-4xl"
    style={{
      left: `${10 + Math.random() * 80}%`,
      top: `${10 + Math.random() * 80}%`,
    }}
    animate={{
      y: [0, -20, 0],
      rotate: [0, 10, -10, 0],
      scale: [1, 1.2, 1],
    }}
    transition={{
      duration: 2 + Math.random(),
      delay: delay,
      repeat: Infinity,
      repeatDelay: Math.random() * 0.5,
    }}
  >
    {emoji}
  </motion.div>
);

export default function LaunchPopup() {
  const [isOpen, setIsOpen] = useState(false);
  const [hasSeenPopup, setHasSeenPopup] = useState(false);

  useEffect(() => {
    // Check if user has already seen the popup in this session
    const seen = sessionStorage.getItem("bitgains_launch_popup_seen");
    if (!seen) {
      // Delay popup appearance for better UX
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 1500);
      return () => clearTimeout(timer);
    } else {
      setHasSeenPopup(true);
    }
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    sessionStorage.setItem("bitgains_launch_popup_seen", "true");
    setHasSeenPopup(true);
  };

  if (hasSeenPopup && !isOpen) return null;

  const confettiColors = [
    "bg-emerald-400",
    "bg-green-400",
    "bg-yellow-400",
    "bg-cyan-400",
    "bg-pink-400",
    "bg-purple-400",
    "bg-orange-400",
    "bg-blue-400",
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
          />

          {/* Confetti container */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {confettiColors.map((color, i) =>
              Array.from({ length: 8 }).map((_, j) => (
                <ConfettiParticle
                  key={`${i}-${j}`}
                  delay={j * 0.3 + i * 0.1}
                  color={color}
                />
              ))
            )}
          </div>

          {/* Popup Content */}
          <motion.div
            className="relative w-full max-w-lg mx-auto"
            initial={{ scale: 0.5, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.5, opacity: 0, y: 50 }}
            transition={{ type: "spring", damping: 15, stiffness: 100 }}
          >
            {/* Floating emojis */}
            <div className="absolute inset-0 pointer-events-none">
              <FloatingEmoji emoji="🎉" delay={0} />
              <FloatingEmoji emoji="🚀" delay={0.5} />
              <FloatingEmoji emoji="💰" delay={1} />
              <FloatingEmoji emoji="✨" delay={1.5} />
              <FloatingEmoji emoji="🎊" delay={2} />
            </div>

            {/* Main card */}
            <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-3xl overflow-hidden border border-emerald-500/30 shadow-2xl shadow-emerald-500/20">
              {/* Animated background glow */}
              <div className="absolute inset-0">
                <motion.div
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-emerald-500/30 rounded-full blur-3xl"
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.3, 0.5, 0.3],
                  }}
                  transition={{ duration: 3, repeat: Infinity }}
                />
                <motion.div
                  className="absolute bottom-0 right-0 w-64 h-64 bg-cyan-500/20 rounded-full blur-3xl"
                  animate={{
                    scale: [1, 1.3, 1],
                    opacity: [0.2, 0.4, 0.2],
                  }}
                  transition={{ duration: 4, repeat: Infinity, delay: 0.5 }}
                />
              </div>

              {/* Close button */}
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors group"
              >
                <X className="w-5 h-5 text-white/70 group-hover:text-white" />
              </button>

              {/* Content */}
              <div className="relative p-6 sm:p-8">
                {/* Header with logo and celebration */}
                <div className="text-center mb-6">
                  <motion.div
                    className="inline-flex items-center justify-center mb-4"
                    animate={{ rotate: [0, -5, 5, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <div className="relative">
                      <motion.div
                        className="absolute inset-0 bg-emerald-500 rounded-2xl blur-xl opacity-50"
                        animate={{ scale: [1, 1.3, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                      <div className="relative w-20 h-20 rounded-2xl overflow-hidden bg-gradient-to-br from-emerald-500/30 to-green-400/30 backdrop-blur-sm border-2 border-emerald-400/50 p-2 shadow-lg shadow-emerald-500/50">
                        <Image
                          src="/bitgain.PNG"
                          alt="BitGains Logo"
                          width={80}
                          height={80}
                          className="w-full h-full object-contain rounded-lg"
                        />
                      </div>
                    </div>
                  </motion.div>

                  {/* Launch badge */}
                  <motion.div
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500/20 to-green-500/20 rounded-full border border-emerald-400/30 mb-4"
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    <Rocket className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-400 font-semibold text-sm">
                      NOW LIVE IN INDIA!
                    </span>
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                  </motion.div>

                  {/* Main heading */}
                  <motion.h2
                    className="text-3xl sm:text-4xl font-bold text-white mb-3"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                  >
                    <span className="bg-gradient-to-r from-emerald-400 via-green-400 to-cyan-400 bg-clip-text text-transparent">
                      BitGains.co
                    </span>
                    <br />
                    <span className="text-white text-2xl sm:text-3xl">
                      is Here! 🎉
                    </span>
                  </motion.h2>

                  {/* Subtitle */}
                  <motion.p
                    className="text-white/80 text-sm sm:text-base max-w-sm mx-auto leading-relaxed"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    A smarter, faster, and secure platform for investment
                    growth. Empowering Indian investors with transparent
                    returns!
                  </motion.p>
                </div>

                {/* Features grid */}
                <motion.div
                  className="grid grid-cols-2 gap-3 mb-6"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.6 }}
                >
                  {[
                    {
                      icon: TrendingUp,
                      text: "5-15% Monthly",
                      color: "text-emerald-400",
                    },
                    {
                      icon: Shield,
                      text: "100% Secure",
                      color: "text-cyan-400",
                    },
                    {
                      icon: Clock,
                      text: "24/7 Support",
                      color: "text-yellow-400",
                    },
                    {
                      icon: Users,
                      text: "Join 10K+ Users",
                      color: "text-pink-400",
                    },
                  ].map((feature, index) => (
                    <motion.div
                      key={feature.text}
                      className="flex items-center gap-2 p-3 bg-white/5 rounded-xl border border-white/10"
                      whileHover={{
                        scale: 1.05,
                        backgroundColor: "rgba(255,255,255,0.1)",
                      }}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.7 + index * 0.1 }}
                    >
                      <feature.icon className={`w-5 h-5 ${feature.color}`} />
                      <span className="text-white text-xs sm:text-sm font-medium">
                        {feature.text}
                      </span>
                    </motion.div>
                  ))}
                </motion.div>

                {/* Welcome message */}
                <motion.div
                  className="bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 rounded-xl p-4 mb-6 border border-emerald-500/20"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.8 }}
                >
                  <div className="flex items-start gap-3">
                    <PartyPopper className="w-6 h-6 text-yellow-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-white font-semibold mb-1">
                        Thank You for Your Trust! 💹
                      </p>
                      <p className="text-white/70 text-sm">
                        Join the next generation of wealth builders. Let&apos;s
                        grow together!
                      </p>
                    </div>
                  </div>
                </motion.div>

                {/* CTA buttons */}
                <motion.div
                  className="flex flex-col sm:flex-row gap-3"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.9 }}
                >
                  <Link
                    href="/signup"
                    onClick={handleClose}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50"
                  >
                    <Rocket className="w-5 h-5" />
                    Start Investing Now
                  </Link>
                  <button
                    onClick={handleClose}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl transition-all duration-300 border border-white/20"
                  >
                    Explore First
                  </button>
                </motion.div>

                {/* Footer text */}
                <motion.p
                  className="text-center text-white/50 text-xs mt-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1 }}
                >
                  🇮🇳 Made for India • Secure & Transparent
                </motion.p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
