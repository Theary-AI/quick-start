import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // This app lives in a subfolder alongside other projects; pin the tracing root
  // to itself so Next doesn't infer a parent workspace from sibling lockfiles.
  outputFileTracingRoot: __dirname,
}

export default nextConfig
