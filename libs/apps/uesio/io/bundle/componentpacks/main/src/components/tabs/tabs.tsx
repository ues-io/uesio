import { component, api, metadata, definition } from "@uesio/ui"
import TabLabels from "../../utilities/tablabels/tablabels"

type TabDefinition = {
	id: string
	label: string
	components: definition.DefinitionList
}

type TabsDefinition = {
	tabs?: TabDefinition[]
	footer?: definition.DefinitionList
	panelVariant?: metadata.MetadataKey
	labelsVariant?: metadata.MetadataKey
}

const Tabs: definition.UC<TabsDefinition> = (props) => {
	const { definition, context, path } = props
	const ScrollPanel = component.getUtility("uesio/io.scrollpanel")

	const componentId = api.component.getComponentIdFromProps(props)

	const [selectedTabId, setSelectedTab] =
		api.component.useState<string>(componentId)
	const tabs = definition.tabs || []
	const foundIndex = tabs.findIndex((tab) => tab.id === selectedTabId)
	const selectedIndex = foundIndex === -1 ? 0 : foundIndex
	const selectedTab = tabs[selectedIndex]

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
			footer={
				<div>
					<component.Slot
						definition={definition}
						listName="footer"
						path={path}
						label="footer"
						context={context}
					/>
				</div>
			}
		>
			<component.Slot
				definition={selectedTab}
				listName="components"
				path={`${path}["tabs"]["${selectedIndex}"]`}
				context={context}
				label={`Tab ${selectedTab?.label} Components`}
			/>
		</ScrollPanel>
	)
}

export default Tabs
