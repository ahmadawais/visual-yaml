import createMDX from "@next/mdx";

const withMDX = createMDX();

const nextConfig = {
  pageExtensions: ["ts", "tsx", "md", "mdx"],
  serverExternalPackages: ["just-bash", "bash-tool"],
  transpilePackages: ["@visual-yaml/core", "@visual-yaml/react"],
};

export default withMDX(nextConfig);
