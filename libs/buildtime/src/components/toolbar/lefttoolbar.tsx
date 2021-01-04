import React, { FunctionComponent } from "react"
import LeftNavbar from "./leftnavbar"
import LeftBuildbar from "./leftbuildbar"
import { hooks, definition } from "@uesio/ui"

const LeftToolbar: FunctionComponent<definition.BaseProps> = (props) => {
	const uesio = hooks.useUesio(props)
	const viewDef = uesio.view.useDefinition()
	// @ts-ignore
	const wirePath = Object.keys((viewDef as unknown)?.wires)?.[0]
	const selectedPanel = uesio.builder.useLeftPanel()
	const builderView = uesio.builder.useView()
	const selectedNode = uesio.builder.useSelectedNode()
	const onChange = (toolbarId: string): void => {
		if (toolbarId === "compactview" || toolbarId === "expandedview") {
			uesio.builder.setView(toolbarId)
			return
		}
		uesio.builder.setLeftPanel(
			selectedPanel === toolbarId && !selectedNode ? "" : toolbarId
		)
	}
	return (
		<>
			<LeftNavbar viewMode={builderView} onChange={onChange} />
			{(selectedPanel || selectedNode) && (
				<LeftBuildbar
					selectedPanel={selectedPanel}
					selectedNode={selectedNode}
					path={(wirePath && `[wires][${wirePath}]`) || ""}
					context={props.context}
				/>
			)}
		</>
	)
}

export default LeftToolbar
