import { definition, component } from "@uesio/ui"
import WiresPanel from "./wirespanel"
import PanelsPanel from "./panelspanel"
import ParamsPanel from "./paramspanel"
import ComponentsPanel from "./componentspanel"
import WiresActions from "./wiresactions"
import PanelsActions from "./panelsactions"
import ParamsActions from "./paramsactions"
import { useBuilderState } from "../../../api/stateapi"

const content: Record<string, definition.UtilityComponent> = {
	components: ComponentsPanel,
	wires: WiresPanel,
	panels: PanelsPanel,
	params: ParamsPanel,
}

const actions: Record<string, definition.UtilityComponent> = {
	wires: WiresActions,
	panels: PanelsActions,
	params: ParamsActions,
}

const ViewInfoPanel: definition.UtilityComponent = (props) => {
	const TabLabels = component.getUtility("uesio/io.tablabels")
	const ScrollPanel = component.getUtility("uesio/io.scrollpanel")
	const { context } = props

	const [selectedTab, setSelectedTab] = useBuilderState<string>(
		context,
		"viewinfopanel",
		"components"
	)

	const Content = selectedTab ? content[selectedTab] : undefined
	const Actions = selectedTab ? actions[selectedTab] : undefined

	return (
		<ScrollPanel
			header={
				<TabLabels
					variant="uesio/builder.mainsection"
					selectedTab={selectedTab}
					setSelectedTab={setSelectedTab}
					tabs={[
						{ id: "components", label: "Components" },
						{ id: "wires", label: "Wires" },
						{ id: "panels", label: "Panels" },
						{ id: "params", label: "Params" },
					]}
					context={context}
				/>
			}
			footer={Actions && <Actions context={context} />}
			context={context}
			className={props.className}
		>
			<component.ErrorBoundary definition={{}} path="" context={context}>
				{Content && <Content context={context} />}
			</component.ErrorBoundary>
		</ScrollPanel>
	)
}

export default ViewInfoPanel
