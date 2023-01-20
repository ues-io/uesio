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
	const destClone = structuredClone(destDef)
	const result = mergeDeep(destClone, sourceDef, context)
	//cache[key] = result
	return result
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
		if (typeof src[key] === "object" && src[key] !== null) {
			if (Array.isArray(src[key])) {
				// Just bail on arrays and set dest to src
				// Can't really merge them well.
				dest[key] = src[key]
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
