import toPath from "lodash/toPath"
import { MetadataKey } from "../bands/builder/types"

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

// Return the string representation of a path array.
const fromPath = (pathArray: string[]) => {
	if (!pathArray.length) {
		return ""
	}
	return `["${pathArray.join(`"]["`)}"]`
}

// Removes the last item from a path
const getParentPath = (path: string) => getAncestorPath(path, 1)

const getParentPathArray = (pathArray: string[]) => pathArray.slice(0, -1)

// Removes the last 2 items from a path
const getGrandParentPath = (path: string) => getAncestorPath(path, 2)

/**
 * Trims a path N levels up
 * @param path
 * @param n Number of items to slice off the path.
 * @returns A shorter path, shorter by N items
 */
const getAncestorPath = (path: string, n: number): string => {
	const arr = toPath(path)
	return fromPath(arr.slice(0, arr.length - n))
}

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

const isComponentIndex = (index: string | null | undefined) =>
	index && /^\w+\/\w+\.\w+$/.test(index)

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

const parseRelativePath = (relativePath: string, basePath: string) => {
	// Clean strings starting with './', we don't need that
	const niceString = relativePath.startsWith("./")
		? relativePath.replace("./", "")
		: relativePath
	// get the N levels up the tree
	const arr = niceString.split("../")

	const startingPath = getAncestorPath(basePath, arr.length)
	const endingPath = arr
		.pop()
		?.split("/")
		.map((el) => `["${el}"]`)
		.join("")

	return startingPath + endingPath
}

export {
	parseKey,
	parseVariantKey,
	parseFieldKey,
	fromPath,
	toPath,
	getParentPath,
	getParentPathArray,
	getGrandParentPath,
	getAncestorPath,
	getKeyAtPath,
	getIndexPath,
	getIndexFromPath,
	getFullPathParts,
	makeFullPath,
	isNumberIndex,
	isComponentIndex,
	parseRelativePath,
}
