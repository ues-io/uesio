import { FunctionComponent } from "react"
import { definition, component, hooks } from "@uesio/ui"
import WiresPanel from "./wirespanel"
import PanelsPanel from "./panelspanel"
import ComponentsPanel from "./componentspanel"
import WiresActions from "./wiresactions"
import PanelsActions from "./panelsactions"

const TabLabels = component.registry.getUtility("io.tablabels")
const ScrollPanel = component.registry.getUtility("io.scrollpanel")

const ViewInfoPanel: FunctionComponent<definition.UtilityProps> = (props) => {
	const { context } = props

	const uesio = hooks.useUesio(props)

	const [selectedTab, setSelectedTab] = uesio.component.useState<string>(
		"viewinfopanel",
		"components",
		undefined,
		"uesio.runtime"
	)

	return (
		<ScrollPanel
			header={
				<TabLabels
					variant="studio.mainsection"
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
		</ScrollPanel>
	)
}

export default ViewInfoPanel
