import React from "react"
import { hooks } from "@uesio/ui"

export function getOnDragStartToolbar(uesio: hooks.Uesio) {
	const viewMode = uesio.builder.useView()
	const contentView = viewMode === "contentview"
	return (e: React.DragEvent) => {
		const target = e.target as HTMLDivElement
		if (target && target.dataset.type && !contentView) {
			uesio.builder.setDragNode(target.dataset.type)
		}
	}
}
export function getOnDragStopToolbar(uesio: hooks.Uesio) {
	return () => {
		uesio.builder.setDragNode("")
		uesio.builder.setDropNode("")
	}
}
