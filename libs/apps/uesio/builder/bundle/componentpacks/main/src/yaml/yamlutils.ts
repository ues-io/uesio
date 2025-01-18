import toPath from "lodash/toPath"
import yaml, { Node } from "yaml"

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
  includeKey?: boolean,
): [Node | null, string] => {
  if (isInRange(offset, parentnode)) {
    if (yaml.isCollection(parentnode)) {
      const nodes = parentnode.items
      let index = 0
      if (!nodes) {
        return [parentnode, path]
      }
      for (const node of nodes) {
        if (yaml.isPair(node) && yaml.isScalar(node.key)) {
          if (isInRange(offset, node.key)) {
            return includeKey
              ? [node.key, path + '["' + node.key + '"]']
              : [parentnode, path]
          }
        }

        if (yaml.isPair(node) && yaml.isCollection(node.value)) {
          const [foundNode, foundPath] = getNodeAtOffset(
            offset,
            node.value,
            path + '["' + node.key + '"]',
            includeKey,
          )
          if (foundNode) {
            return [foundNode, foundPath]
          }
        }
        if (yaml.isMap(node)) {
          const [foundNode, foundPath] = getNodeAtOffset(
            offset,
            node,
            path + '["' + index + '"]',
            includeKey,
          )
          if (foundNode) {
            return [foundNode, foundPath]
          }
        }
        if (yaml.isSeq(node)) {
          const [foundNode, foundPath] = getNodeAtOffset(
            offset,
            node,
            path + '["' + index + '"]',
            includeKey,
          )
          if (foundNode) {
            return [foundNode, foundPath]
          }
        }
        index++
      }
      return [parentnode, path]
    }
    return [parentnode, path]
  }
  return [null, path]
}

const getNodeAtPath = (path: string | string[], node: Node | null) => {
  if (!yaml.isCollection(node)) throw new Error("Node must be a collection")
  return (node?.getIn(makePathArray(path), true) as Node | null) || null
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
  endPath: string,
): string[] => {
  const startPathArray = toPath(startPath)
  const endPathArray = toPath(endPath)
  return getCommonPath(startPathArray, endPathArray)
}

const getParentPathArray = (pathArray: string[]) => pathArray.slice(0, -1)

const fixFlow = (
  pathArray: string[],
  node: yaml.YAMLMap<unknown, unknown> | yaml.YAMLSeq<unknown>,
) => {
  if (pathArray.length) {
    const fixNode = node.getIn(pathArray) as
      | yaml.YAMLMap<unknown, unknown>
      | yaml.YAMLSeq<unknown>
    if (fixNode === null) {
      // This is somewhat counter-intuitive, but we want to
      // remove any null nodes so that they can be converted
      // to the appropriate sequence or map by the addIn utility.
      node.deleteIn(pathArray)
      return
    }
    fixNode && fixNode.flow && (fixNode.flow = false)
    fixFlow(getParentPathArray(pathArray), node)
  }
}

const setNodeAtPath = (
  path: string | string[],
  node: Node | null,
  setNode: Node | null,
) => {
  if (!yaml.isCollection(node)) throw new Error("Node must be a collection")
  const pathArray = makePathArray(path)
  fixFlow(pathArray, node)
  node.setIn(makePathArray(path), setNode)
}

const addNodeAtPath = (
  path: string | string[],
  node: Node | null,
  setNode: Node,
  index = 0,
) => {
  if (!yaml.isCollection(node)) throw new Error("Node must be a collection")
  const pathArray = makePathArray(path)
  // Get the parent and insert node at desired position,
  // if no parent.. ("components" or "items"). addIn will create it for us.
  const parentNode = node.getIn(pathArray) as yaml.YAMLSeq
  fixFlow(pathArray, node)

  if (!parentNode) {
    node.addIn(pathArray, [setNode])
    return
  }

  const startIndex = index >= 0 ? index : parentNode.items.length + index + 1
  parentNode.items.splice(startIndex, 0, setNode)
}

const removeNodeAtPath = (path: string | string[], node: Node | null): void => {
  if (!yaml.isCollection(node)) throw new Error("Node must be a collection")
  node?.deleteIn(makePathArray(path))
}

export {
  getNodeAtOffset,
  getNodeAtPath,
  setNodeAtPath,
  addNodeAtPath,
  removeNodeAtPath,
  getCommonAncestorPath,
  getPathFromPathArray,
  getParentPathArray,
  parse,
  newDoc,
  yaml as lib,
}
