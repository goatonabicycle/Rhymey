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
        "Version number not provided. Usage: node create-new-release.js <version>",
      );
    }

    DoingLog(`Starting process for version ${version}`);
    const secrets = await loadSecrets();
    await updateManifest(version);

    const extensionDir = path.join(process.cwd(), "dist/chrome");

    try {
      await fs.stat(extensionDir);
    } catch {
      throw new Error(
        chalk.red(
          `Extension directory ${extensionDir} does not exist. Please run "npm run build"`,
        ),
      );
    }

    const releasesDir = path.join(process.cwd(), "releases");
    await fs.mkdir(releasesDir, { recursive: true });

    const zipPath = path.join(releasesDir, `extension-v${version}.zip`);
    await zipDirectory(extensionDir, zipPath);

    DoingLog("Uploading to Chrome Web Store...");

    console.log("Verifying credentials...");
    const credentials = {
      extensionId: String(secrets.extensionId),
      clientId: String(secrets.clientId),
      clientSecret: String(secrets.clientSecret),
      refreshToken: String(secrets.refreshToken)
    };

    console.log("Credential formats:", {
      extensionIdLength: credentials.extensionId.length,
      clientIdEndsWithGoogleusercontent: credentials.clientId.endsWith('.apps.googleusercontent.com'),
      clientSecretLength: credentials.clientSecret.length,
      refreshTokenLength: credentials.refreshToken.length
    });

    const store = chromeWebstoreUpload(credentials);

    let token;
    try {
      token = await store.fetchToken();
      console.log("Token fetch response:", token);
    } catch (tokenError) {
      console.error("Complete token error:", tokenError);
      throw new Error(`Authentication failed: ${tokenError.message}`);
    }

    if (!token || !token.token) {
      throw new Error("Failed to obtain valid authentication token");
    }

    const uploadFile = await fs.readFile(zipPath);

    try {
      DoingLog("Uploading new version...");

      console.log("Upload file details:", {
        size: uploadFile.length,
        exists: !!uploadFile
      });

      const uploadResult = await store.uploadExisting(uploadFile).catch(err => {
        console.error('Upload error details:', {
          message: err.message,
          response: err.response?.data,
          status: err.response?.status,
          headers: err.response?.headers
        });
        throw err;
      });

      console.log("Upload response:", uploadResult);

      if (!uploadResult || !uploadResult.uploadState) {
        throw new Error("Upload failed: No upload state returned");
      }

      if (uploadResult.uploadState !== "SUCCESS") {
        throw new Error(`Upload failed: ${uploadResult.uploadState}`);
      }

      YayLog(`Successfully uploaded version ${version} as draft`);
      YayLog("Go to the Chrome Web Store Developer Dashboard yo!");

    } catch (error) {
      console.error("Full error details:", {
        message: error.message,
        name: error.name,
        stack: error.stack,
        response: error.response?.data
      });

      throw new Error(
        chalk.red(`Failed to upload to Chrome Web Store: ${error.message}`),
      );
    }

    YayLog(`Process completed successfully for version ${version}`);
  } catch (error) {
    console.error(chalk.red(`Error: ${error.message}`));
    process.exit(1);
  }
}

main();
