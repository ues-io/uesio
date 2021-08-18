import { FunctionComponent } from "react"
import { definition, component, hooks, util } from "@uesio/ui"
import PropertiesPane from "./propertiespane"
import valueAPIInit from "./valueAPI"
const PropertiesPanel: FunctionComponent<definition.UtilityProps> = (props) => {
	const uesio = hooks.useUesio(props)
	const [metadataType, metadataItem, selectedPath] =
		uesio.builder.useSelectedNode()
	// Trim the path to the closest namespaced component
	// For Example:
	// Turn: ["components"]["0"]["myns.mycomp"]["items"]["0"] into...
	// This: ["components"]["0"]["myns.mycomp"]

	const valueAPI = valueAPIInit(uesio, metadataType, metadataItem)

	if (!valueAPI) return null

	const trimmedPath =
		(selectedPath && component.path.trimPathToComponent(selectedPath)) || ""

	const propsDef = component.registry.getPropertiesDefinitionFromPath(
		component.path.makeFullPath(metadataType, metadataItem, trimmedPath)
	)

	const definition = uesio.builder.useDefinition(
		component.path.makeFullPath(metadataType, metadataItem, "")
	) as definition.DefinitionMap

	return (
		<PropertiesPane
			context={props.context}
			className={props.className}
			propsDef={propsDef}
			path={trimmedPath}
			valueAPI={valueAPI}
		/>
	)
}

PropertiesPanel.displayName = "PropertiesPanel"

export default PropertiesPanel
