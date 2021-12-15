import { FunctionComponent } from "react"

import { component, styles, hooks } from "@uesio/ui"
import { Props } from "./tabsdefinition"

const TabLabels = component.registry.getUtility("io.tablabels")

const Tabs: FunctionComponent<Props> = (props) => {
	const { definition, context, path } = props
	const classes = styles.useStyles(
		{
			root: {},
			tab: {},
		},
		props
	)
	const uesio = hooks.useUesio(props)

	const [selectedTabId, setSelectedTab] = uesio.component.useState<string>(
		"tabs",
		definition.tabs[0].id,
		undefined,
		"uesio.runtime"
	)

	const tabsWithIndex = definition.tabs.map((t: any, i: number) => ({
		...t,
		i,
	}))
	const selectedTab =
		tabsWithIndex.find(({ id }) => id === selectedTabId) || tabsWithIndex[0]
	console.log({ tabsWithIndex, selectedTabId, selectedTab })

	return (
		<div
			className={classes.root}
			onClick={
				definition?.signals &&
				uesio.signal.getHandler(definition.signals)
			}
		>
			<div style={{}}>
				<TabLabels
					variant={definition["uesio.variant"]}
					selectedTab={selectedTabId}
					setSelectedTab={setSelectedTab}
					tabs={definition.tabs}
					context={context}
				/>
			</div>

			<div className={classes.tab}>
				<component.Slot
					definition={selectedTab}
					listName="components"
					path={`${path}["tabs"]["${selectedTab.i}"]`}
					accepts={["uesio.standalone"]}
					context={context}
				/>
			</div>
		</div>
	)
}

export default Tabs
