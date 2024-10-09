const fs = require("fs").promises;
const path = require("path");

async function updateManifest(version) {
  console.log(`📝 Updating manifest.json...`);
  const manifestPath = path.join(__dirname, "extension/manifest.json");
  const manifest = JSON.parse(await fs.readFile(manifestPath, "utf8"));
  manifest.version = version;
  await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(`✅ Manifest updated to version ${version}`);
}

async function main() {
  console.log(`
    ╔═══════════════════════════════════════════╗
    ║ Chrome Web Store Extension Upload Script  ║
    ╚═══════════════════════════════════════════╝
`);

  const version = process.argv[2];
  if (!version) {
    console.error(`❌ Error: Please provide a version number`);
    process.exit(1);
  }

  console.log(`Starting process for version ${version}`);

  try {
    await updateManifest(version);

    // Here there will be lots of other magic!node
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
  }
}

main();
