const fs = require('fs');

// We don't have sharp to generate PNGs easily, so we'll use a hack to output tiny transparent pngs for now since this is a local script environment without standard canvas tools.
// Wait, actually let's just make it an SVG and change the manifest to point to the SVG!

fs.writeFileSync('icon.svg', `<svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" rx="100" fill="#6D8196"/>
  <text x="50%" y="50%" font-family="sans-serif" font-weight="bold" font-size="240" fill="#FFFFE3" dominant-baseline="middle" text-anchor="middle">FR</text>
</svg>`);

console.log("SVG created");
