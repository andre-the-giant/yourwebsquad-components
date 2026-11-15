// Decorative demo images for the docs, drawn as SVG data URIs (no files in public/).

const svg = (markup) => `data:image/svg+xml,${encodeURIComponent(markup)}`;

/** Landscape with a gradient sky. */
export const landscape = (a, b, viewBox = "0 0 400 240") => {
  const [, , w, h] = viewBox.split(" ").map(Number);
  return svg(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}"><defs><linearGradient id="g" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs><rect width="${w}" height="${h}" fill="url(#g)"/><circle cx="${w * 0.78}" cy="${h * 0.3}" r="${h * 0.17}" fill="#fff" opacity=".25"/><path d="M0 ${h * 0.83} ${w * 0.3} ${h * 0.5}l${w * 0.22} ${h * 0.25} ${w * 0.2} -${h * 0.21} ${w * 0.28} ${h * 0.29}V${h}H0z" fill="#000" opacity=".2"/></svg>`
  );
};

/** Head-and-shoulders silhouette. */
export const portrait = (bg) =>
  svg(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 320"><rect width="320" height="320" fill="${bg}"/><circle cx="160" cy="128" r="58" fill="#fff" opacity=".85"/><path d="M50 320c8-70 54-112 110-112s102 42 110 112z" fill="#fff" opacity=".85"/></svg>`
  );
