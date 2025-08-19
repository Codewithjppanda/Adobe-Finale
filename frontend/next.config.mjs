/** @type {import('next').NextConfig} */
const isStaticExport = process.env.NEXT_STATIC_EXPORT === "true";
const nextConfig = isStaticExport
  ? { output: "export" } // enable only when explicitly building for static export
  : {};
export default nextConfig;


