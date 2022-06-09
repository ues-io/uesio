import { hooks, component, util } from "@uesio/ui"

const handleDrop = (
	dragNode: string,
	dropNode: string,
	dropIndex: number,
	uesio: hooks.Uesio
): void => {
	const [propDef] =
		component.registry.getPropertiesDefinitionFromPath(dragNode)

	uesio.builder.clearDragNode()
	uesio.builder.clearDropNode()

	if (!propDef) {
		console.log("No prop def found")
		return
	}

	const [metadataType, metadataItem] =
		component.path.getFullPathParts(dragNode)

	switch (metadataType) {
		case "field": {
			const [dropPropDef] =
				component.registry.getPropertiesDefinitionFromPath(dropNode)
			if (!dropPropDef) return

			const [, , path] = component.path.getFullPathParts(dropNode)
			const viewDef = uesio.getContext().getViewDef()
			const wireInDef = util.get(viewDef, path).wire
			const [, , , , wirename] =
				component.path.parseFieldKey(metadataItem)

			// The wire of the parent does not match the wire of the dragged field
			if (wireInDef && wireInDef !== wirename) {
				uesio.notification.addError(
					"That field doesn't belong to this table's wire"
				)
				return
			}
			// If we don't have a wire set, but the parent has a wire option
			// ==> assume we can set the wire value to the field's wire
			!wireInDef &&
				dropPropDef.properties?.find((el) => el.name === "wire")
			uesio.builder.setDefinition(dropNode + '["wire"]', wirename)
			//

			const handler = dropPropDef.handleFieldDrop
			if (handler) {
				handler(dragNode, dropNode, dropIndex, propDef, uesio)
			}
			break
		}
		case "component": {
			uesio.builder.addDefinition(
				dropNode,
				{
					[`${propDef.namespace}.${propDef.name}`]:
						propDef.defaultDefinition(),
				},
				dropIndex,
				metadataType
			)
			break
		}
		case "componentvariant": {
			const [, , variantNamespace, variantName] =
				component.path.parseVariantKey(metadataItem)
			uesio.builder.addDefinition(
				dropNode,
				{
					[`${propDef.namespace}.${propDef.name}`]: {
						...propDef.defaultDefinition(),
						...{
							[`uesio.variant`]:
								variantNamespace + "." + variantName,
						},
					},
				},
				dropIndex,
				metadataType
			)
			break
		}
		case "viewdef": {
			const key = component.path.getKeyAtPath(dragNode)
			const toPath = `${dropNode}["${dropIndex}"]`
			// Selection Handling
			uesio.builder.moveDefinition(
				component.path.getParentPath(dragNode),
				toPath,
				key || undefined
			)
			break
		}
	}
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
	const [propDef] =
		component.registry.getPropertiesDefinitionFromPath(dragNode)
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
