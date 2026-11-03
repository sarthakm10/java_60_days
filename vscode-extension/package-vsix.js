// Usage: node vscode-extension/package-vsix.js
// Builds dist/java-step-visualizer-<version>.vsix, the file VS Code installs with
//   code --install-extension vscode-extension/dist/java-step-visualizer-<version>.vsix
// A .vsix is a zip: [Content_Types].xml, extension.vsixmanifest and the extension under extension/.
// Written by hand so no npm package (vsce) is needed. The website's player and the tracer go into media/.
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const here = __dirname;
const repo = path.join(here, "..");
const pkg = JSON.parse(fs.readFileSync(path.join(here, "package.json"), "utf8"));

const files = {
  "extension/package.json": path.join(here, "package.json"),
  "extension/README.md": path.join(here, "README.md"),
  "extension/extension.js": path.join(here, "extension.js"),
  "extension/runner.js": path.join(here, "runner.js"),
  "extension/webview/panel.js": path.join(here, "webview", "panel.js"),
  "extension/webview/panel.css": path.join(here, "webview", "panel.css"),
  "extension/media/visualizer.js": path.join(repo, "visualizer.js"),
  "extension/media/visualizer.css": path.join(repo, "visualizer.css"),
  "extension/media/Tracer.java": path.join(repo, "scripts", "tracer", "Tracer.java"),
};

const xml = (s) => String(s).replace(/[<>&"]/g, c => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;" }[c]));
const manifest = `<?xml version="1.0" encoding="utf-8"?>
<PackageManifest Version="2.0.0" xmlns="http://schemas.microsoft.com/developer/vsx-schema/2011" xmlns:d="http://schemas.microsoft.com/developer/vsx-schema-design/2011">
  <Metadata>
    <Identity Language="en-US" Id="${xml(pkg.name)}" Version="${xml(pkg.version)}" Publisher="${xml(pkg.publisher)}" />
    <DisplayName>${xml(pkg.displayName)}</DisplayName>
    <Description xml:space="preserve">${xml(pkg.description)}</Description>
    <Tags>${xml(pkg.keywords.join(","))}</Tags>
    <Categories>${xml(pkg.categories.join(","))}</Categories>
    <GalleryFlags>Public</GalleryFlags>
    <Properties>
      <Property Id="Microsoft.VisualStudio.Code.Engine" Value="${xml(pkg.engines.vscode)}" />
      <Property Id="Microsoft.VisualStudio.Code.ExtensionDependencies" Value="" />
      <Property Id="Microsoft.VisualStudio.Code.ExtensionPack" Value="" />
      <Property Id="Microsoft.VisualStudio.Code.ExtensionKind" Value="workspace" />
      <Property Id="Microsoft.VisualStudio.Code.LocalizedLanguages" Value="" />
    </Properties>
  </Metadata>
  <Installation>
    <InstallationTarget Id="Microsoft.VisualStudio.Code" />
  </Installation>
  <Dependencies />
  <Assets>
    <Asset Type="Microsoft.VisualStudio.Code.Manifest" Path="extension/package.json" Addressable="true" />
    <Asset Type="Microsoft.VisualStudio.Services.Content.Details" Path="extension/README.md" Addressable="true" />
  </Assets>
</PackageManifest>
`;
const contentTypes = `<?xml version="1.0" encoding="utf-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension=".json" ContentType="application/json" />
  <Default Extension=".vsixmanifest" ContentType="text/xml" />
  <Default Extension=".js" ContentType="application/javascript" />
  <Default Extension=".css" ContentType="text/css" />
  <Default Extension=".md" ContentType="text/markdown" />
  <Default Extension=".java" ContentType="text/plain" />
</Types>
`;

// ── A minimal zip writer (deflate, no zip64): local headers, then the central directory ──
const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc32 = (buf) => {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};

function zip(entries) {
  const locals = [], centrals = [];
  let offset = 0;
  const now = new Date();
  const dosTime = (now.getHours() << 11) | (now.getMinutes() << 5) | (now.getSeconds() >> 1);
  const dosDate = ((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate();
  for (const [name, data] of entries) {
    const nameBuf = Buffer.from(name, "utf8");
    const packed = zlib.deflateRawSync(data, { level: 9 });
    const crc = crc32(data);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0); local.writeUInt16LE(20, 4); local.writeUInt16LE(0x0800, 6);   // UTF-8 names
    local.writeUInt16LE(8, 8); local.writeUInt16LE(dosTime, 10); local.writeUInt16LE(dosDate, 12);
    local.writeUInt32LE(crc, 14); local.writeUInt32LE(packed.length, 18); local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(nameBuf.length, 26); local.writeUInt16LE(0, 28);
    locals.push(local, nameBuf, packed);
    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0); central.writeUInt16LE(20, 4); central.writeUInt16LE(20, 6); central.writeUInt16LE(0x0800, 8);
    central.writeUInt16LE(8, 10); central.writeUInt16LE(dosTime, 12); central.writeUInt16LE(dosDate, 14);
    central.writeUInt32LE(crc, 16); central.writeUInt32LE(packed.length, 20); central.writeUInt32LE(data.length, 24);
    central.writeUInt16LE(nameBuf.length, 28); central.writeUInt32LE(offset, 42);
    centrals.push(central, nameBuf);
    offset += 30 + nameBuf.length + packed.length;
  }
  const dir = Buffer.concat(centrals);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(entries.length, 8); end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(dir.length, 12); end.writeUInt32LE(offset, 16);
  return Buffer.concat([...locals, dir, end]);
}

const entries = [
  ["[Content_Types].xml", Buffer.from(contentTypes)],
  ["extension.vsixmanifest", Buffer.from(manifest)],
  ...Object.entries(files).map(([name, file]) => {
    if (!fs.existsSync(file)) { console.error(`Missing ${path.relative(repo, file)}`); process.exit(1); }
    return [name, fs.readFileSync(file)];
  }),
];
const outDir = path.join(here, "dist");
fs.mkdirSync(outDir, { recursive: true });
const out = path.join(outDir, `${pkg.name}-${pkg.version}.vsix`);
fs.writeFileSync(out, zip(entries));
console.log(`✓ ${path.relative(repo, out)} (${Math.round(fs.statSync(out).size / 1024)} KB, ${entries.length} files)`);
console.log(`Install it with:\n  code --install-extension "${out}"`);
