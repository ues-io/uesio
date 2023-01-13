import { FullPath } from "../api/stateapi"

const handleDrop = (
	dragNode: FullPath,
	dropNode: FullPath,
	dropIndex: number
): void => {
	console.log("diddrop", dragNode, dropNode, dropIndex)
	/*
	const [propDef] =
		component.registry.getPropertiesDefinitionFromPath(dragNode)

	api.builder.clearDragNode()
	api.builder.clearDropNode()

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
			const handler = dropPropDef?.handleFieldDrop
			if (handler) {
				handler(dragNode, dropNode, dropIndex, propDef)
			}
			break
		}
		case "component": {
			api.builder.addDefinition(
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
			api.builder.addDefinition(
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
			api.builder.moveDefinition(
				component.path.getParentPath(dragNode),
				toPath,
				key || undefined
			)
			break
		}
	}
	*/
}

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
	if (!dragNode) return false
	/*
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
	*/
	return false
}

export { handleDrop, isDropAllowed, isNextSlot }
