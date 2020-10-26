import React, { FC, Fragment } from "react"
import LeftNavbar from "./leftnavbar"
import LeftBuildbar from "./leftbuildbar"
import { hooks, definition } from "@uesio/ui"

const LeftToolbar: FC<definition.BaseProps> = (props: definition.BaseProps) => {
	const uesio = hooks.useUesio(props)
	const selectedPanel = uesio.builder.useLeftPanel()
	const builderView = uesio.builder.useView()
	const selectedNode = uesio.builder.useSelectedNode()

	return (
		<Fragment>
			<LeftNavbar
				{...{
					viewMode: builderView,
					onChange: (toolbarId: string): void => {
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
					},
				}}
			></LeftNavbar>
			{(selectedPanel || selectedNode) && (
				<LeftBuildbar
					{...{
						selectedPanel,
						selectedNode,
						path: "",
						context: props.context,
					}}
				/>
			)}
		</Fragment>
	)
}

export default LeftToolbar
