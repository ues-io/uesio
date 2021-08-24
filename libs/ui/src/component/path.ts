import toPath from "lodash/toPath"
import { DefinitionMap } from "../definition/definition"

// Trims any path to the last element that is fully namespaced
// (meaning the path element contains a dot)
// TODO: This seems a bit brittle
const trimPath = (pathArray: string[]): string[] => {
	const size = pathArray.length
	if (size === 0) {
		return pathArray
	}
	// Converts any path starting with ["wires|modals"] into just the first two
	// elements of the path.
	if (pathArray[0] === "wires" || pathArray[0] === "panes") {
		return pathArray.slice(0, 2)
	}
	const nextItem = pathArray[size - 1]
	if (nextItem && nextItem.includes && nextItem.includes(".")) {
		return pathArray
	}
	pathArray.pop()
	return trimPath(pathArray)
}

const parseKey = (fullName: string): [string, string] => {
	if (!fullName) {
		return ["", ""]
	}
	const [namespace, name] = fullName.split(".")
	return [namespace, name]
}

// io.button.io.nav ==> [io, button, io, nav]
const parseVariantKey = (
	fullName: string
): [string, string, string, string] => {
	if (!fullName) return ["", "", "", ""]
	const [componentNamespace, componentName, variantNamespace, variantName] =
		fullName.split(".", 4)
	return [componentNamespace, componentName, variantNamespace, variantName]
}

// io.button.io.nav ==> [io, button, io, nav]
const parseFieldKey = (fullName: string): [string, string, string, string] => {
	if (!fullName) return ["", "", "", ""]
	const [collectionNamespace, collectionName, fieldNamespace, fieldName] =
		fullName.split(".", 4)
	return [collectionNamespace, collectionName, fieldNamespace, fieldName]
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
	if (!pathArray.length) {
		return ""
	}
	return `["${pathArray.join(`"]["`)}"]`
}

const getParentPath = (path: string) => {
	const pathArray = toPath(path)
	pathArray.pop()
	return fromPath(pathArray)
}
function isInt(str: string) {
	let i = 0
	if (str.length === 0) return false
	while (i < str.length) {
		if (str[i] > "9" || str[i] < "0") return false
		i++
	}
	return true
}

/**
 * Predicts what to toPath will be assuming the fromPath content vanishes.
 * If the from path is the older sibling of an ancestory - the two path will need
 * to be modified
 * @param fromPathStr
 * @param toPathStr
 */
const calculateNewPathAheadOfTime = (
	fromPathStr: string,
	toPathStr: string
) => {
	const fromPathArray = toPath(fromPathStr)
	const toPathArray = toPath(toPathStr)

	let index = 0
	let foundDifferenceBeforeEnd = false
	while (fromPathArray.length > index && toPathArray.length > index) {
		if (fromPathArray[index] !== toPathArray[index]) {
			if (!isInt(fromPathArray[index]) || !isInt(toPathArray[index])) {
				return toPathStr
			}
			foundDifferenceBeforeEnd = true
			break // Found a difference in int indexes
		}
		index++
	}
	if (!foundDifferenceBeforeEnd) {
		return toPathStr
	}
	//If we got here we shifted indexes between from and to path - so we need to handle edge cases
	const fromIndex = parseInt(fromPathArray[index], 10)
	const toIndex = parseInt(toPathArray[index], 10)

	if (toIndex < fromIndex) {
		// No problem - we moved before where we were - so our calculated
		// path is still correct
		return toPathStr
	}

	if (toPathArray.length - 2 === index) {
		// The level we moved in is our own top most level - so the
		// index is actually correct already
		return toPathStr
	}
	// Otherwise we moved into a deeper level than we were before, and
	// after where we were so we need to decrement where we think we are going
	// to account for a parent generation entry no longer being in that space
	toPathArray[index] = toIndex - 1 + ""
	//Covert it back to the stringified path
	return fromPath(toPathArray)
}

const getGrandParentPath = (path: string) => getParentPath(getParentPath(path))

const getAncestorPath = (path: string, parents: number): string =>
	path && parents ? getAncestorPath(getParentPath(path), parents - 1) : path

const getKeyAtPath = (path: string) => toPath(path).pop() || null

const getFullPathParts = (path: string): [string, string, string] => {
	const pathArray = toPath(path)
	const metadataType = pathArray.shift() || ""
	const metadataItem = pathArray.shift() || ""
	return [metadataType, metadataItem, fromPath(pathArray)]
}

const makeFullPath = (
	metadataType: string,
	metadataItem: string,
	path: string
) => `["${metadataType}"]["${metadataItem}"]${path}`

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
	calculateNewPathAheadOfTime,
	parseKey,
	parseVariantKey,
	parseFieldKey,
	getPathSuffix,
	trimPathToComponent,
	unWrapDefinition,
	fromPath,
	toPath,
	getParentPath,
	getGrandParentPath,
	getAncestorPath,
	getKeyAtPath,
	getIndexPath,
	getIndexFromPath,
	getDefinitionKey,
	getFullPathParts,
	makeFullPath,
}
