const tailwindCssClassSearch = require("@dtinth/tailwind-css-class-search")
const fs = require("fs")
const Path = require("path")

// Read CSS file
const loadTailwindCss = async (url) => {
	const response = await fetch(url, {
		timeout: 10000,
	})
	return response.text()
}

const tailwindUrl = "https://unpkg.com/tailwindcss@2/dist/tailwind.css"

const originalLog = console.log

return loadTailwindCss(tailwindUrl)
	.then((css) => {
		// this library is really noisy and verbose when parsing classes,
		// so temporarily disable the console log function
		console.log = () => {}
		return tailwindCssClassSearch(css)
	})
	.then((searchIndex) => {
		// Restore the log
		console.log = originalLog
		if (!searchIndex.entries.length > 1000) {
			// Something is wrong, bail out
			throw new Error(
				"Found fewer Tailwind class names than we were expecting, something went wrong."
			)
		}
		const allClassNames = searchIndex.entries.map(
			(entry) => entry.className
		)
		const targetPath = Path.join(
			__dirname,
			"..",
			"bundle",
			"componentpacks",
			"main",
			"dist",
			"tailwind-classes.json"
		)
		fs.writeFileSync(targetPath, JSON.stringify(allClassNames))
		console.log(" ")
		console.info(
			`Successfully generated Tailwind CSS class index with ${allClassNames.length} classes to ${targetPath}`
		)
		console.log(" ")
	})
	.catch((err) => {
		console.error("Fatal error processing Tailwind CSS:", err)
		process.exit(1)
	})
