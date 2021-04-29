import toPath from "lodash/topath"
import { Pair, Node, Collection } from "yaml/types"
import yaml from "yaml"

const YAML_OPTIONS = {
	simpleKeys: true,
	keepNodeTypes: false,
}

const newDoc = () => new yaml.Document(YAML_OPTIONS)
const parse = (str: string) => yaml.parseDocument(str, YAML_OPTIONS)

const isInRange = (offset: number, node: Node) => {
	if (!node.range) {
		return false
	}
	return offset >= node.range[0] && offset <= node.range[1]
}

const getNodeAtOffset = (
	offset: number,
	parentnode: Node,
	path: string,
	includeKey?: boolean
): [Node | null, string] => {
	if (isInRange(offset, parentnode)) {
		const nodes = (parentnode as Collection).items
		let index = 0
		if (!nodes) {
			return [parentnode, path]
		}
		for (const node of nodes) {
			// I don't know what or how to handle merge pairs.
			if (node.type === "MERGE_PAIR") {
				return [parentnode, path]
			}
			if (node.key && isInRange(offset, node.key)) {
				return includeKey
					? [node.key, path + '["' + node.key + '"]']
					: [parentnode, path]
			}
			if (node.key && node.value) {
				const [
					foundNode,
					foundPath,
					// eslint-disable-next-line @typescript-eslint/no-use-before-define
				] = getNodeAtOffset(
					offset,
					node.value,
					path + '["' + node.key + '"]',
					includeKey
				)
				if (foundNode) {
					return [foundNode, foundPath]
				}
			}
			const [
				foundNode,
				foundPath,
				// eslint-disable-next-line @typescript-eslint/no-use-before-define
			] = getNodeAtOffset(
				offset,
				node,
				path + '["' + index + '"]',
				includeKey
			)
			if (foundNode) {
				return [foundNode, foundPath]
			}
			index++
		}
		return [parentnode, path]
	}
	return [null, path]
}

const getNodeAtPath = (
	path: string | string[],
	node: Node | null
): Node | null => {
	const pathArray = Array.isArray(path) ? path : toPath(path)
	return (node as Collection)?.getIn(pathArray, true)
}

const getCommonPath = (startPath: string[], endPath: string[]): string[] => {
	const commonPath: string[] = []
	let index = 0
	for (const pathPart of startPath) {
		if (pathPart === endPath[index]) {
			commonPath.push(pathPart)
			index++
		} else {
			return commonPath
		}
	}
	return commonPath
}

const getPathFromPathArray = (pathArray: string[]): string =>
	pathArray.map((pathPart) => `["${pathPart}"]`).join("")

const getCommonAncestorPath = (
	startPath: string,
	endPath: string
): string[] => {
	const startPathArray = toPath(startPath)
	const endPathArray = toPath(endPath)
	return getCommonPath(startPathArray, endPathArray)
}

const setNodeAtPath = (
	path: string | string[],
	node: Node | null,
	setNode: Node | null
): void => {
	const pathArray = Array.isArray(path) ? path : toPath(path)
	const parentPath = pathArray.slice(0, -1)
	const parentNode = (node as Collection)?.getIn(parentPath)
	if (!parentNode && parentPath.length > 0) {
		setNodeAtPath(parentPath, node, yaml.createNode({}))
	}
	;(node as Collection)?.setIn(pathArray, setNode)
}

const addNodeAtPath = (
	path: string | string[],
	node: Node | null,
	setNode: Node,
	index: number
): void => {
	const pathArray = Array.isArray(path) ? path : toPath(path)
	let parentNode = (node as Collection)?.getIn(pathArray)
	if (!parentNode && path.length > 0) {
		setNodeAtPath(path, node, yaml.createNode([]))
		parentNode = (node as Collection)?.getIn(pathArray)
	}
	parentNode.items.splice(index, 0, setNode)
}

const addNodePairAtPath = (
	path: string | string[],
	node: Node | null,
	setNode: Node,
	key: string
): void => {
	const pathArray = Array.isArray(path) ? path : toPath(path)
	const parentNode = (node as Collection)?.getIn(pathArray)
	parentNode
		? (node as Collection)?.addIn(pathArray, new Pair(key, setNode))
		: (node as Collection)?.setIn(pathArray, new Pair(key, setNode))
}

const removeNodeAtPath = (path: string | string[], node: Node | null): void => {
	const pathArray = Array.isArray(path) ? path : toPath(path)
	;(node as Collection)?.deleteIn(pathArray)
}

export {
	getNodeAtOffset,
	getNodeAtPath,
	setNodeAtPath,
	addNodeAtPath,
	addNodePairAtPath,
	removeNodeAtPath,
	getCommonAncestorPath,
	getPathFromPathArray,
	parse,
	newDoc,
}
