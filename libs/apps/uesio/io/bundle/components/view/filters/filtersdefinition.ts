import { definition, builder } from "@uesio/ui"

type FiltersDefinition = {
	fieldId: string
	wire: string
	filters: { field: string }[]
} & definition.BaseDefinition

interface FiltersProps extends definition.BaseProps {
	definition: FiltersDefinition
}

const FiltersPropertyDefinition: builder.BuildPropertiesDefinition = {
	title: "Filters",
	description: "Just a Filter",
	link: "https://docs.ues.io/",
	defaultDefinition: () => ({}),
	properties: [
		{
			name: "wire",
			type: "WIRE",
			label: "Wire",
		},
	],
	sections: [
		{
			name: "filters",
			type: "PROPLISTS",
			nameTemplate: "filter",
			nameFallback: "filter",
			title: "Filters",
			properties: [
				{
					name: "field",
					type: "FIELD",
					label: "field",
					wireField: "../../../wire",
				},
			],
		},
	],
	actions: [],
	type: "component",
	classes: ["root"],
	traits: ["uesio.standalone"],
}

export { FiltersProps, FiltersDefinition }

export default FiltersPropertyDefinition
