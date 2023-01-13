import { component, styles, api, definition } from "@uesio/ui"
import TabLabels from "../../utilities/tablabels/tablabels"

type TabDefinition = {
	id: string
	label: string
	components: definition.DefinitionList
}

type TabsDefinition = {
	id?: string
	tabs?: TabDefinition[]
	footer?: definition.DefinitionList
}

const Tabs: definition.UC<TabsDefinition> = (props) => {
	const { definition, context, path } = props
	const classes = styles.useStyles(
		{
			root: {},
			content: {},
			tabLabels: {},
			tab: {},
			tabSelected: {},
			footer: {},
		},
		props
	)

	const componentId = api.component.getComponentIdFromProps(
		definition.id,
		props
	)

	const [selectedTabId, setSelectedTab] = api.component.useState<string>(
		"tabs",
		componentId
	)
	const tabs = definition.tabs || []
	const foundIndex = tabs.findIndex((tab) => tab.id === selectedTabId)
	const selectedIndex = foundIndex === -1 ? 0 : foundIndex
	const selectedTab = tabs[selectedIndex]

	return (
		<div className={classes.root}>
			<TabLabels
				classes={{
					root: classes.tabLabels,
					tab: classes.tab,
					tabSelected: classes.tabSelected,
				}}
				selectedTab={selectedTab?.id}
				setSelectedTab={setSelectedTab}
				tabs={tabs}
				context={context}
			/>
			<div className={classes.content}>
				<component.Slot
					definition={selectedTab}
					listName="components"
					path={`${path}["tabs"]["${selectedIndex}"]`}
					context={context}
					label={selectedTab?.label}
				/>
			</div>
			<div className={classes.footer}>
				<component.Slot
					definition={definition}
					listName="footer"
					path={path}
					label="footer"
					context={context}
				/>
			</div>
		</div>
	)
}

/*
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
*/

export default Tabs
