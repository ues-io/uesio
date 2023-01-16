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

	pathCombine = () =>
		`["${this.itemType}"]["${this.itemName}"]${this.localPath}`

	equals = (path: FullPath) =>
		this.itemType === path.itemType &&
		this.itemName === path.itemName &&
		this.localPath === path.localPath

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
			this.localPath + `["${addition}"]`
		)

	pop = (): [string | undefined, FullPath] => {
		const pathArray = toPath(this.localPath)
		const value = pathArray.pop()
		return [
			value,
			new FullPath(
				this.itemType,
				this.itemName,
				component.path.fromPath(pathArray)
			),
		]
	}

	popIndex = (): [number, FullPath] => {
		const [numString, newPath] = this.pop()
		if (!numString || !component.path.isNumberIndex(numString))
			throw new Error(
				"Invalid Index in Path: " +
					newPath.combine() +
					" : " +
					numString
			)
		return [parseInt(numString, 10) || 0, newPath]
	}

	parent = () =>
		new FullPath(
			this.itemType,
			this.itemName,
			component.path.getParentPath(this.localPath)
		)

	nextSibling = () => {
		const [index, rest] = this.popIndex()
		return new FullPath(
			this.itemType,
			this.itemName,
			`${rest.localPath}["${index + 1}"]`
		)
	}

	isSet = () => this.itemType && this.itemName
}

const parseFullPath = (fullPath: string | undefined) => {
	const [itemType, itemName, localPath] = (fullPath || "").split(":")
	return new FullPath(itemType, itemName, localPath)
}

const combinePath = (path?: FullPath) => (path ? path.combine() : "::")

export { parseFullPath, combinePath, FullPath }
