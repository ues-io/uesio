import { hooks, component, builder } from "@uesio/ui"

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
	const propDef = component.dragdrop.getPropertiesDefinitionFromDragNode(
		dragNode
	)

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
	const propDef = component.dragdrop.getPropertiesDefinitionFromDragNode(
		dragNode
	)
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
	//TODO:: JAS HERE
	uesio.view.addDefinition(
		dropNode,
		{
			[`${propDef.namespace}.${propDef.name}`]: propDef.defaultDefinition(),
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
	const dropPropDef = component.registry.getPropertiesDefinitionFromPath(
		dropNode
	)
	//TODO:: JAS HERE
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
	const fromPath = component.path.getParentPath(dragNode)
	const toPath = `${dropNode}["${dropIndex}"]`
	// Selection Handling
	uesio.view.moveDefinition(fromPath, toPath)
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

export { handleDrop, getDropIndex, isDropAllowed, isNextSlot }
