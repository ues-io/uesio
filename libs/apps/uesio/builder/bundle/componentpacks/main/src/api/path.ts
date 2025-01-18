import { component } from "@uesio/ui"
import toPath from "lodash/toPath"

class FullPath {
  constructor(itemType?: string, itemName?: string, localPath?: string) {
    this.itemType = itemType || ""
    this.itemName = itemName || ""
    this.localPath = localPath || ""
  }

  itemType: string
  itemName: string
  localPath: string

  combine = () => [this.itemType, this.itemName, this.localPath].join(":")

  equals = (path: FullPath) =>
    this.itemType === path.itemType &&
    this.itemName === path.itemName &&
    this.localPath === path.localPath

  isSameItem = (path: FullPath) =>
    this.itemType === path.itemType && this.itemName === path.itemName

  startsWith = (path: FullPath) =>
    this.itemType === path.itemType &&
    this.itemName === path.itemName &&
    this.localPath.startsWith(path.localPath)

  setLocal = (localPath: string) =>
    new FullPath(this.itemType, this.itemName, localPath)

  addLocal = (addition: string) =>
    new FullPath(
      this.itemType,
      this.itemName,
      this.localPath + `["${addition}"]`,
    )

  merge = (path: FullPath) =>
    new FullPath(this.itemType, this.itemName, this.localPath + path.localPath)

  pop = (): [string | undefined, FullPath] => {
    const pathArray = toPath(this.localPath)
    const value = pathArray.pop()
    return [
      value,
      new FullPath(
        this.itemType,
        this.itemName,
        component.path.fromPath(pathArray),
      ),
    ]
  }

  shift = (): [string | undefined, FullPath] => {
    const pathArray = toPath(this.localPath)
    const value = pathArray.shift()
    return [
      value,
      new FullPath(
        this.itemType,
        this.itemName,
        component.path.fromPath(pathArray),
      ),
    ]
  }

  popIndex = (): [number, FullPath] => {
    const [numString, newPath] = this.pop()
    if (!numString || !component.path.isNumberIndex(numString))
      throw new Error(
        "Invalid Index in Path: " + newPath.combine() + " : " + numString,
      )
    return [parseInt(numString, 10) || 0, newPath]
  }

  popIndexAndType = (): [string, number, FullPath] => {
    const [componentType, parentPath] = this.pop()
    if (!componentType) throw new Error("Invalid component path")
    const [index, newPath] = parentPath.popIndex()
    return [componentType, index, newPath]
  }

  parent = () =>
    new FullPath(
      this.itemType,
      this.itemName,
      component.path.getParentPath(this.localPath),
    )

  isSet = () => !!(this.itemType && this.itemName)

  clone = () => new FullPath(this.itemType, this.itemName, this.localPath)

  getBase = () => new FullPath(this.itemType, this.itemName, "")

  // Trims any path to the last element that is fully namespaced
  // (meaning the path element contains a dot)
  trim = (): FullPath => {
    const pathArray = component.path.toPath(this.localPath)
    const size = pathArray.length
    if (size === 0) {
      return this.clone()
    }
    const nextItem = pathArray[size - 1]
    if (component.path.isComponentIndex(nextItem)) {
      return this.clone()
    }
    const [, rest] = this.pop()
    return rest.trim()
  }

  trimToSize = (size: number) => {
    const pathArray = component.path.toPath(this.localPath)
    if (pathArray.length > size) {
      return new FullPath(
        this.itemType,
        this.itemName,
        component.path.fromPath(pathArray.slice(0, size)),
      )
    }
    return this
  }

  size = () => component.path.toPath(this.localPath).length
}

const parseFullPath = (fullPath: string | undefined) => {
  const [itemType, itemName, localPath] = (fullPath || "").split(":")
  return new FullPath(itemType, itemName, localPath)
}

const combinePath = (path?: FullPath) => (path ? path.combine() : "::")

export { parseFullPath, combinePath, FullPath }
