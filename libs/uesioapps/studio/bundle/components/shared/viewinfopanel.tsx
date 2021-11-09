import { FunctionComponent } from "react"
import { definition, component, styles, hooks } from "@uesio/ui"
import WiresPanel from "./wirespanel"
import ComponentsPanel from "./componentspanel"
import WiresActions from "./wiresactions"

const Tabs = component.registry.getUtility("io.tabs")
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
				<Tabs
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
				</>
			}
			context={context}
			className={props.className}
		>
			{selectedTab === "wires" && <WiresPanel context={context} />}
			{selectedTab === "components" && (
				<ComponentsPanel context={context} />
			)}
		</ScrollPanel>
	)
}

export default ViewInfoPanel
