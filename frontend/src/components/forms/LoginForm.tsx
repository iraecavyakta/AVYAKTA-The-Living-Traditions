"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { loginSchema, LoginFormData } from "../../lib/validators/auth";

export default function LoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setError("");
    setSuccessMessage("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      // Handle success response (200 OK)
      if (response.ok) {
        setSuccessMessage("Login successful! Redirecting...");
        const result = (await response.json()) as { redirectTo?: string };
        // The "login-success" type drives the scroll transition in globals.css.
        router.push(result.redirectTo || "/dashboard/members", {
          transitionTypes: ["login-success"],
        });
        return;
      }

      // Handle error responses (4xx, 5xx)
      if (response.status >= 400) {
        try {
          const result = (await response.json()) as { error?: string };
          setError(result.error || "Failed to login. Please try again.");
        } catch {
          setError("Failed to login. Please try again.");
        }
        return;
      }

      // Fallback for unexpected response
      setError("An unexpected error occurred.");
    } catch (err) {
      console.error("Login error:", err);
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="w-full space-y-0 flex flex-col"
    >
      {error && (
        <div className="mb-5 rounded-lg border border-[#8B1A1A]/40 bg-[#8B1A1A]/10 p-3 text-sm font-medium text-[#8B1A1A]">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="mb-5 rounded-lg border border-[#1B5E3B]/40 bg-[#1B5E3B]/10 p-3 text-sm font-medium text-[#1B5E3B]">
          {successMessage}
        </div>
      )}

      <motion.div
        className="mb-5"
        whileHover={{ scale: 1.015, y: -2 }}
        style={{ transformStyle: "preserve-3d" }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        <label
          htmlFor="email"
          className="mb-2 block text-sm font-medium text-[#1C1C1C]/70"
        >
          Email Address
        </label>
        <input
          id="email"
          type="email"
          placeholder="Enter your email"
          {...register("email")}
          className={`w-full rounded-lg border px-3.5 py-3 text-sm text-[#1C1C1C] transition-all placeholder:text-[#737955]/60 focus:outline-none focus:ring-2 ${
            errors.email
              ? "border-[#8B1A1A] bg-[#FBF1F1] focus:border-[#8B1A1A] focus:ring-[#8B1A1A]/25"
              : "border-[#C9A84C]/35 bg-white focus:border-[#C9A84C] focus:ring-[#C9A84C]/25 focus:shadow-[0_0_20px_rgba(201,168,76,0.2)]"
          } disabled:cursor-not-allowed disabled:opacity-50`}
          disabled={isLoading}
        />
        {errors.email && (
          <p className="mt-1.5 text-xs font-medium text-[#8B1A1A]">
            {errors.email.message}
          </p>
        )}
      </motion.div>

      <motion.div
        className="mb-2"
        whileHover={{ scale: 1.015, y: -2 }}
        style={{ transformStyle: "preserve-3d" }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        <label
          htmlFor="password"
          className="mb-2 block text-sm font-medium text-[#1C1C1C]/70"
        >
          Password
        </label>
        <input
          id="password"
          type="password"
          placeholder="Enter your password"
          {...register("password")}
          className={`w-full rounded-lg border px-3.5 py-3 text-sm text-[#1C1C1C] transition-all placeholder:text-[#737955]/60 focus:outline-none focus:ring-2 ${
            errors.password
              ? "border-[#8B1A1A] bg-[#FBF1F1] focus:border-[#8B1A1A] focus:ring-[#8B1A1A]/25"
              : "border-[#C9A84C]/35 bg-white focus:border-[#C9A84C] focus:ring-[#C9A84C]/25 focus:shadow-[0_0_20px_rgba(201,168,76,0.2)]"
          } disabled:cursor-not-allowed disabled:opacity-50`}
          disabled={isLoading}
        />
        {errors.password && (
          <p className="mt-1.5 text-xs font-medium text-[#8B1A1A]">
            {errors.password.message}
          </p>
        )}
      </motion.div>

      <motion.button
        type="submit"
        disabled={isLoading}
        whileHover={!isLoading ? { scale: 1.02, y: -2 } : undefined}
        whileTap={!isLoading ? { scale: 0.98 } : undefined}
        className="mt-6 w-full rounded-full bg-[#92791B] px-4 py-3 text-base font-semibold text-white shadow-[0_10px_30px_rgba(146,121,27,0.35)] transition-colors hover:bg-[#C9A84C] hover:shadow-[0_10px_40px_rgba(201,168,76,0.45)] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isLoading ? "Signing in..." : "Enter"}
      </motion.button>
    </form>
  );
}
