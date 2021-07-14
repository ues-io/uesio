import { FunctionComponent } from "react"
import { definition, component, hooks } from "@uesio/ui"
import PropertiesPane from "./propertiespane"
import { WirePropertyDefinition } from "../shared/wire/wiredefinition"
import { ComponentVariantDefinition } from "../shared/componentvariant/componentvariantdefinition"

const getPropsDef = (path: string) => {
	const pathArray = component.path.toPath(path)
	if (pathArray[0] === "wires") {
		return WirePropertyDefinition
	}

	if (pathArray[0] === "componentvariants") {
		console.log("returning component variant def")
		return ComponentVariantDefinition
	}
	return path
		? component.registry.getPropertiesDefinitionFromPath(path)
		: undefined
}

const PropertiesPanel: FunctionComponent<definition.UtilityProps> = (props) => {
	const uesio = hooks.useUesio(props)
	const selectedNode = uesio.builder.useSelectedNode()
	const path = selectedNode
	// Trim the path to the closest namespaced component
	// For Example:
	// Turn: ["components"]["0"]["myns.mycomp"]["items"]["0"] into...
	// This: ["components"]["0"]["myns.mycomp"]
	const trimmedPath = (path && component.path.trimPathToComponent(path)) || ""

	const propsDef = getPropsDef(path)
	console.log("propsDef", trimmedPath)

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

PropertiesPanel.displayName = "PropertiesPanel"

export default PropertiesPanel
