import { FunctionComponent } from "react"

import { component, styles, hooks } from "@uesio/ui"
import { Props } from "./tabsdefinition"

const TabLabels = component.getUtility("uesio/io.tablabels")

const Tabs: FunctionComponent<Props> = (props) => {
	const { definition, context, path } = props
	const classes = styles.useStyles(
		{
			root: {},
			content: {},
			tabLabels: {},
			tab: {},
			tabSelected: {},
		},
		props
	)
	const uesio = hooks.useUesio(props)

	const componentId = uesio.component.getId(definition.id)

	const [selectedTabId, setSelectedTab] = uesio.component.useState<string>(
		"tabs",
		componentId
	)
	const tabs = definition.tabs ? definition.tabs : []
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
				selectedTab={selectedTab && selectedTab.id}
				setSelectedTab={setSelectedTab}
				tabs={tabs}
				context={context}
			/>

			<div className={classes.content}>
				<component.Slot
					definition={selectedTab}
					listName="components"
					path={`${path}["tabs"]["${selectedIndex}"]`}
					accepts={["uesio.standalone"]}
					context={context}
				/>
				<component.Slot
					definition={definition}
					listName="footer"
					path={path}
					accepts={["uesio.standalone"]}
					context={context}
				/>
			</div>
		</div>
	)
}

export default Tabs
