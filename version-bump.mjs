import fs from "node:fs";

/*
 * Record the version currently in manifest.json into versions.json.
 * Run by the `version` npm script, i.e. from `npm version <x.y.z>` (npm then
 * commits the bump) or manually via `npm run version`.
 */
const manifestPath = "manifest.json";
const versionsPath = "versions.json";
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const versions = JSON.parse(fs.readFileSync(versionsPath, "utf8"));

versions[manifest.version] = manifest.minAppVersion;
fs.writeFileSync(versionsPath, JSON.stringify(versions, null, 2) + "\n");
