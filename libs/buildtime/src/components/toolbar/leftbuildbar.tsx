import { FunctionComponent } from "react";
import MiniToolbar from "./minitoolbar"
import WiresToolbar from "./wirestoolbar/wirestoolbar"
import ComponentsToolbar from "./componentstoolbar/componentstoolbar"
import PropertiesPanel from "./propertiespanel/propertiespanel"
import { definition, material, component, hooks } from "@uesio/ui"

interface Props extends definition.BaseProps {
	selectedPanel: string
	selectedNode: string
}

const MINI_TOOLBAR_WIDTH = 50

const LeftBuildbar: FunctionComponent<Props> = (props) => {
	const selected = props.selectedPanel as "wires" | "components"
	const { context, selectedNode } = props
	const path = selectedNode
	const uesio = hooks.useUesio(props)

	const toolbarMap = {
		wires: {
			component: WiresToolbar,
		},
		components: {
			component: ComponentsToolbar,
		},
	}

	const currentToolbarPanel = toolbarMap[selected]

	// Trim the path to the closest namespaced component
	// For Example:
	// Turn: ["components"]["0"]["myns.mycomp"]["items"]["0"] into...
	// This: ["components"]["0"]["myns.mycomp"]
	const trimmedPath = component.path.trimPathToComponent(path)

	const propDef = component.registry.getPropertiesDefinitionFromPath(
		trimmedPath
	)

	const definition = uesio.view.useDefinition(
		trimmedPath
	) as definition.DefinitionMap

	return (
		<MiniToolbar
			anchor="left"
			width={240}
			left={MINI_TOOLBAR_WIDTH}
			open={true}
			variant="persistent"
		>
			<material.Paper
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
			</material.Paper>
			<material.Paper
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
			</material.Paper>
		</MiniToolbar>
	)
}

export default LeftBuildbar
