import { signal, component, api, metadata, definition } from "@uesio/ui"
import TabLabels from "../../utilities/tablabels/tablabels"
import { useEffect } from "react"

export type TabDefinition = {
	id: string
	label: string
	icon?: string
	components: definition.DefinitionList
	"uesio.display"?: component.DisplayCondition[]
}

type TabsDefinition = {
	tabs?: TabDefinition[]
	panelVariant?: metadata.MetadataKey
	labelsVariant?: metadata.MetadataKey
}

interface SelectTabSignal extends signal.SignalDefinition {
	id: string
}

const signals: Record<string, signal.ComponentSignalDescriptor> = {
	SELECT_TAB: {
		dispatcher: (state, signal: SelectTabSignal) => {
			console.log({ state, signal })
			state = "signals"
			console.log({ state })
		},
	},
}

const Tabs: definition.UC<TabsDefinition> = (props) => {
	const { definition, context, path } = props
	const { tabs = [] } = definition
	const ScrollPanel = component.getUtility("uesio/io.scrollpanel")

	const componentId = api.component.getComponentIdFromProps(props)

	const [selectedTabId, setSelectedTab] =
		api.component.useState<string>(componentId)

	const foundIndex = tabs.findIndex((tab) => tab.id === selectedTabId)
	const selectedIndex = foundIndex === -1 ? 0 : foundIndex
	const selectedTab = tabs[selectedIndex]
	const allVisibleTabs = component.useShouldFilter<TabDefinition>(
		tabs,
		context
	)
	const shouldDisplaySelectedTab =
		allVisibleTabs.findIndex((tab) => tab.id === selectedTab.id) > -1
	useEffect(() => {
		if (!shouldDisplaySelectedTab) {
			setSelectedTab(allVisibleTabs[0]?.id)
		}
	}, [
		selectedTabId,
		shouldDisplaySelectedTab,
		tabs,
		setSelectedTab,
		allVisibleTabs,
	])

	return (
		<ScrollPanel
			context={context}
			variant={definition.panelVariant}
			header={
				<TabLabels
					variant={definition.labelsVariant}
					selectedTab={selectedTab?.id}
					setSelectedTab={setSelectedTab}
					tabs={tabs}
					context={context}
				/>
			}
		>
			{shouldDisplaySelectedTab && (
				<component.Slot
					definition={selectedTab}
					listName="components"
					path={`${path}["tabs"]["${selectedIndex}"]`}
					context={context}
					label={`Tab ${selectedTab?.label} Components`}
				/>
			)}
		</ScrollPanel>
	)
}

Tabs.signals = signals
export default Tabs
