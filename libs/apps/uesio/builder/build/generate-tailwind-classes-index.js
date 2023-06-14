const fs = require("fs")
const Path = require("path")
const { parseTailwindCss } = require("./tailwind-css-class-parser")

// Read CSS file
const loadTailwindCss = async (url) => {
	const response = await fetch(url, {
		timeout: 10000,
	})
	return response.text()
}

const tailwindUrl = "https://unpkg.com/tailwindcss@2/dist/tailwind.css"

return loadTailwindCss(tailwindUrl)
	.then(parseTailwindCss)
	.then((parsedTokens) => {
		if (!parsedTokens.length > 1000) {
			// Something is wrong, bail out
			throw new Error(
				"Found fewer Tailwind class names than we were expecting, something went wrong."
			)
		}
		const targetPath = Path.join(
			__dirname,
			"..",
			"bundle",
			"componentpacks",
			"main",
			"dist",
			"tailwind-classes.json"
		)
		fs.writeFileSync(targetPath, JSON.stringify(parsedTokens))
		console.log(" ")
		console.info(
			`Successfully generated Tailwind CSS class index with ${parsedTokens.length} classes to ${targetPath}`
		)
		console.log(" ")
	})
	.catch((err) => {
		console.error("Fatal error processing Tailwind CSS:", err)
		process.exit(1)
	})
