import { readFileSync, writeFileSync } from "fs";

const targetVersion = process.env.npm_package_version;
const firefoxManifest = 'src/_firefox/manifest.json';
const chromeManifest = 'src/_chrome/manifest.json'

// Bump firefox manifest version to target version
let manifest = JSON.parse(readFileSync(firefoxManifest, "utf8"));
manifest.version = targetVersion;
writeFileSync(firefoxManifest, JSON.stringify(manifest, null, "\t"));

// Bump chrome manifest version to target version
manifest = JSON.parse(readFileSync(chromeManifest, "utf8"));
manifest.version = targetVersion;
writeFileSync(chromeManifest, JSON.stringify(manifest, null, "\t"));