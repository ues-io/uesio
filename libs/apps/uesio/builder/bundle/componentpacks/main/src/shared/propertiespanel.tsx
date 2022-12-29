import { FunctionComponent } from "react"
import { definition, component, hooks } from "@uesio/ui"
import PropertiesPane from "./propertiespane"
import getValueAPI from "./valueapi"

const PropertiesPanel: FunctionComponent<definition.UtilityProps> = (props) => {
	const uesio = hooks.useUesio(props)

	const [metadataType, metadataItem, selectedPath] =
		uesio.builder.useSelectedNode()

	const definition = uesio.builder.useDefinition(
		metadataType,
		metadataItem,
		""
	) as definition.DefinitionMap

	const fullPath = component.path.makeFullPath(
		metadataType,
		metadataItem,
		selectedPath
	)

	const [propsDef, trimmedPath] =
		component.registry.getPropertiesDefinitionFromPath(fullPath, definition)

	return (
		<PropertiesPane
			context={props.context}
			className={props.className}
			propsDef={propsDef}
			path={trimmedPath}
			valueAPI={getValueAPI(
				metadataType,
				metadataItem,
				selectedPath,
				definition
			)}
		/>
	)
}

PropertiesPanel.displayName = "PropertiesPanel"

export default PropertiesPanel
