import toPath from "lodash/toPath"
import { MetadataKey } from "../bands/builder/types"
import { DefinitionMap } from "../definition/definition"

const parseKey = (fullName: string): [string, string] => {
	if (!fullName) {
		return ["", ""]
	}
	const [namespace, name] = fullName.split(".")
	return [namespace, name]
}

// io.button:io.nav ==> [io, button, io, nav]
const parseVariantKey = (
	fullName: string
): [string, string, string, string] => {
	if (!fullName) return ["", "", "", ""]
	const [component, variant] = fullName.split(":", 2)
	const [componentNamespace, componentName] = parseKey(component)
	const [variantNamespace, variantName] = parseKey(variant)
	return [componentNamespace, componentName, variantNamespace, variantName]
}

// io.button:io.nav ==> [io, button, io, nav]
const parseFieldKey = (fullName: string): [string, string, string, string] => {
	if (!fullName) return ["", "", "", ""]
	const [collection, field] = fullName.split(":", 2)
	const [collectionNamespace, collectionName] = parseKey(collection)
	const [fieldNamespace, fieldName] = parseKey(field)
	return [collectionNamespace, collectionName, fieldNamespace, fieldName]
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

// Trims the last item of a path
const getParentPath = (path: string) => {
	const pathArray = toPath(path)
	pathArray.pop()
	return fromPath(pathArray)
}

const getParentPathArray = (pathArray: string[]) => pathArray.slice(0, -1)

const getGrandParentPath = (path: string) => getParentPath(getParentPath(path))

const getAncestorPath = (path: string, parents: number): string =>
	path && parents ? getAncestorPath(getParentPath(path), parents - 1) : path

const getKeyAtPath = (path: string) => toPath(path).pop() || null

const getFullPathParts = (path: string): [string, MetadataKey, string] => {
	const pathArray = toPath(path)
	const metadataType = pathArray.shift() || ""
	const metadataItem = (pathArray.shift() || "") as MetadataKey
	return [metadataType, metadataItem, fromPath(pathArray)]
}

const makeFullPath = (
	metadataType: string,
	metadataItem: string,
	path: string
) => `["${metadataType}"]["${metadataItem}"]${path}`

const isNumberIndex = (index: string | null | undefined) =>
	index && /^\d+$/.test(index)

// Trims a path to the closest index segment
const getIndexPath = (path: string) => {
	const pathArray = toPath(path)
	while (pathArray.length > 0) {
		const segment = pathArray.pop()
		const isIndex = isNumberIndex(segment)
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

/**
 * Trims a path N levels up
 * @param path
 * @param n
 * @returns A shorter path, shorter by N levels
 */
const trim = (path: string, n: number) => {
	const arr = toPath(path)
	return fromPath(arr.slice(0, arr.length - n))
}

export {
	trim,
	parseKey,
	parseVariantKey,
	parseFieldKey,
	unWrapDefinition,
	fromPath,
	toPath,
	getParentPath,
	getParentPathArray,
	getGrandParentPath,
	getAncestorPath,
	getKeyAtPath,
	getIndexPath,
	getIndexFromPath,
	getDefinitionKey,
	getFullPathParts,
	makeFullPath,
	isNumberIndex,
}
