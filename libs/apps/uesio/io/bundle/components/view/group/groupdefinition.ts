import { definition, builder } from "@uesio/ui"

type GroupDefinition = {
	columnGap: string
	alignItems: string
	justifyContent: string
	components?: definition.DefinitionList
}

interface GroupProps extends definition.BaseProps {
	definition: GroupDefinition
}

const GroupPropertyDefinition: builder.BuildPropertiesDefinition = {
	title: "Group",
	description: "Create a horizontal line of inline elements.",
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
			type: "SELECT",
			label: "Vertical alignment",
			options: [
				{
					label: "Start",
					value: "start",
				},
				{
					label: "Center",
					value: "center",
				},
				{
					label: "End",
					value: "end",
				},
			],
		},
		{
			name: "justifyContent",
			type: "SELECT",
			label: "Horizontal distribution",
			options: [
				{
					label: "Start",
					value: "start",
				},
				{
					label: "Center",
					value: "center",
				},
				{
					label: "Space between",
					value: "space-between",
				},
				{
					label: "Space around",
					value: "space-around",
				},
				{
					label: "Space evenly",
					value: "space-evenly",
				},
			],
		},
	],
	sections: [],
	actions: [],
	traits: ["uesio.standalone"],
	classes: ["root"],
	type: "component",
	category: "LAYOUT",
}
export { GroupProps, GroupDefinition }

export default GroupPropertyDefinition
