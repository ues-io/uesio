import { definition, builder } from "@uesio/ui"

type GroupDefinition = {
	columnGap: string
	alignItems: string
	components?: definition.DefinitionList
}

interface GroupProps extends definition.BaseProps {
	definition: GroupDefinition
}

const GroupPropertyDefinition: builder.BuildPropertiesDefinition = {
	title: "Group",
	description: "Group",
	link: "https://docs.ues.io/",
	defaultDefinition: () => ({ columnGap: "10px" }),
	properties: [
		{
			name: "columnGap",
			type: "TEXT",
			label: "Column Gap",
		},
		{
			name: "alignItems",
			type: "TEXT",
			label: "Align Items",
		},
	],
	sections: [],
	actions: [],
	traits: ["uesio.standalone"],
	classes: ["root"],
	type: "component",
}
export { GroupProps, GroupDefinition }

export default GroupPropertyDefinition
