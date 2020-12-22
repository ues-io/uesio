import { FunctionComponent, Fragment } from "react";
import LeftNavbar from "./leftnavbar"
import LeftBuildbar from "./leftbuildbar"
import { hooks, definition } from "@uesio/ui"

const LeftToolbar: FunctionComponent<definition.BaseProps> = (props) => {
	const uesio = hooks.useUesio(props)
	const selectedPanel = uesio.builder.useLeftPanel()
	const builderView = uesio.builder.useView()
	const selectedNode = uesio.builder.useSelectedNode()

	return (
		<Fragment>
			<LeftNavbar
				viewMode={builderView}
				onChange={(toolbarId: string): void => {
					if (
						toolbarId === "compactview" ||
						toolbarId === "expandedview"
					) {
						uesio.builder.setView(toolbarId)
						return
					}
					uesio.builder.setLeftPanel(
						selectedPanel === toolbarId && !selectedNode
							? ""
							: toolbarId
					)
				}}
			/>
			{(selectedPanel || selectedNode) && (
				<LeftBuildbar
					selectedPanel={selectedPanel}
					selectedNode={selectedNode}
					path=""
					context={props.context}
				/>
			)}
		</Fragment>
	)
}

export default LeftToolbar
