import { FunctionComponent } from "react"
import { definition, component, hooks, panel } from "@uesio/ui"
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
	const def = uesio.builder.useDefinition(path) as panel.PanelDefinition
	return (
		<div>
			{Object.keys(def || {}).map((panelId: string) => {
				const panelPath = `${localPath}["${panelId}"]`
				return (
					<PropNodeTag
						title={panelId}
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
