const fs = require("fs");
const path = require("path");
const dir = path.join(__dirname, "packs");
// Order: featured apps first (curated), then UN SDGs 1..17 numerically.
const FEATURED = ["disease", "electricity", "water", "blockchain"];
function rank(file) {
  const base = file.replace(/\.js$/, "");
  const fi = FEATURED.indexOf(base);
  if (fi >= 0) return fi;
  const m = base.match(/^sdg(\d+)$/);
  if (m) return 100 + parseInt(m[1], 10);
  return 50;
}
const files = fs.readdirSync(dir).filter(f => f.endsWith(".js")).sort((a, b) => rank(a) - rank(b) || a.localeCompare(b));
const packs = files.map(f => `/* ==== ${f} ==== */\n` + fs.readFileSync(path.join(dir, f), "utf8")).join("\n");
let base = fs.readFileSync(path.join(__dirname, "_base.html"), "utf8");
if (!base.includes("<!-- PACKS -->")) throw new Error("<!-- PACKS --> marker missing in _base.html");
const inject = `<script>window.HUB_DOMAINS = window.HUB_DOMAINS || [];</script>\n<script>\n${packs}\n</script>`;
base = base.replace("<!-- PACKS -->", inject);
fs.writeFileSync(path.join(__dirname, "index.html"), base);
console.log(`built index.html from ${files.length} pack(s): ${files.join(", ")}`);
