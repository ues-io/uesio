import { definition, component } from "@uesio/ui"
import WiresPanel from "./wirespanel"
import PanelsPanel from "./panelspanel"
import ParamsPanel from "./paramspanel"
import ComponentsPanel from "./componentspanel"
import WiresActions from "./wiresactions"
import PanelsActions from "./panelsactions"
import ParamsActions from "./paramsactions"
import { useBuilderState } from "../../../api/stateapi"
import { ReactNode } from "react"

const ViewInfoPanel: definition.UtilityComponent = (props) => {
	const TabLabels = component.getUtility("uesio/io.tablabels")
	const ScrollPanel = component.getUtility("uesio/io.scrollpanel")
	const { context } = props

	const [selectedTab, setSelectedTab] = useBuilderState<string>(
		context,
		"viewinfopanel",
		"components"
	)

	let content: ReactNode = null
	let actions: ReactNode = null

	switch (selectedTab) {
		case "components": {
			content = <ComponentsPanel context={context} />
			break
		}
		case "wires": {
			content = <WiresPanel context={context} />
			actions = <WiresActions context={context} />
			break
		}
		case "panels": {
			content = <PanelsPanel context={context} />
			actions = <PanelsActions context={context} />
			break
		}
		case "params": {
			content = <ParamsPanel context={context} />
			actions = <ParamsActions context={context} />
		}
	}

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
			footer={actions}
			context={context}
			className={props.className}
		>
			<component.ErrorBoundary definition={{}} path="" context={context}>
				{content}
			</component.ErrorBoundary>
		</ScrollPanel>
	)
}

export default ViewInfoPanel
