import fs from "node:fs"
import Path from "node:path"
import { parseTailwindCss } from "./tailwind-css-class-parser.js"
const targetPath = Path.join(
  import.meta.dirname,
  "..",
  "bundle",
  "componentpacks",
  "main",
  "dist",
  "tailwind-classes.json",
)

// Read CSS file
const loadTailwindCss = async (url) => {
  const response = await fetch(url, {
    timeout: 10000,
  })
  return response.text()
}

const tailwindUrl = "https://unpkg.com/tailwindcss@2/dist/tailwind.css"

// Use fs to check if the file at targetPath already exists
if (fs.existsSync(targetPath)) {
  // eslint-disable-next-line no-console -- used during build time for status
  console.info(`Tailwind CSS class index already exists, skipping generation.`)
  process.exit(0)
}

loadTailwindCss(tailwindUrl)
  .then(parseTailwindCss)
  .then((parsedTokens) => {
    if (!parsedTokens.length > 1000) {
      // Something is wrong, bail out
      throw new Error(
        "Found fewer Tailwind class names than we were expecting, something went wrong.",
      )
    }
    fs.writeFileSync(targetPath, JSON.stringify(parsedTokens))
    // eslint-disable-next-line no-console -- used during build time for status
    console.info(
      `Successfully generated Tailwind CSS class index with ${parsedTokens.length} classes to ${targetPath}`,
    )
  })
  .catch((err) => {
    console.error("Fatal error processing Tailwind CSS:", err)
    process.exit(1)
  })
