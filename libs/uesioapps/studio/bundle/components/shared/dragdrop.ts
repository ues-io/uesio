import { hooks, component } from "@uesio/ui"

const handleDrop = (
	dragNode: string,
	dropNode: string,
	dropIndex: number,
	uesio: hooks.Uesio
): void => {
	const [metadataType, metadataItemWithVariant] =
		component.path.getFullPathParts(dragNode)

	const [componentNamespace, componentName, variantNamespace, variantName] =
		component.path.parseVariantKey(metadataItemWithVariant)

	const fullPath = component.path.makeFullPath(
		metadataType,
		componentNamespace + "." + componentName,
		""
	)

	const propDef = component.registry.getPropertiesDefinitionFromPath(fullPath)
	uesio.builder.clearDragNode()
	uesio.builder.clearDropNode()

	if (!propDef) {
		console.log("No prop def found")
		return
	}

	switch (metadataType) {
		case "field": {
			const dropPropDef =
				component.registry.getPropertiesDefinitionFromPath(dropNode)
			const handler = dropPropDef?.handleFieldDrop
			if (handler) {
				handler(dragNode, dropNode, dropIndex, propDef, uesio)
			}
			break
		}
		case "component": {
			const defaultDef = propDef.defaultDefinition()
			const withVariant = !!variantNamespace && !!variantName
			const defwithVariant = {
				...defaultDef,
				...(withVariant
					? {
							[`uesio.variant`]:
								variantNamespace + "." + variantName,
					  }
					: {}),
			}

			uesio.builder.addDefinition(
				dropNode,
				{
					[`${propDef.namespace}.${propDef.name}`]: defwithVariant,
				},
				dropIndex,
				metadataType
			)
			break
		}
		case "viewdef": {
			const key = component.path.getKeyAtPath(dragNode)
			const toPath = `${dropNode}["${dropIndex}"]["${key}"]`
			// Selection Handling
			uesio.builder.moveDefinition(dragNode, toPath)
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
	const [metadataType, metadataItemWithVariant] =
		component.path.getFullPathParts(dragNode)

	const [componentNamespace, componentName] = component.path.parseVariantKey(
		metadataItemWithVariant
	)

	const fullPath = component.path.makeFullPath(
		metadataType,
		componentNamespace + "." + componentName,
		""
	)
	const propDef = component.registry.getPropertiesDefinitionFromPath(fullPath)

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
