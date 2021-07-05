import { definition, builder } from "@uesio/ui"

type GroupDefinition = {
	columnGap: string
	components?: definition.DefinitionList
}

interface GroupProps extends definition.BaseProps {
	definition: GroupDefinition
}

const GroupPropertyDefinition: builder.BuildPropertiesDefinition = {
	title: "Group",
	defaultDefinition: () => ({ columnGap: "10px" }),
	properties: [
		{
			name: "columnGap",
			type: "TEXT",
			label: "Column Gap",
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
