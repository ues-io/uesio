import toPath from "lodash/toPath"
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
	parentnode: Collection,
	path: string,
	includeKey?: boolean
): [Node | null, string] => {
	if (isInRange(offset, parentnode)) {
		const nodes = parentnode.items
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
	node: Collection | null,
	setNode: Node | null
): void => {
	const pathArray = Array.isArray(path) ? path : toPath(path)
	const parentPath = pathArray.slice(0, -1)
	const parentNode = node?.getIn(parentPath)
	if (!parentNode && parentPath.length > 0) {
		setNodeAtPath(parentPath, node, yaml.createNode({}))
	}
	node?.setIn(pathArray, setNode)
}

const addNodeAtPath = (
	path: string | string[],
	node: Collection | null,
	setNode: Node,
	index: number
): void => {
	const pathArray = Array.isArray(path) ? path : toPath(path)
	let parentNode = node?.getIn(pathArray)
	if (!parentNode && path.length > 0) {
		setNodeAtPath(path, node, yaml.createNode([]))
		parentNode = node?.getIn(pathArray)
	}
	parentNode.items.splice(index, 0, setNode)
}

const addNodePairAtPath = (
	path: string | string[],
	node: Collection | null,
	setNode: Node,
	key: string
): void => {
	const pathArray = Array.isArray(path) ? path : toPath(path)
	const hasParent = node?.hasIn(pathArray)
	if (hasParent) {
		const fullPathArray = pathArray.concat([key])
		const alreadyExists = node?.hasIn(fullPathArray)
		alreadyExists
			? node?.setIn(fullPathArray, setNode)
			: node?.addIn(pathArray, new Pair(key, setNode))
		return
	}
	node?.setIn(pathArray, new Pair(key, setNode))
}

const removeNodeAtPath = (
	path: string | string[],
	node: Collection | null
): void => {
	const pathArray = Array.isArray(path) ? path : toPath(path)
	node?.deleteIn(pathArray)
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
