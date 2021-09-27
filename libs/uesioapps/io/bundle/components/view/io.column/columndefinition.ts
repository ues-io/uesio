import { builder, component } from "@uesio/ui"

const ColumnPropertyDefinition: builder.BuildPropertiesDefinition = {
	title: "Column",
	description: "The backbone for layouts",
	link: "https://docs.ues.io/",
	defaultDefinition: () => ({}),
	sections: [],
	traits: [],
	classes: ["root"],
	type: "component",
	handleFieldDrop: (dragNode, dropNode, dropIndex, propDef, uesio) => {
		const [metadataType, metadataItem] =
			component.path.getFullPathParts(dragNode)
		if (metadataType === "field") {
			const [, , fieldNamespace, fieldName] =
				component.path.parseFieldKey(metadataItem)
			uesio.builder.addDefinition(
				dropNode,
				{
					"io.field": {
						fieldId: `${fieldNamespace}.${fieldName}`,
					},
				},
				dropIndex
			)
		}
	},
}

export default ColumnPropertyDefinition
