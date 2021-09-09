import { definition, builder, component } from "@uesio/ui"

type ResponsiveLayoutDefinition = {
	columnGap?: string
	justifyContent: string
	alignItems: string
}

interface ResponsiveLayoutProps extends definition.BaseProps {
	definition: ResponsiveLayoutDefinition
}

const spacingOptionsMap = [
	"center",
	"start",
	"end",
	"flex-start",
	"flex-end",
	"left",
	"right",
	"normal",
	"space-between",
	"space-around",
	"space-evenly",
	"stretch",
]

const spacingOptions = spacingOptionsMap.map((x) => ({ value: x, label: x }))

const ResponsiveLayoutPropertyDefinition: builder.BuildPropertiesDefinition = {
	title: "ResponsiveLayout",
	description: "ResponsiveLayout",
	link: "https://docs.ues.io/",
	defaultDefinition: () => ({
		columns: [
			{
				"io.column": {
					flexRatio: 1,
				},
			},
			{
				"io.column": {
					flexRatio: 1,
				},
			},
		],
	}),
	properties: [
		{
			name: "justifyContent",
			type: "SELECT",
			options: spacingOptions,
			label: "Justify Content",
		},
		{
			name: "alignItems",
			type: "SELECT",
			options: spacingOptions,
			label: "Align Items",
		},
	],
	sections: [],
	actions: [
		{
			label: "Run Signals",
			type: "ADD",
			slot: "columns",
			componentKey: "io.column",
		},
	],
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
