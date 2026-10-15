import { spawn } from "node:child_process";

export const websiteUrl = "https://agent-docs-kit.ghostbyte1014.workers.dev/";

export function browserCommand(platform = process.platform) {
  if (platform === "win32") {
    return { executable: "cmd.exe", arguments: ["/d", "/s", "/c", `start "" "${websiteUrl}"`] };
  }
  if (platform === "darwin") return { executable: "open", arguments: [websiteUrl] };
  return { executable: "xdg-open", arguments: [websiteUrl] };
}

export function openWebsite({ platform = process.platform, spawnProcess = spawn } = {}) {
  const command = browserCommand(platform);
  const child = spawnProcess(command.executable, command.arguments, {
    detached: true,
    stdio: "ignore",
    windowsHide: true
  });
  child.once("error", () => {
    console.error(`Could not open a browser. Visit: ${websiteUrl}`);
  });
  child.unref();
  console.log(`Opening documentation: ${websiteUrl}`);
  return websiteUrl;
}
