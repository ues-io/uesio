import { FullPath } from "../api/path"

const isNextSlot = (
	bounds: DOMRect,
	direction: "HORIZONTAL" | "VERTICAL",
	pageX: number,
	pageY: number
): boolean => {
	const halfWay =
		direction === "HORIZONTAL"
			? bounds.x + window.scrollX + bounds.width / 2
			: bounds.y + window.scrollY + bounds.height / 2
	const position = direction === "HORIZONTAL" ? pageX : pageY
	return position >= halfWay
}

const isDropAllowed = (accepts: string[], dragNode: FullPath): boolean => {
	for (const accept of accepts) {
		if (accept === dragNode.itemType) return true
	}
	return false
}

export { isDropAllowed, isNextSlot }
