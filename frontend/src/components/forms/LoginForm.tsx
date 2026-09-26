"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
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
        router.push(result.redirectTo || "/dashboard");
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
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-900 text-sm font-medium rounded-md animation-in fade-in slide-in-from-top-2">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-800 text-sm font-medium rounded-md animation-in fade-in slide-in-from-top-2">
          {successMessage}
        </div>
      )}

      <div className="mb-5">
        <label
          htmlFor="email"
          className="block mb-2 text-sm font-medium text-gray-700"
        >
          Email Address
        </label>
        <input
          id="email"
          type="email"
          placeholder="Enter your email"
          {...register("email")}
          className={`w-full px-3.5 py-3 text-sm bg-gray-50 border rounded-lg font-sans focus:outline-none focus:border-bronze focus:ring-2 focus:ring-bronze/20 focus:bg-white transition-all ${
            errors.email ? "border-red-600 bg-red-50" : "border-gray-300"
          } disabled:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-60`}
          disabled={isLoading}
        />
        {errors.email && (
          <p className="text-xs font-medium text-red-600 mt-1.5">
            {errors.email.message}
          </p>
        )}
      </div>

      <div className="mb-2">
        <label
          htmlFor="password"
          className="block mb-2 text-sm font-medium text-gray-700"
        >
          Password
        </label>
        <input
          id="password"
          type="password"
          placeholder="Enter your password"
          {...register("password")}
          className={`w-full px-3.5 py-3 text-sm bg-gray-50 border rounded-lg font-sans focus:outline-none focus:border-bronze focus:ring-2 focus:ring-bronze/20 focus:bg-white transition-all ${
            errors.password ? "border-red-600 bg-red-50" : "border-gray-300"
          } disabled:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-60`}
          disabled={isLoading}
        />
        {errors.password && (
          <p className="text-xs font-medium text-red-600 mt-1.5">
            {errors.password.message}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full mt-2 px-4 py-3 bg-bronze text-white text-base font-semibold rounded-lg shadow-lg hover:shadow-xl hover:-translate-y-0.5 hover:bg-bronze/90 active:translate-y-0 disabled:opacity-70 disabled:cursor-not-allowed disabled:shadow-md transition-all duration-200"
      >
        {isLoading ? "Signing in..." : "Enter"}
      </button>
    </form>
  );
}
