import { hooks, component, builder } from "@uesio/ui"

function getDropHandler(dragNode: string) {
	const [metadataType] = component.path.getFullPathParts(dragNode)
	if (metadataType === "field") {
		return handleFieldDrop
	} else if (metadataType === "component") {
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
	const propDef = component.registry.getPropertiesDefinitionFromPath(dragNode)

	uesio.builder.clearDragNode()
	uesio.builder.clearDropNode()

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
	const propDef = component.registry.getPropertiesDefinitionFromPath(dragNode)
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
	uesio.builder.addDefinition(
		dropNode,
		{
			[`${propDef.namespace}.${propDef.name}`]:
				propDef.defaultDefinition(),
		},
		dropIndex
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
	const key = component.path.getKeyAtPath(dragNode)
	const toPath = `${dropNode}["${dropIndex}"]["${key}"]`
	// Selection Handling
	uesio.builder.moveDefinition(dragNode, toPath)
}

const getDropIndex = (
	dragNode: string,
	dropNode: string,
	dropIndex: number
): number => {
	const [metadataType] = component.path.getFullPathParts(dragNode)
	if (metadataType === "viewdef") {
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
