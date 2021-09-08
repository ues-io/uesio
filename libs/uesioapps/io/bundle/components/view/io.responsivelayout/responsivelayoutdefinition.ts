import { definition, builder, component } from "@uesio/ui"

type ResponsiveLayoutDefinition = {
	columnGap?: string
}

interface ResponsiveLayoutProps extends definition.BaseProps {
	definition: ResponsiveLayoutDefinition
}

const ResponsiveLayoutPropertyDefinition: builder.BuildPropertiesDefinition = {
	title: "ResponsiveLayout",
	description: "ResponsiveLayout",
	link: "https://docs.ues.io/",
	defaultDefinition: () => ({}),
	properties: [
		{
			name: "columnCount",
			type: "NUMBER",
			label: "columns",
		},
	],
	sections: [],
	actions: [],
	traits: ["uesio.standalone"],
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
export { ResponsiveLayoutProps, ResponsiveLayoutDefinition }

export default ResponsiveLayoutPropertyDefinition
