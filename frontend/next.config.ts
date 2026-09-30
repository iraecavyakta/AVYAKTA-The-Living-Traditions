import type { NextConfig } from "next";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  turbopack: {
    root: appRoot,
  },
  experimental: {
    // Lets route navigations run through the browser View Transitions API
    // (used for the login → dashboard scroll).
    viewTransition: true,
  },
};

export default nextConfig;
