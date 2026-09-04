const isMobileBuild = process.env.CAPACITOR_BUILD === "true";

const nextConfig = {
  serverExternalPackages: ["tesseract.js"],
  ...(isMobileBuild ? { output: "export", images: { unoptimized: true } } : {}),
};

export default nextConfig;