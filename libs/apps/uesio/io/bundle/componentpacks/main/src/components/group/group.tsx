import { component, styles, definition } from "@uesio/ui"
import { default as IOGroup } from "../../utilities/group/group"

type GroupDefinition = {
	columnGap: string
	alignItems: string
	justifyContent: string
	components?: definition.DefinitionList
}

const Grid: definition.UC<GroupDefinition> = (props) => {
	const { context, definition, path } = props
	const classes = styles.useStyles(
		{
			root: {},
		},
		props
	)
	return (
		<IOGroup
			classes={classes}
			columnGap={definition.columnGap}
			alignItems={definition.alignItems}
			justifyContent={definition.justifyContent}
			context={context}
		>
			<component.Slot
				definition={definition}
				listName="components"
				path={path}
				accepts={["uesio.standalone"]}
				context={context}
				direction="HORIZONTAL"
			/>
		</IOGroup>
	)
}

/*
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
				{
					label: "End",
					value: "end",
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
*/

export default Grid
