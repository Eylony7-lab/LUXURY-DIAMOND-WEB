// Shared shimmer placeholder used as the `blurDataURL` for every product
// image, so photos fade in smoothly instead of popping in once loaded.
const shimmer = (w: number, h: number) => `
<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="g">
      <stop stop-color="#efe7d8" offset="20%" />
      <stop stop-color="#f7f1e6" offset="50%" />
      <stop stop-color="#efe7d8" offset="70%" />
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="#efe7d8" />
  <rect id="r" width="${w}" height="${h}" fill="url(#g)" />
</svg>`;

const toBase64 = (str: string) =>
  typeof window === "undefined" ? Buffer.from(str).toString("base64") : window.btoa(str);

export function shimmerBlurDataUrl(w = 800, h = 800): string {
  return `data:image/svg+xml;base64,${toBase64(shimmer(w, h))}`;
}
