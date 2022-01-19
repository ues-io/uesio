import { FunctionComponent } from "react"
import { definition, component, hooks, panel } from "@uesio/ui"
import PropNodeTag from "./buildpropitem/propnodetag"

const ParamsPanel: FunctionComponent<definition.UtilityProps> = (props) => {
	const { context } = props
	const uesio = hooks.useUesio(props)
	const [selectedMetadataType, selectedMetadataItem, selectedNode] =
		uesio.builder.useSelectedNode()
	const metadataType = "viewdef"
	const metadataItem = uesio.getViewDefId() || ""
	const localPath = `["params"]`
	const path = component.path.makeFullPath(
		metadataType,
		metadataItem,
		localPath
	)
	const def = uesio.builder.useDefinition(path) as panel.PanelDefinition
	return (
		<div>
			{Object.keys(def || {}).map((paramId: string) => {
				const paramPath = `${localPath}["${paramId}"]`
				return (
					<PropNodeTag
						title={paramId}
						onClick={() =>
							uesio.builder.setSelectedNode(
								metadataType,
								metadataItem,
								paramPath
							)
						}
						icon="power"
						key={paramPath}
						selected={
							selectedMetadataType === metadataType &&
							selectedMetadataItem === metadataItem &&
							paramPath === selectedNode
						}
						context={context}
					/>
				)
			})}
		</div>
	)
}
ParamsPanel.displayName = "ParamsPanel"

export default ParamsPanel
