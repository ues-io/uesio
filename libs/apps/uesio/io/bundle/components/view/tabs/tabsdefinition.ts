import { definition, builder } from "@uesio/ui"

type TabsDefinition = {
	id?: string
	tabs?: {
		id: string
		label: string
		components: definition.DefinitionList
	}[]
	footer?: definition.DefinitionList
} & definition.BaseDefinition

interface Props extends definition.BaseProps {
	definition: TabsDefinition
}

const PropertyDefinition: builder.BuildPropertiesDefinition = {
	title: "Tabs",
	description: "Organized view content in to tabbed sections",
	link: "https://docs.ues.io/",
	defaultDefinition: () => ({}),
	properties: [],
	sections: [
		{
			type: "PROPLISTS",
			name: "tabs",
			nameFallback: "tab",
			nameTemplate: "${label}",
			title: "Tabs",
			properties: [
				{
					name: "id",
					type: "TEXT",
					label: "ID",
				},
				{
					name: "label",
					type: "TEXT",
					label: "Label",
				},
			],
		},
	],
	actions: [],
	traits: ["uesio.standalone"],
	classes: ["root", "content", "tabLabels", "tab", "tabSelected", "footer"],
	type: "component",
	category: "LAYOUT",
}
export { Props, TabsDefinition }

export default PropertyDefinition
