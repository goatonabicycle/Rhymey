import { promises as fs } from "node:fs";
import { createWriteStream } from "node:fs";
import path from "node:path";
import archiver from "archiver";
import chalk from "chalk";
import chromeWebstoreUpload from "chrome-webstore-upload";

async function loadSecrets() {
  DoingLog("Loading secrets.json...");
  const secretsPath = path.join(process.cwd(), "secrets.json");
  try {
    const secrets = JSON.parse(await fs.readFile(secretsPath, "utf8"));
    return secrets;
  } catch (error) {
    throw new Error(chalk.red(`Failed to load secrets.json: ${error.message}`));
  }
}

async function updateManifest(version) {
  DoingLog("Updating manifest.json...");
  const manifestPath = path.join(process.cwd(), "manifest.json");
  try {
    const manifest = JSON.parse(await fs.readFile(manifestPath, "utf8"));
    manifest.version = version;
    await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2));
    YayLog(`Manifest updated to version ${version}`);
  } catch (error) {
    throw new Error(
      chalk.red(`Failed to update manifest.json: ${error.message}`),
    );
  }
}

async function zipDirectory(sourceDir, outputZipPath) {
  DoingLog("Zipping up extension folder...");

  try {
    const output = createWriteStream(outputZipPath);
    const archive = archiver("zip", { zlib: { level: 9 } });

    output.on("close", () => {
      const message = `Extension folder zipped to ${outputZipPath} (${archive.pointer()} total bytes)`;
      YayLog(message);
    });

    archive.on("error", (err) => {
      throw new Error(
        chalk.red(`Error zipping extension folder: ${err.message}`),
      );
    });

    archive.pipe(output);
    archive.directory(sourceDir, false);

    await archive.finalize();
  } catch (error) {
    throw new Error(chalk.red(`Failed to zip directory: ${error.message}`));
  }
}

function YayLog(message) {
  console.log(
    chalk.green(
      `
        ${message}
      `,
    ),
  );
}

function DoingLog(message) {
  console.log(chalk.blue(`${message}`));
}

async function main() {
  try {
    console.log(
      chalk.yellow.bold(`
    ╔═══════════════════════════════════════════╗
    ║ Chrome Web Store Extension Upload Script  ║
    ╚═══════════════════════════════════════════╝
  `),
    );

    const version = process.argv[2];
    if (!version) {
      throw new Error(
        "Version number not provided. Usage: node script.js <version>",
      );
    }

    DoingLog(`Starting process for version ${version}`);
    const secrets = await loadSecrets();
    YayLog([secrets.CLIENT_ID, secrets.REFRESH_TOKEN].join("|"));
    await updateManifest(version);

    const extensionDir = path.join(process.cwd(), "extension");
    const releasesDir = path.join(process.cwd(), "releases");
    await fs.mkdir(releasesDir, { recursive: true });

    const zipPath = path.join(releasesDir, `extension-v${version}.zip`);
    await zipDirectory(extensionDir, zipPath);

    // Do all the chrome token and uploading stuff here.

    const store = chromeWebstoreUpload({
      extensionId: secrets.extensionId,
      clientId: secrets.clientId,
      clientSecret: secrets.clientSecret,
      refreshToken: secrets.refreshToken,
    });

    YayLog(`Process completed successfully for version ${version}`);
  } catch (error) {
    console.error(chalk.red(`Error: ${error.message}`));
    process.exit(1);
  }
}

main();
