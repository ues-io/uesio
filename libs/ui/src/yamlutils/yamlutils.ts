import toPath from "lodash/toPath"
import yaml, { Pair, Node, YAMLMap } from "yaml"

const newDoc = () => new yaml.Document<yaml.Node>()
const parse = (str: string) => yaml.parseDocument(str)

/**
 * Gives the path array for traversing the yamlDoc
 */
const makePathArray = (path: string | string[]): string[] =>
	Array.isArray(path) ? path : toPath(path)

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
		if (yaml.isCollection(parentnode)) {
			const nodes = parentnode.items
			let index = 0
			if (!nodes) {
				return [parentnode, path]
			}
			for (const node of nodes) {
				if (
					yaml.isPair(node) &&
					yaml.isScalar(node.key) &&
					yaml.isNode(node.value)
				) {
					if (node.key && isInRange(offset, node.key)) {
						return includeKey
							? [node.key, path + '["' + node.key + '"]']
							: [parentnode, path]
					}
					if (node.key && node.value) {
						const [foundNode, foundPath] = getNodeAtOffset(
							offset,
							node.value,
							path + '["' + node.key + '"]',
							includeKey
						)
						if (foundNode) {
							return [foundNode, foundPath]
						}
					}
					const [foundNode, foundPath] = getNodeAtOffset(
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
			}
			return [parentnode, path]
		}
		return [parentnode, path]
	}
	return [null, path]
}

/**
 * Gives value at path from yaml Document
 * @param path - string or string array
 * @param Object - The yaml Document
 * @return yaml Document
 */
const getNodeAtPath = (
	path: string | string[],
	node: Node | null
): Node | null => {
	if (!yaml.isCollection(node)) {
		throw new Error("Node must be a collection")
	}
	const pathArray = makePathArray(path)
	return (node?.getIn(pathArray, true) as Node) || (null as Node | null)
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
	if (!yaml.isCollection(node)) {
		throw new Error("Node must be a collection")
	}
	const pathArray = makePathArray(path)
	node.setIn(pathArray, setNode)
}

/**
 * Adds a node to the yaml definition.
 */
const addNodeAtPath = (
	path: string | string[],
	doc: yaml.Document,
	setNode: Node,
	index: number
): void => {
	const pathArray = makePathArray(path)
	// Get the parent and insert node at desired position,
	// if no parent.. ("components" or "items"). addIn will create it for us.
	const parentNode = doc.getIn([...pathArray]) as yaml.YAMLSeq
	parentNode
		? parentNode.items.splice(index, 0, setNode)
		: doc.addIn([...pathArray], [setNode])
}

const addNodePairAtPath = (
	path: string | string[],
	node: Node | null,
	setNode: Node,
	key: string
): void => {
	if (!yaml.isCollection(node)) {
		throw new Error("Node must be a collection")
	}
	const pathArray = makePathArray(path)
	const hasParent = node?.hasIn(pathArray)
	if (hasParent) {
		const fullPathArray = [...pathArray, key]
		const alreadyExists = node?.hasIn(fullPathArray)
		const parentNode = node?.getIn(pathArray)
		if (!parentNode) {
			node?.setIn(pathArray, new YAMLMap())
		}
		alreadyExists
			? node?.setIn(fullPathArray, setNode)
			: node?.addIn(pathArray, new Pair(key, setNode))
		return
	}
	node?.setIn(pathArray, new YAMLMap())
	node?.addIn(pathArray, new Pair(key, setNode))
}

/**
 * Removes a node from the yaml definition
 */
const removeNodeAtPath = (path: string | string[], node: Node | null): void => {
	if (!yaml.isCollection(node)) {
		throw new Error("Node must be a collection")
	}
	const pathArray = makePathArray(path)
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
