"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import {
  MessageCircle,
  Send,
  Shield,
  AlertTriangle,
  CheckCircle,
  ExternalLink,
  Clock,
  HelpCircle,
  Lock,
  Globe,
  ArrowLeft,
  Copy,
  Check,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function SupportPage() {
  const [copiedHandle, setCopiedHandle] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const copyToClipboard = (text: string, type: "handle" | "link") => {
    navigator.clipboard.writeText(text);
    if (type === "handle") {
      setCopiedHandle(true);
      setTimeout(() => setCopiedHandle(false), 2000);
    } else {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const securityTips = [
    {
      icon: Shield,
      title: "Verify Official Handle",
      description: "Always verify that you are messaging @BitgainsSupport only.",
    },
    {
      icon: Lock,
      title: "Never Share Credentials",
      description: "BitGains will never ask for your passwords, private keys, or wallet seed phrases.",
    },
    {
      icon: AlertTriangle,
      title: "Beware of Impersonators",
      description: "Be cautious of impersonators and scam accounts pretending to be BitGains representatives.",
    },
    {
      icon: MessageCircle,
      title: "We Don't Initiate Contact",
      description: "BitGains will never reach out to you via unofficial Telegram groups or DMs first.",
    },
  ];

  const supportTips = [
    "Make sure you are using the latest version of the BitGains platform.",
    "Check your network connection or wallet sync if facing transaction delays.",
    "Review our FAQs and community updates in the official Telegram page.",
    "Prepare your account details (without sharing passwords) before contacting support.",
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border px-3 sm:px-6 lg:px-8 py-3 sm:py-5 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-4 min-w-0">
              <Link
                href="/dashboard"
                className="p-1.5 sm:p-2 text-muted-foreground hover:text-foreground transition-colors rounded-xl hover:bg-secondary border border-transparent hover:border-border flex-shrink-0"
              >
                <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              </Link>
              <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl overflow-hidden bg-primary/10 border border-primary/20 p-0.5 flex-shrink-0">
                  <Image
                    src="/bitgain.PNG"
                    alt="BitGains Logo"
                    width={40}
                    height={40}
                    className="w-full h-full object-contain rounded-lg"
                  />
                </div>
                <div className="min-w-0">
                  <h1 className="text-base sm:text-xl font-bold text-foreground truncate">
                    BitGains Support
                  </h1>
                  <p className="text-muted-foreground text-xs sm:text-sm hidden sm:block">
                    We&apos;re here to help you
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-12">

        {/* Welcome */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8 sm:mb-12"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-primary/10 border border-primary/25 rounded-full mb-4 sm:mb-6">
            <MessageCircle className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-3 sm:mb-4 px-4">
            💬 Welcome to BitGains Support
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base lg:text-lg max-w-3xl mx-auto px-4">
            We&apos;re here to help you with any questions, issues, or
            account-related concerns regarding the BitGains platform.
          </p>
        </motion.div>

        {/* How to Get Help */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-card border border-border rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 mb-6 sm:mb-8"
        >
          <div className="flex items-start space-x-3 sm:space-x-4 mb-4 sm:mb-6">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-primary to-accent rounded-xl sm:rounded-2xl flex items-center justify-center flex-shrink-0">
              <HelpCircle className="w-5 h-5 sm:w-6 sm:h-6 text-primary-foreground" />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-foreground">
              🛠️ How to Get Help
            </h3>
          </div>

          <p className="text-foreground text-sm sm:text-base lg:text-lg mb-4 sm:mb-6">
            At this time,{" "}
            <span className="text-primary font-semibold">Telegram</span> is the
            only official channel for BitGains support.
          </p>

          <p className="text-muted-foreground text-sm sm:text-base mb-6 sm:mb-8">
            Our dedicated team is available to assist you directly through our
            verified Telegram handle:
          </p>

          {/* Official Handles */}
          <div className="space-y-3 sm:space-y-4">

            {/* Support Handle */}
            <div className="bg-primary/8 border border-primary/25 rounded-xl sm:rounded-2xl p-4 sm:p-6 hover:bg-primary/12 transition-all duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                <div className="flex items-center space-x-3 sm:space-x-4 min-w-0">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-primary to-accent rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                    <Send className="w-5 h-5 sm:w-6 sm:h-6 text-primary-foreground" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-muted-foreground text-xs sm:text-sm mb-1">
                      📱 Official Support Handle:
                    </p>
                    <p className="text-primary text-base sm:text-xl font-bold font-mono break-all">
                      @BitgainsSupport
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2 self-end sm:self-auto flex-shrink-0">
                  <button
                    onClick={() => copyToClipboard("@BitgainsSupport", "handle")}
                    className="px-3 py-2 sm:px-4 bg-secondary border border-border hover:bg-primary/10 hover:border-primary/30 text-muted-foreground hover:text-foreground rounded-lg sm:rounded-xl transition-colors flex items-center space-x-1.5 sm:space-x-2 text-xs sm:text-sm"
                  >
                    {copiedHandle ? (
                      <><Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" /><span>Copied!</span></>
                    ) : (
                      <><Copy className="w-3.5 h-3.5 sm:w-4 sm:h-4" /><span>Copy</span></>
                    )}
                  </button>
                  <a
                    href="https://t.me/BitgainsSupport"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-2 sm:px-4 bg-gradient-to-r from-primary to-accent text-primary-foreground font-semibold rounded-lg sm:rounded-xl hover:opacity-90 hover:shadow-md hover:shadow-primary/20 transition-all duration-300 flex items-center space-x-1.5 sm:space-x-2 text-xs sm:text-sm"
                  >
                    <MessageCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">Contact Support</span>
                    <span className="sm:hidden">Contact</span>
                    <ExternalLink className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </a>
                </div>
              </div>
            </div>

            {/* Official Page */}
            <div className="bg-secondary border border-border rounded-xl sm:rounded-2xl p-4 sm:p-6 hover:bg-primary/5 hover:border-primary/25 transition-all duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                <div className="flex items-center space-x-3 sm:space-x-4 min-w-0">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-secondary border border-border rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                    <Globe className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-muted-foreground text-xs sm:text-sm mb-1">
                      🌐 Official Telegram Page:
                    </p>
                    <p className="text-foreground text-sm sm:text-xl font-bold font-mono break-all">
                      https://t.me/BitgainsCo
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2 self-end sm:self-auto flex-shrink-0">
                  <button
                    onClick={() => copyToClipboard("https://t.me/BitgainsCo", "link")}
                    className="px-3 py-2 sm:px-4 bg-secondary border border-border hover:bg-primary/10 hover:border-primary/30 text-muted-foreground hover:text-foreground rounded-lg sm:rounded-xl transition-colors flex items-center space-x-1.5 sm:space-x-2 text-xs sm:text-sm"
                  >
                    {copiedLink ? (
                      <><Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" /><span>Copied!</span></>
                    ) : (
                      <><Copy className="w-3.5 h-3.5 sm:w-4 sm:h-4" /><span>Copy</span></>
                    )}
                  </button>
                  <a
                    href="https://t.me/BitgainsCo"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-2 sm:px-4 bg-secondary border border-border hover:bg-primary/10 hover:border-primary/30 text-foreground font-semibold rounded-lg sm:rounded-xl transition-all duration-300 flex items-center space-x-1.5 sm:space-x-2 text-xs sm:text-sm"
                  >
                    <Globe className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">Visit Page</span>
                    <span className="sm:hidden">Visit</span>
                    <ExternalLink className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-primary/8 border border-primary/20 rounded-xl">
            <p className="text-foreground text-xs sm:text-sm flex items-start space-x-2">
              <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 mt-0.5 flex-shrink-0 text-primary" />
              <span>
                Please make sure you are contacting the correct handle listed
                above. We never initiate contact first or ask for your
                passwords, private keys, or wallet seed phrases.
              </span>
            </p>
          </div>
        </motion.div>

        {/* Security Notice */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-card border border-border rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 mb-6 sm:mb-8"
        >
          <div className="flex items-center space-x-2 sm:space-x-3 mb-4 sm:mb-6">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-destructive/10 border border-destructive/20 rounded-xl sm:rounded-2xl flex items-center justify-center flex-shrink-0">
              <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-destructive" />
            </div>
            <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground">
              ⚠️ Security Notice
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            {securityTips.map((tip, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.3 + index * 0.1 }}
                className="bg-secondary border border-border rounded-xl sm:rounded-2xl p-3 sm:p-5 hover:border-primary/30 hover:bg-primary/5 transition-all duration-300"
              >
                <div className="flex items-start space-x-3 sm:space-x-4">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary/10 border border-primary/20 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                    <tip.icon className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-foreground font-semibold mb-1 sm:mb-2 text-sm sm:text-base">
                      {tip.title}
                    </h4>
                    <p className="text-muted-foreground text-xs sm:text-sm">
                      {tip.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-destructive/8 border border-destructive/20 rounded-lg sm:rounded-xl">
            <p className="text-destructive font-medium flex items-start space-x-2 text-xs sm:text-sm">
              <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 mt-0.5 flex-shrink-0" />
              <span>
                If you suspect fraudulent activity, report it immediately
                through our official Telegram handle @BitgainsSupport.
              </span>
            </p>
          </div>
        </motion.div>

        {/* Tips Before Contacting */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-card border border-border rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 mb-6 sm:mb-8"
        >
          <div className="flex items-center space-x-2 sm:space-x-3 mb-4 sm:mb-6">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-primary to-accent rounded-xl sm:rounded-2xl flex items-center justify-center flex-shrink-0">
              <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-primary-foreground" />
            </div>
            <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground">
              💡 Tips Before Contacting Support
            </h3>
          </div>

          <p className="text-muted-foreground mb-4 sm:mb-6 text-xs sm:text-sm lg:text-base">
            Before reaching out, please:
          </p>

          <div className="space-y-2 sm:space-y-3">
            {supportTips.map((tip, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.4 + index * 0.1 }}
                className="flex items-start space-x-2 sm:space-x-3 p-3 sm:p-4 bg-secondary border border-border rounded-lg sm:rounded-xl hover:bg-primary/5 hover:border-primary/25 transition-all duration-300"
              >
                <div className="w-5 h-5 sm:w-6 sm:h-6 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-primary-foreground" />
                </div>
                <p className="text-foreground text-xs sm:text-sm lg:text-base">{tip}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="bg-primary/10 border border-primary/25 rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-12 text-center"
        >
          <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-primary to-accent rounded-full mb-4 sm:mb-6">
            <Send className="w-6 h-6 sm:w-8 sm:h-8 text-primary-foreground" />
          </div>

          <h3 className="text-2xl sm:text-3xl font-bold text-foreground mb-3 sm:mb-4">
            📩 Contact Us Now
          </h3>
          <p className="text-muted-foreground text-sm sm:text-base lg:text-lg mb-6 sm:mb-8 max-w-2xl mx-auto px-4">
            Need help right away? Tap the link below to start chatting with our
            verified support team:
          </p>

          <a
            href="https://t.me/BitgainsSupport"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-2 sm:space-x-3 px-6 py-3 sm:px-8 sm:py-4 bg-gradient-to-r from-primary to-accent text-primary-foreground font-bold text-sm sm:text-base lg:text-lg rounded-xl sm:rounded-2xl hover:opacity-90 hover:shadow-xl hover:shadow-primary/25 transition-all duration-300 transform hover:scale-105"
          >
            <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6" />
            <span>👉 Contact Telegram @BitgainsSupport</span>
            <ExternalLink className="w-4 h-4 sm:w-5 sm:h-5" />
          </a>

          <div className="mt-4 sm:mt-6 flex items-center justify-center space-x-2 text-muted-foreground text-xs sm:text-sm">
            <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>Our team typically responds within 24 hours</span>
          </div>
        </motion.div>

        {/* Footer note */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mt-6 sm:mt-8 text-center px-4"
        >
          <p className="text-muted-foreground/70 text-xs sm:text-sm">
            For the best support experience, please have your account
            information ready (without sharing passwords).
          </p>
        </motion.div>
      </div>
    </div>
  );
}
