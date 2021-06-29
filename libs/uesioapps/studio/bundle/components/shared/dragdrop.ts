import { hooks, component, builder } from "@uesio/ui"
import { DragEvent } from "react"

const isExistingComponent = (dragNode: string): boolean =>
	!component.dragdrop.isComponentBankKey(dragNode) &&
	!component.dragdrop.isFieldBankKey(dragNode)

function getDropHandler(dragNode: string) {
	if (component.dragdrop.isFieldBankKey(dragNode)) {
		return handleFieldDrop
	} else if (component.dragdrop.isComponentBankKey(dragNode)) {
		return handleBankDrop
	}
	return handleExistingDrop
}

const handleDrop = (
	dragNode: string,
	dropNode: string,
	dropIndex: number,
	uesio: hooks.Uesio
): void => {
	const propDef =
		component.dragdrop.getPropertiesDefinitionFromDragNode(dragNode)

	uesio.builder.setDragNode("")
	uesio.builder.setDropNode("")

	if (!propDef) {
		console.log("No prop def found")
		return
	}

	const handler = getDropHandler(dragNode)

	handler(dragNode, dropNode, dropIndex, propDef, uesio)
}

const isNextSlot = (
	bounds: DOMRect,
	direction: string,
	pageX: number,
	pageY: number
): boolean => {
	const halfWay =
		direction === "horizontal"
			? bounds.x + window.scrollX + bounds.width / 2
			: bounds.y + window.scrollY + bounds.height / 2
	const position = direction === "horizontal" ? pageX : pageY
	return position >= halfWay
}

const isDropAllowed = (accepts: string[], dragNode: string): boolean => {
	const propDef =
		component.dragdrop.getPropertiesDefinitionFromDragNode(dragNode)
	if (propDef) {
		// The component should always have the trait of its name
		const traits = (propDef?.traits || []).concat([
			`${propDef.namespace}.${propDef.name}`,
		])

		for (const trait of traits) {
			if (accepts.includes(trait)) {
				return true
			}
		}
	}
	return false
}

const handleBankDrop = (
	dragNode: string,
	dropNode: string,
	dropIndex: number,
	propDef: builder.BuildPropertiesDefinition,
	uesio: hooks.Uesio
): void => {
	uesio.view.addDefinition(
		dropNode,
		{
			[`${propDef.namespace}.${propDef.name}`]:
				propDef.defaultDefinition(),
		},
		dropIndex,
		true
	)
}

const handleFieldDrop = (
	dragNode: string,
	dropNode: string,
	dropIndex: number,
	propDef: builder.BuildPropertiesDefinition,
	uesio: hooks.Uesio
): void => {
	const dropPropDef =
		component.registry.getPropertiesDefinitionFromPath(dropNode)
	const handler = dropPropDef?.handleFieldDrop
	if (handler) {
		return handler(dragNode, dropNode, dropIndex, propDef, uesio)
	}
}

const handleExistingDrop = (
	dragNode: string,
	dropNode: string,
	dropIndex: number,
	propDef: builder.BuildPropertiesDefinition,
	uesio: hooks.Uesio
): void => {
	const pathArray = component.path.toPath(dragNode)
	const key = pathArray[pathArray.length - 1]
	const toPath = `${dropNode}["${dropIndex}"]["${key}"]`
	// Selection Handling
	uesio.view.moveDefinition(dragNode, toPath)
}

const getDropIndex = (
	dragNode: string,
	dropNode: string,
	dropIndex: number
): number => {
	if (isExistingComponent(dragNode)) {
		const dragIndex = component.path.getIndexFromPath(dragNode)
		// The parent path is actually the grandparent path here.
		const dragParentPath = component.path.getGrandParentPath(dragNode)
		// Only continue if we are children of the same parent
		if ((dragIndex || dragIndex === 0) && dragParentPath === dropNode) {
			if (dragIndex < dropIndex) {
				return dropIndex - 1
			}
		}
	}
	return dropIndex
}

const getOnDragStartToolbar = (uesio: hooks.Uesio) => {
	const isStructureView = uesio.builder.useIsStructureView()
	return (e: DragEvent) => {
		const target = e.target as HTMLDivElement
		if (target && target.dataset.type && isStructureView) {
			uesio.builder.setDragNode(target.dataset.type)
		}
	}
}
const getOnDragStopToolbar = (uesio: hooks.Uesio) => () => {
	uesio.builder.setDragNode("")
	uesio.builder.setDropNode("")
}

export {
	handleDrop,
	getDropIndex,
	isDropAllowed,
	isNextSlot,
	getOnDragStartToolbar,
	getOnDragStopToolbar,
}
