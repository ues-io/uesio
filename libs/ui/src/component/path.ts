import toPath from "lodash.topath"
import { DefinitionMap } from "../definition/definition"

// Trims any path to the last element that is fully namespaced
// (meaning the path element contains a dot)
// TODO: This seems a bit brittle
function trimPath(pathArray: string[]): string[] {
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
function trimPathToWire(pathArray: string[]): string[] {
	return pathArray.slice(0, 2)
}

function parseKey(fullName: string): [string, string] {
	if (!fullName) {
		return ["", ""]
	}
	const [namespace, name] = fullName.split(".")
	return [namespace, name]
}

// Trims a path and then returns the last element of the path.
function getPathSuffix(path: string | string[]): string | null {
	const pathArray = path instanceof Array ? path : toPath(path)
	const trimmedPath = trimPath(pathArray)
	return trimmedPath.pop() || null
}

// Trims a path and returns the string representation of the path.
function trimPathToComponent(path: string | string[]): string {
	const pathArray = path instanceof Array ? path : toPath(path)
	const trimmedPath = trimPath(pathArray)
	return fromPath(trimmedPath)
}

// Unwraps a definition from its key
// TODO: Consider renaming to unWrapDefinition() or something like that
function getDefinitionKey(definition: DefinitionMap): string {
	return Object.keys(definition)[0]
}

// Return the string representation of a path array.
function fromPath(pathArray: string[]): string {
	return pathArray.map((part: string) => `["${part}"]`).join("")
}

function getParentPath(path: string): string {
	const pathArray = toPath(path)
	pathArray.pop()
	return fromPath(pathArray)
}

function getGrandParentPath(path: string): string {
	return getParentPath(getParentPath(path))
}

function getAncestorPath(path: string, parents: number): string {
	if (path && parents) {
		return getAncestorPath(getParentPath(path), parents - 1)
	}
	return path
}

function getKeyAtPath(path: string): string | null {
	const parts = toPath(path)
	return parts.pop() || null
}

// Trims a path to the closest index segment
function getIndexPath(path: string): string {
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

function getIndexFromPath(path: string): number | null {
	const indexString = getKeyAtPath(getIndexPath(path))
	if (indexString) {
		return parseInt(indexString, 10)
	}
	return null
}

export {
	parseKey,
	getPathSuffix,
	trimPathToComponent,
	getDefinitionKey,
	fromPath,
	getParentPath,
	getGrandParentPath,
	getAncestorPath,
	getKeyAtPath,
	getIndexPath,
	getIndexFromPath,
}
