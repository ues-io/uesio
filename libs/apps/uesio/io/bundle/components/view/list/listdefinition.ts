import { definition, builder, context, component } from "@uesio/ui"

type ListDefinition = {
	id: string
	wire: string
	mode: context.FieldMode
}

interface ListProps extends definition.BaseProps {
	definition: ListDefinition
}

const ListPropertyDefinition: builder.BuildPropertiesDefinition = {
	title: "List",
	description:
		"Iterate over records in a wire and render content in the context of each record.",
	link: "https://docs.ues.io/",
	defaultDefinition: () => ({ id: "NewId", mode: "READ" }),
	properties: [
		{
			type: "COMPONENT_ID",
			label: "Id",
			name: "id",
		},
		{
			name: "wire",
			type: "WIRE",
			label: "Wire",
		},
		{
			name: "mode",
			type: "SELECT",
			label: "Mode",
			options: [
				{
					value: "READ",
					label: "Read",
				},
				{
					value: "EDIT",
					label: "Edit",
				},
			],
		},
	],
	handleFieldDrop: (dragNode, dropNode, dropIndex, propDef, uesio) => {
		const [metadataType, metadataItem] =
			component.path.getFullPathParts(dragNode)
		if (metadataType === "field") {
			const [, , fieldNamespace, fieldName] =
				component.path.parseFieldKey(metadataItem)
			uesio.builder.addDefinition(
				dropNode,
				{
					"uesio/io.field": {
						fieldId: `${fieldNamespace}.${fieldName}`,
					},
				},
				dropIndex
			)
		}
	},
	sections: [],
	actions: [],
	traits: ["uesio.standalone"],
	type: "component",
	classes: ["root"],
	category: "DATA",
}
export { ListProps, ListDefinition }

export default ListPropertyDefinition
