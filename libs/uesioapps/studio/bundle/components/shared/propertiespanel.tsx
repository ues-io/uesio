import { FunctionComponent } from "react"
import { definition, component, hooks, util } from "@uesio/ui"
import PropertiesPane from "./propertiespane"
import { ViewDefValueAPI } from "./buildervalueapi/viewdef"
import { ComponentVariantValueAPI } from "./buildervalueapi/componentvariant"

const PropertiesPanel: FunctionComponent<definition.UtilityProps> = (props) => {
	const uesio = hooks.useUesio(props)
	const viewDefId = uesio.getViewDefId()

	const [metadataType, metadataItem, selectedPath] =
		uesio.builder.useSelectedNode()
	// Trim the path to the closest namespaced component
	// For Example:
	// Turn: ["components"]["0"]["myns.mycomp"]["items"]["0"] into...
	// This: ["components"]["0"]["myns.mycomp"]
	const trimmedPath =
		(selectedPath && component.path.trimPathToComponent(selectedPath)) || ""

	const propsDef = component.registry.getPropertiesDefinitionFromPath(
		component.path.makeFullPath(metadataType, metadataItem, trimmedPath)
	)

	const definition = uesio.builder.useDefinition(
		component.path.makeFullPath(metadataType, metadataItem, "")
	) as definition.DefinitionMap

	const valueAPI =
		metadataType === "componentvariant"
			? ComponentVariantValueAPI(
					metadataType,
					metadataItem,
					uesio,
					viewDefId,
					definition
			  )
			: ViewDefValueAPI(
					metadataType,
					metadataItem,
					uesio,
					viewDefId,
					definition
			  )

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
