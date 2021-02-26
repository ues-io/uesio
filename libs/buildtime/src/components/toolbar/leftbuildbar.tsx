import React, { FunctionComponent } from "react"
import MiniToolbar from "./minitoolbar"
import WiresToolbar from "./wirestoolbar/wirestoolbar"
import ComponentsToolbar from "./componentstoolbar/componentstoolbar"
import PropertiesPanel from "./propertiespanel/propertiespanel"
import { definition, component, hooks } from "@uesio/ui"
import { Paper } from "@material-ui/core"
interface Props extends definition.BaseProps {
	selectedPanel: string
	selectedNode: string
}

const TOOLBAR_TO_COMPONENT = {
	wires: {
		component: WiresToolbar,
	},
	components: {
		component: ComponentsToolbar,
	},
}

const MINI_TOOLBAR_WIDTH = 50

const LeftBuildbar: FunctionComponent<Props> = (props) => {
	const { context, selectedNode, selectedPanel: selected } = props
	const path = selectedNode
	const uesio = hooks.useUesio(props)

	const currentToolbarPanel =
		TOOLBAR_TO_COMPONENT[selected as "wires" | "components"]

	// Trim the path to the closest namespaced component
	// For Example:
	// Turn: ["components"]["0"]["myns.mycomp"]["items"]["0"] into...
	// This: ["components"]["0"]["myns.mycomp"]
	const trimmedPath = (path && component.path.trimPathToComponent(path)) || ""

	const propDef = trimmedPath
		? component.registry.getPropertiesDefinitionFromPath(trimmedPath)
		: undefined

	const definition = trimmedPath
		? (uesio.view.useDefinition(trimmedPath) as definition.DefinitionMap)
		: undefined

	return (
		<MiniToolbar
			anchor="left"
			width={240}
			left={MINI_TOOLBAR_WIDTH}
			open={true}
			variant="persistent"
		>
			<Paper
				style={{
					height: "50%",
					display: "flex",
					flexDirection: "column",
					overflow: "hidden",
					margin: "8px 0",
				}}
			>
				<PropertiesPanel
					path={trimmedPath}
					index={0}
					context={context}
					definition={definition}
					propDef={propDef}
				/>
			</Paper>
			<Paper
				style={{
					height: "50%",
					display: "flex",
					flexDirection: "column",
					overflow: "hidden",
					marginBottom: "8px",
				}}
			>
				{currentToolbarPanel && (
					<currentToolbarPanel.component
						selectedNode={selectedNode}
						path=""
						context={context}
					/>
				)}
			</Paper>
		</MiniToolbar>
	)
}

export default LeftBuildbar
