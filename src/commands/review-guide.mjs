import { readFile } from "node:fs/promises";
import { resolveFromPackage } from "../core/paths.mjs";
import { openUrl, websiteUrl } from "./website.mjs";

export const reviewGuideUrl = `${websiteUrl}docs/REVIEW_GUIDE.html`;

export async function showReviewGuide({ open = false, ...browserOptions } = {}) {
  if (open) {
    return { contents: undefined, opened: true, url: openUrl(reviewGuideUrl, browserOptions) };
  }
  const contents = await readFile(resolveFromPackage("docs/REVIEW_GUIDE.md"), "utf8");
  console.log(contents.trim());
  return { contents, opened: false, url: reviewGuideUrl };
}
