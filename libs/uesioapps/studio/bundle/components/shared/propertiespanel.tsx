import { CSSProperties, FunctionComponent } from "react"
import { definition, component, hooks } from "@uesio/ui"
import PropertiesPane from "./propertiespane"
import { WirePropertyDefinition } from "../shared/wire/wiredefinition"

interface Props extends definition.BaseProps {
	style?: CSSProperties
}

const getPropsDef = (path: string) => {
	const pathArray = component.path.toPath(path)
	if (pathArray[0] === "wires") {
		return WirePropertyDefinition
	}
	return path
		? component.registry.getPropertiesDefinitionFromPath(path)
		: undefined
}

const PropertiesPanel: FunctionComponent<Props> = (props) => {
	const uesio = hooks.useUesio(props)
	const selectedNode = uesio.builder.useSelectedNode()
	const path = selectedNode
	// Trim the path to the closest namespaced component
	// For Example:
	// Turn: ["components"]["0"]["myns.mycomp"]["items"]["0"] into...
	// This: ["components"]["0"]["myns.mycomp"]
	const trimmedPath = (path && component.path.trimPathToComponent(path)) || ""

	const propsDef = getPropsDef(path)

	const definition = uesio.view.useDefinitionLocal(
		trimmedPath
	) as definition.DefinitionMap

	return (
		<PropertiesPane
			{...props}
			propsDef={propsDef}
			definition={definition}
			path={trimmedPath}
		/>
	)
}

export default PropertiesPanel
