import toPath from "lodash/toPath"
import yaml, { Pair, Node, YAMLMap, ParsedNode } from "yaml"
// const YAML_OPTIONS = {
// 	simpleKeys: true,
// 	keepNodeTypes: false, // deprecated in yaml v2 I think
// }

/**
 * In order to work with YAML features not directly supported by native JavaScript data types, such as comments, anchors and aliases, yaml provides the Document API.
 * more info:https://eemeli.org/yaml/#documents
 */
const newDoc = (val: any) => new yaml.Document(val)
/**
 * will directly produce native JavaScript If you'd like to retain the comments and other metadata use `parseDocument()` instead
 */
const parse = (str: string) => yaml.parse(str)
/**
 * will produce Document instances that allow for further processing.
 */
const parseDocument = (str: string) => yaml.parseDocument(str)
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
	parentnode: any, // TODO: get proper type, it used to be "Collection" for the old yaml parser
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

/**
 * Gives value at path from yaml Document
 * @param path - string or string array
 * @param Object - The yaml Document
 * @return yaml Document
 */
const getNodeAtPath = (path: string | string[], node: yaml.Document): any => {
	const pathArray = makePathArray(path)
	return node?.getIn(pathArray, true)
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
	doc: yaml.Document,
	setNode: Node | null
): void => {
	const pathArray = makePathArray(path)
	doc.setIn(pathArray, setNode)
}

/**
 * Adds a node to the yaml definition
 */
const addNodeAtPath = (
	path: string | string[],
	doc: yaml.Document,
	setNode: Node,
	index: number
): void => {
	const pathArray = makePathArray(path)
	// Get the parent
	const parentNode: any = doc.getIn([...pathArray])

	// We're nesting the new node if
	if (!parentNode) return doc.addIn([...pathArray, index], setNode)

	// might be better solution here: https://eemeli.org/yaml/#modifying-nodes
	const parent = parentNode.toJSON()
	parent.splice(index, 0, setNode.toJSON())

	const newNode = doc.createNode(parent)
	doc.setIn([...pathArray], newNode)
}

const addNodePairAtPath = (
	path: string | string[],
	node: yaml.Document | null,
	setNode: Node,
	key: string
): void => {
	const pathArray = makePathArray(path)
	const hasParent = node?.hasIn(pathArray)
	if (hasParent) {
		const fullPathArray = pathArray.concat([key])
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
const removeNodeAtPath = (
	path: string | string[],
	node: yaml.Document | null
): void => {
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
	parseDocument,
	newDoc,
}
