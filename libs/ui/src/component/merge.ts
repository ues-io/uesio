import { Context } from "../context/context"
import { DefinitionMap } from "../definition/definition"

// Returns a new object that has a deep merge where source overrides,
// unless no sourceDef is provided, in which case we just return destDef
function mergeDefinitionMaps(
  destDef: DefinitionMap,
  sourceDef: DefinitionMap,
  context: Context | undefined,
) {
  if (sourceDef === undefined) {
    return destDef
  }
  const destClone = JSON.parse(JSON.stringify(destDef))
  return mergeDeep(destClone, sourceDef, context)
}

// Will ignore null/undefined/empty string in the src obj
function mergeDeep(
  dest: DefinitionMap,
  src: DefinitionMap,
  context?: Context,
): DefinitionMap {
  if (!src) return dest
  for (const [key, srcItem] of Object.entries(src)) {
    const destItem = dest[key]
    if (typeof srcItem === "object" && srcItem !== null) {
      if (Array.isArray(srcItem)) {
        dest[key] = Array.isArray(destItem)
          ? (destItem as string[]).concat(srcItem)
          : srcItem
        continue
      }
      if (!destItem || typeof destItem !== "object") {
        dest[key] = {}
      }
      mergeDeep(dest[key] as DefinitionMap, srcItem as DefinitionMap, context)
      continue
    }
    if (srcItem !== null && srcItem !== undefined) {
      dest[key] =
        typeof srcItem === "string" && context
          ? context.merge(srcItem)
          : srcItem
    }
  }
  return dest
}

export { mergeDefinitionMaps }
