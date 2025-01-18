const csstree = require("css-tree")

const walk = (tree, prefix, items = []) => {
	for (const child of tree.children) {
		if (child.type === "Comment") {
			// skip
		} else if (child.type === "Rule") {
			const selector = csstree.generate(child.prelude)
			const classes = []
			csstree.walk(child.prelude, {
				visit: "ClassSelector",
				enter(node) {
					classes.push(node.name)
				},
			})
			if (classes.length === 0) {
				// skip
			} else if (classes.length > 1) {
				// console.warn("Found more than 1 classes:", selector)
			} else if (child.block) {
				const declarations = child.block.children
					.map((node) => {
						if (node.type !== "Declaration") {
							console.warn("Non-declaration found", node)
							return
						}
						return {
							property: node.property,
							value: csstree.generate(node.value),
							important: node.important,
						}
					})
					.filter((x) => x)
				if (declarations.length) {
					const filteredSelector = selector.replace(
						`.${classes[0]}`,
						"&"
					)
					const add =
						filteredSelector === `&` ? [] : [filteredSelector]
					const css = [...prefix, ...add].reduceRight(
						(css, prefix) => `${prefix} { ${css} }`,
						child.block.children
							.map((node) => csstree.generate(node))
							.join("; ")
					)
					items.push({
						prefix: [...prefix, ...add],
						className: classes[0].replace(/\\(.)/g, "$1"),
						declarations,
						css,
					})
				} else {
					console.warn("No declaration found", child)
				}
			}
		} else if (child.type === "Atrule") {
			const prelude = `@${child.name} ${csstree.generate(child.prelude)}`
			if (child.block) {
				walk(child.block, [...prefix, prelude])
			}
		} else {
			console.error("Unhandled", child.type)
		}
	}
}

const parseTailwindCss = (css) => {
	console.info("Parsing CSS...") // eslint-disable-line no-console -- used during build time for status
	const ast = csstree.toPlainObject(csstree.parse(css))
	const items = []
	// Walk the parsed CSS AST
	walk(ast, [], items)
	console.info("Generating search index...") // eslint-disable-line no-console -- used during build time for status
	const entries = []
	const byClassName = new Map()
	for (const item of items) {
		const { prefix, className, css, declarations } = item
		let entry = byClassName.get(className)
		if (!entry) {
			entry = { className, results: [] }
			entries.push(entry)
			byClassName.set(className, entry)
		}
		entry.results.push({ css, prefix, declarations })
	}
	console.info("Parsing entries...") // eslint-disable-line no-console -- used during build time for status
	entries.sort((a, b) => a.className.localeCompare(b.className))
	return entries.map((entry) => {
		const classNamePrepared = entry.className
		const cssPrepared = entry.results.map((r) => r.css).join(" ")
		return [classNamePrepared, cssPrepared]
	})
}

module.exports = {
	parseTailwindCss,
}
