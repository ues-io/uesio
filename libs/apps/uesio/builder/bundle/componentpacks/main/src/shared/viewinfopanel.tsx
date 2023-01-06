import { FunctionComponent } from "react"
import { definition, component, hooks } from "@uesio/ui"
import WiresPanel from "./wirespanel"
import PanelsPanel from "./panelspanel"
import ParamsPanel from "./paramspanel"
import ComponentsPanel from "./componentspanel"
import WiresActions from "./wiresactions"
import PanelsActions from "./panelsactions"
import ParamsActions from "./paramsactions"

const TabLabels = component.getUtility("uesio/io.tablabels")
const ScrollPanel = component.getUtility("uesio/io.scrollpanel")

const ViewInfoPanel: FunctionComponent<definition.UtilityProps> = (props) => {
	const { context } = props

	const uesio = hooks.useUesio(props)

	const componentId = uesio.component.getComponentId(
		"viewinfopanel",
		"uesio/builder.mainwrapper",
		props.path,
		context
	)
	const [selectedTab, setSelectedTab] = uesio.component.useState<string>(
		componentId,
		"components"
	)

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
			footer={
				<>
					{selectedTab === "wires" && (
						<WiresActions context={context} />
					)}
					{selectedTab === "panels" && (
						<PanelsActions context={context} />
					)}
					{selectedTab === "params" && (
						<ParamsActions context={context} />
					)}
				</>
			}
			context={context}
			className={props.className}
		>
			{selectedTab === "wires" && <WiresPanel context={context} />}
			{selectedTab === "components" && (
				<ComponentsPanel context={context} />
			)}
			{selectedTab === "panels" && <PanelsPanel context={context} />}
			{selectedTab === "params" && <ParamsPanel context={context} />}
		</ScrollPanel>
	)
}

export default ViewInfoPanel
