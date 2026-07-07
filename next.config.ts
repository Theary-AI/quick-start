import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Emit a self-contained server bundle (.next/standalone) so the Docker image
  // only needs Node + the traced runtime files, not the whole node_modules tree.
  output: 'standalone',
  // This app lives in a subfolder alongside other projects; pin the tracing root
  // to itself so Next doesn't infer a parent workspace from sibling lockfiles.
  outputFileTracingRoot: __dirname,
}

export default nextConfig
