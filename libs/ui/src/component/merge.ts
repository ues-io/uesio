import { Context } from "../context/context"
import { DefinitionMap } from "../definition/definition"

// Returns a new object that has a deep merge where source overrides
function mergeDefinitionMaps(
	destDef: DefinitionMap,
	sourceDef: DefinitionMap,
	context: Context | undefined
) {
	//const key = JSON.stringify([destDef, sourceDef])
	//if (cache[key]) return cache[key]
	const destClone = JSON.parse(JSON.stringify(destDef))
	const result = mergeDeep(destClone, sourceDef, context)
	//cache[key] = result
	return result
}

function arrayUnique(array: unknown[]) {
	const a = array.concat()
	for (let i = 0; i < a.length; ++i) {
		for (let j = i + 1; j < a.length; ++j) {
			if (a[i] === a[j]) a.splice(j--, 1)
		}
	}

	return a
}

// Will ignore null/undefined/empty string in the src obj
function mergeDeep(
	dest: DefinitionMap,
	src: DefinitionMap,
	context: Context | undefined
): DefinitionMap {
	if (!src) return dest
	const srcKeys = Object.keys(src)
	for (const key of srcKeys) {
		const srcItem = src[key]
		if (typeof srcItem === "object" && srcItem !== null) {
			if (Array.isArray(srcItem)) {
				if (Array.isArray(dest[key])) {
					dest[key] = arrayUnique(
						(dest[key] as string[]).concat(srcItem)
					)
				} else {
					dest[key] = srcItem
				}
				continue
			}
			if (!dest[key] || typeof dest[key] !== "object") {
				dest[key] = {}
			}
			mergeDeep(
				dest[key] as DefinitionMap,
				src[key] as DefinitionMap,
				context
			)
			continue
		}

		if (src[key] !== null && src[key] !== undefined) {
			// Merge src key base on theme
			const value = src[key]
			dest[key] =
				typeof value === "string" && context
					? context.merge(value)
					: value
		}
	}
	return dest
}

export { mergeDefinitionMaps }
