import { FunctionComponent } from "react"
import { definition, component, hooks, util } from "@uesio/ui"
import PropertiesPane from "./propertiespane"
import { WirePropertyDefinition } from "../shared/wire/wiredefinition"

const getPropsDef = (
	metadataType: string,
	metadataItem: string,
	path: string
) => {
	const pathArray = component.path.toPath(path)
	if (pathArray[0] === "wires") {
		return WirePropertyDefinition
	}
	return path
		? component.registry.getPropertiesDefinitionFromPath(path)
		: undefined
}

const PropertiesPanel: FunctionComponent<definition.UtilityProps> = (props) => {
	const uesio = hooks.useUesio(props)
	const [metadataType, metadataItem, selectedPath] =
		uesio.builder.useSelectedNode()
	// Trim the path to the closest namespaced component
	// For Example:
	// Turn: ["components"]["0"]["myns.mycomp"]["items"]["0"] into...
	// This: ["components"]["0"]["myns.mycomp"]
	const trimmedPath =
		(selectedPath && component.path.trimPathToComponent(selectedPath)) || ""

	const propsDef = getPropsDef(metadataType, metadataItem, selectedPath)

	const definition = uesio.view.useDefinitionLocal(
		""
	) as definition.DefinitionMap

	return (
		<PropertiesPane
			context={props.context}
			className={props.className}
			propsDef={propsDef}
			path={trimmedPath}
			getValue={(path: string) => util.get(definition, path)}
			setValue={(path: string, value: string) => {
				uesio.view.setDefinition(path, value)
			}}
		/>
	)
}

PropertiesPanel.displayName = "PropertiesPanel"

export default PropertiesPanel
