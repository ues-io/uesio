import { FunctionComponent } from "react"

import { component, styles, hooks } from "@uesio/ui"
import { Props } from "./tabsdefinition"

const TabLabels = component.registry.getUtility("io.tablabels")

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

	const [selectedTabId, setSelectedTab] = uesio.component.useState<string>(
		"tabs",
		definition.id || path
	)

	const foundIndex = definition.tabs.findIndex(
		({ id }) => id === selectedTabId
	)
	const selectedIndex = foundIndex === -1 ? 0 : foundIndex

	const selectedTab = definition.tabs[selectedIndex]

	return (
		<div className={classes.root}>
			<TabLabels
				classes={{
					root: classes.tabLabels,
					tab: classes.tab,
					tabSelected: classes.tabSelected,
				}}
				selectedTab={selectedTab.id}
				setSelectedTab={setSelectedTab}
				tabs={definition.tabs}
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
