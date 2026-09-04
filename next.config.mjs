const isMobileBuild = process.env.CAPACITOR_BUILD === "true";

const nextConfig = {
  serverExternalPackages: ["tesseract.js"],
  typescript: {
    ignoreBuildErrors: true,
  },
  ...(isMobileBuild ? { output: "export", images: { unoptimized: true } } : {}),
};

export default nextConfig;