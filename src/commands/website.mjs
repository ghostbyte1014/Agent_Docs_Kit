import { spawn } from "node:child_process";

export const websiteUrl = "https://agent-docs-kit.ghostbyte1014.workers.dev/";

export function browserCommand(platform = process.platform, url = websiteUrl) {
  if (platform === "win32") {
    return { executable: "cmd.exe", arguments: ["/d", "/s", "/c", `start "" "${url}"`] };
  }
  if (platform === "darwin") return { executable: "open", arguments: [url] };
  return { executable: "xdg-open", arguments: [url] };
}

export function openUrl(url, { platform = process.platform, spawnProcess = spawn } = {}) {
  const command = browserCommand(platform, url);
  const child = spawnProcess(command.executable, command.arguments, {
    detached: true,
    stdio: "ignore",
    windowsHide: true
  });
  child.once("error", () => {
    console.error(`Could not open a browser. Visit: ${url}`);
  });
  child.unref();
  console.log(`Opening documentation: ${url}`);
  return url;
}

export function openWebsite(options = {}) {
  return openUrl(websiteUrl, options);
}
