import React, { FunctionComponent } from "react"
import { SelectWireContext } from "./SelectWireContext"
import LeftNavbar from "./leftnavbar"
import LeftBuildbar from "./leftbuildbar"
import { hooks, definition } from "@uesio/ui"

const LeftToolbar: FunctionComponent<definition.BaseProps> = (props) => {
	const uesio = hooks.useUesio(props)
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
				<SelectWireContext.Provider value="hello from the context">
					<LeftBuildbar
						selectedPanel={selectedPanel}
						selectedNode={selectedNode}
						path=""
						context={props.context}
					/>
				</SelectWireContext.Provider>
			)}
		</>
	)
}

export default LeftToolbar
