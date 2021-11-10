import { FunctionComponent } from "react"
import { definition, component, hooks } from "@uesio/ui"
import PropNodeTag from "../shared/buildpropitem/propnodetag"

const PanelsPanel: FunctionComponent<definition.UtilityProps> = (props) => {
	const { context } = props
	const uesio = hooks.useUesio(props)
	const [selectedMetadataType, selectedMetadataItem, selectedNode] =
		uesio.builder.useSelectedNode()
	const metadataType = "viewdef"
	const metadataItem = uesio.getViewDefId() || ""
	const localPath = `["panels"]`
	const path = component.path.makeFullPath(
		metadataType,
		metadataItem,
		localPath
	)
	const def = uesio.builder.useDefinition(path) as definition.DefinitionMap
	// Temp solution, get first panel under panelId
	// We might want to add some helper functions for traversing down
	const panelArray = Object.values(def || {})[0] as any[]
	const panelComponent = Object.keys(panelArray[0])[0]

	return (
		<div style={{ padding: "6px 4px 4px 4px", background: "#f5f5f5" }}>
			{Object.keys(def || {}).map((key: string, index) => {
				const panelPath = `${localPath}["${key}"]["0"]["${panelComponent}"]` // Temp hardcoded index
				return (
					<PropNodeTag
						title={key}
						onClick={() =>
							uesio.builder.setSelectedNode(
								metadataType,
								metadataItem,
								panelPath
							)
						}
						icon="power"
						key={panelPath}
						selected={
							selectedMetadataType === metadataType &&
							selectedMetadataItem === metadataItem &&
							panelPath === selectedNode
						}
						context={context}
					/>
				)
			})}
		</div>
	)
}
PanelsPanel.displayName = "PanelsPanel"

export default PanelsPanel
