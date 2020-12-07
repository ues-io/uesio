import toPath from "lodash.topath"
import { DefinitionMap } from "../definition/definition"

// Trims any path to the last element that is fully namespaced
// (meaning the path element contains a dot)
// TODO: This seems a bit brittle
const trimPath = (pathArray: string[]): string[] => {
	const size = pathArray.length
	if (size === 0) {
		return pathArray
	}
	if (pathArray[0] === "wires") {
		return trimPathToWire(pathArray)
	}
	const nextItem = pathArray[size - 1]
	if (nextItem && nextItem.includes && nextItem.includes(".")) {
		return pathArray
	}
	pathArray.pop()
	return trimPath(pathArray)
}

// Converts any path starting with ["wires"] into just the first two
// elements of the path.
const trimPathToWire = (pathArray: string[]) => pathArray.slice(0, 2)

const parseKey = (fullName: string): [string, string] => {
	if (!fullName) {
		return ["", ""]
	}
	const [namespace, name] = fullName.split(".")
	return [namespace, name]
}

// Trims a path and then returns the last element of the path.
const getPathSuffix = (path: string | string[]) => {
	const pathArray = Array.isArray(path) ? path : toPath(path)
	const trimmedPath = trimPath(pathArray)
	return trimmedPath.pop() || null
}

// Trims a path and returns the string representation of the path.
const trimPathToComponent = (path: string | string[]) => {
	const pathArray = Array.isArray(path) ? path : toPath(path)
	const trimmedPath = trimPath(pathArray)
	return fromPath(trimmedPath)
}

// Unwraps a definition from its key
const getDefinitionKey = (definition: DefinitionMap) =>
	Object.keys(definition)[0]

// Unwraps a definition and returns the componentType and definition
const unWrapDefinition = (
	definition: DefinitionMap
): [string, DefinitionMap] => {
	const componentType = getDefinitionKey(definition)
	return [componentType, definition[componentType] as DefinitionMap]
}

// Return the string representation of a path array.
const fromPath = (pathArray: string[]) => {
	return pathArray.map((part: string) => `["${part}"]`).join("")
}

const getParentPath = (path: string) => {
	const pathArray = toPath(path)
	pathArray.pop()
	return fromPath(pathArray)
}

const getGrandParentPath = (path: string) => getParentPath(getParentPath(path))

const getAncestorPath = (path: string, parents: number): string =>
	path && parents ? getAncestorPath(getParentPath(path), parents - 1) : path

const getKeyAtPath = (path: string) => toPath(path).pop() || null

// Trims a path to the closest index segment
const getIndexPath = (path: string) => {
	const pathArray = toPath(path)
	while (pathArray.length > 0) {
		const segment = pathArray.pop()
		const isIndex = segment && /^\d+$/.test(segment)
		if (isIndex) {
			return fromPath(pathArray) + `["${segment}"]`
		}
	}
	return ""
}

const getIndexFromPath = (path: string) => {
	const indexString = getKeyAtPath(getIndexPath(path))
	return indexString ? parseInt(indexString, 10) : null
}

export {
	parseKey,
	getPathSuffix,
	trimPathToComponent,
	unWrapDefinition,
	fromPath,
	getParentPath,
	getGrandParentPath,
	getAncestorPath,
	getKeyAtPath,
	getIndexPath,
	getIndexFromPath,
}
