"use client";

import { useRef, ViewTransition, type MouseEvent } from "react";
import Image from "next/image";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import LoginForm from "../../../components/forms/LoginForm";

const diyaPositions = [
  { top: "12%", left: "8%", size: 10, delay: 0 },
  { top: "22%", left: "88%", size: 7, delay: 0.6 },
  { top: "68%", left: "6%", size: 8, delay: 1.2 },
  { top: "80%", left: "90%", size: 11, delay: 0.3 },
];

export default function LoginPage() {
  const cardRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [12, -12]), {
    stiffness: 160,
    damping: 18,
  });
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-12, 12]), {
    stiffness: 160,
    damping: 18,
  });
  // Spotlight moves via transform only (compositor-cheap) instead of
  // recomputing a gradient string every mousemove frame.
  const glowX = useSpring(useTransform(mouseX, [-0.5, 0.5], ["-30%", "130%"]), {
    stiffness: 120,
    damping: 22,
  });
  const glowY = useSpring(useTransform(mouseY, [-0.5, 0.5], ["-30%", "130%"]), {
    stiffness: 120,
    damping: 22,
  });

  const handleMouseMove = (event: MouseEvent<HTMLDivElement>) => {
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    mouseX.set((event.clientX - rect.left) / rect.width - 0.5);
    mouseY.set((event.clientY - rect.top) / rect.height - 0.5);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    // Scrolls up out of view on a successful login (see globals.css).
    <ViewTransition
      exit={{ "login-success": "auto-scroll-out", default: "none" }}
      default="none"
    >
      <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-[#1C1C1C] px-6 py-20">
        {/* Base layered gradient, matching the home hero recipe */}
        <div className="absolute inset-0" aria-hidden>
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "radial-gradient(circle at 14% 18%, rgba(201,168,76,0.28) 0, transparent 42%), radial-gradient(circle at 86% 12%, rgba(139,26,26,0.2) 0, transparent 45%), radial-gradient(circle at 80% 86%, rgba(27,94,59,0.22) 0, transparent 50%), linear-gradient(135deg, #1C1C1C 0%, #262218 40%, #1C1C1C 100%)",
            }}
          />
          {/* Faint dot texture (paisley-density substitute) */}
          <div
            className="absolute inset-0 opacity-[0.05]"
            style={{
              backgroundImage:
                "repeating-radial-gradient(circle at center, rgba(201,168,76,0.9), rgba(201,168,76,0.9) 1px, transparent 1px, transparent 26px)",
            }}
          />
        </div>

        {/* Floating diya glows */}
        {diyaPositions.map((diya, index) => (
          <motion.div
            key={index}
            className="pointer-events-none absolute rounded-full"
            style={{
              top: diya.top,
              left: diya.left,
              width: diya.size,
              height: diya.size,
              background:
                "radial-gradient(circle, rgba(201,168,76,0.9) 0%, rgba(201,168,76,0.35) 55%, transparent 75%)",
              boxShadow: "0 0 18px 4px rgba(201,168,76,0.35)",
            }}
            animate={{ y: [0, -14, 0], opacity: [0.5, 1, 0.5] }}
            transition={{
              duration: 4 + index,
              delay: diya.delay,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}

        {/* Large slow-spinning kolam ring, subtle */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.16]">
          <svg
            width="760"
            height="760"
            viewBox="0 0 220 220"
            className="animate-spin-slow"
            aria-hidden
          >
            <circle
              cx="110"
              cy="110"
              r="98"
              stroke="#C9A84C"
              fill="none"
              strokeWidth="0.6"
            />
            <circle
              cx="110"
              cy="110"
              r="78"
              stroke="#92791B"
              fill="none"
              strokeWidth="0.6"
            />
            <circle
              cx="110"
              cy="110"
              r="58"
              stroke="#8B1A1A"
              fill="none"
              strokeWidth="0.6"
            />
            <circle
              cx="110"
              cy="110"
              r="38"
              stroke="#1B5E3B"
              fill="none"
              strokeWidth="0.6"
            />
          </svg>
        </div>

        {/* Softly counter-rotating inner ring, closer to card */}
        <div
          className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.22]"
          style={{ animation: "spin-slow 34s linear infinite reverse" }}
        >
          <svg width="420" height="420" viewBox="0 0 220 220" aria-hidden>
            <circle
              cx="110"
              cy="110"
              r="90"
              stroke="#C9A84C"
              fill="none"
              strokeWidth="0.5"
              strokeDasharray="2 6"
            />
            <circle
              cx="110"
              cy="110"
              r="70"
              stroke="#C9A84C"
              fill="none"
              strokeWidth="0.5"
              strokeDasharray="1 5"
            />
          </svg>
        </div>

        {/* Ambient blurred glow blobs */}
        <motion.div
          className="pointer-events-none absolute -left-16 top-24 h-56 w-56 rounded-full bg-[#C9A84C]/20 blur-2xl will-change-transform"
          animate={{ y: [0, -22, 0], x: [0, 16, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="pointer-events-none absolute -right-14 bottom-24 h-64 w-64 rounded-full bg-[#1B5E3B]/22 blur-2xl will-change-transform"
          animate={{ y: [0, 24, 0], x: [0, -18, 0] }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Top/bottom gold accent lines */}
        <div className="pointer-events-none absolute left-0 right-0 top-0 h-8 border-b border-[#C9A84C]/40 bg-[linear-gradient(90deg,rgba(201,168,76,0.12)_0,rgba(28,28,28,0)_50%,rgba(201,168,76,0.12)_100%)]" />
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-8 border-t border-[#C9A84C]/40 bg-[linear-gradient(90deg,rgba(201,168,76,0.12)_0,rgba(28,28,28,0)_50%,rgba(201,168,76,0.12)_100%)]" />

        {/* 3D interactive login window */}
        <div
          style={{ perspective: 1600 }}
          className="relative z-10 w-full max-w-md"
        >
          <motion.div
            ref={cardRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            style={{
              rotateX,
              rotateY,
              transformStyle: "preserve-3d",
              willChange: "transform",
            }}
            className="relative overflow-hidden rounded-[2rem] border-2 border-[#C9A84C]/45 bg-[#F5F0E8] shadow-[0_0_0_8px_rgba(201,168,76,0.08),0_45px_110px_rgba(0,0,0,0.55)]"
          >
            {/* Mouse-reactive gold sheen — moved via transform only, no per-frame paint */}
            <motion.div
              className="pointer-events-none absolute h-64 w-64 rounded-full opacity-60"
              style={{
                left: glowX,
                top: glowY,
                x: "-50%",
                y: "-50%",
                background:
                  "radial-gradient(circle, rgba(201,168,76,0.22), transparent 70%)",
              }}
            />

            {/* Decorative corners */}
            <div className="pointer-events-none absolute left-4 top-4 h-10 w-10 rounded-tl-xl border-l-2 border-t-2 border-[#C9A84C]/50" />
            <div className="pointer-events-none absolute bottom-4 right-4 h-10 w-10 rounded-br-xl border-b-2 border-r-2 border-[#C9A84C]/50" />

            {/* Header */}
            <div className="relative px-8 pb-8 pt-12 text-center">
              <p className="mb-2 text-xs uppercase tracking-[0.35em] text-[#C9A84C]">
                The Living Traditions
              </p>
              <h1
                className="font-[family-name:var(--font-heading)] text-5xl text-[#C9A84C]"
                style={{ transform: "translateZ(30px)" }}
              >
                Avyakta
              </h1>
              <p className="font-[family-name:var(--font-accent)] mt-3 text-base italic text-[#1C1C1C]/75">
                Where culture breathes through creativity
              </p>

              <div className="mt-5 flex justify-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-[#C9A84C]/60" />
                <div className="h-2.5 w-2.5 rounded-full bg-[#C9A84C]/90" />
                <div className="h-1.5 w-1.5 rounded-full bg-[#C9A84C]/60" />
              </div>
            </div>

            <div className="mx-8 h-px bg-gradient-to-r from-transparent via-[#C9A84C]/40 to-transparent" />

            {/* Form content */}
            <div
              className="relative px-8 py-9"
              style={{ transform: "translateZ(20px)" }}
            >
              {/* Logo watermark, low opacity */}
              <Image
                src="/logo.png"
                alt=""
                width={260}
                height={260}
                aria-hidden
                className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.32]"
              />

              <div className="relative">
                <h2 className="font-[family-name:var(--font-heading)] text-2xl text-[#1C1C1C]">
                  Welcome Back
                </h2>
                <p className="mb-6 mt-1 text-sm text-[#737955]">
                  Sign in to manage your domain and recruitment
                </p>

                <LoginForm />
              </div>
            </div>

            {/* Footer */}
            <div className="relative border-t border-[#C9A84C]/25 bg-[#EFE7D8] px-8 py-5 text-center">
              <p className="text-xs leading-relaxed text-[#737955]">
                By signing in, you agree to our{" "}
                <a
                  href="#"
                  className="font-semibold text-[#92791B] hover:text-[#1C1C1C] transition-colors"
                >
                  Terms of Service
                </a>{" "}
                and{" "}
                <a
                  href="#"
                  className="font-semibold text-[#92791B] hover:text-[#1C1C1C] transition-colors"
                >
                  Privacy Policy
                </a>
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </ViewTransition>
  );
}
