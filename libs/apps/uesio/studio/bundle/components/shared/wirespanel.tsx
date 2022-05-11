import { FunctionComponent } from "react"
import { definition, hooks } from "@uesio/ui"
import PropNodeTag from "../shared/buildpropitem/propnodetag"

const WiresPanel: FunctionComponent<definition.UtilityProps> = (props) => {
	const { context } = props
	const uesio = hooks.useUesio(props)
	const [selectedMetadataType, selectedMetadataItem, selectedNode] =
		uesio.builder.useSelectedNode()
	const metadataType = "viewdef"
	const metadataItem = uesio.getViewDefId() || ""
	const localPath = '["wires"]'

	const def = uesio.builder.useDefinition(
		metadataType,
		metadataItem,
		localPath
	) as definition.DefinitionMap

	return (
		<div>
			{Object.keys(def || {}).map((key: string, index) => {
				const wirePath = `${localPath}["${key}"]`
				return (
					<PropNodeTag
						title={key}
						onClick={() =>
							uesio.builder.setSelectedNode(
								metadataType,
								metadataItem,
								wirePath
							)
						}
						icon="power"
						key={index}
						selected={
							selectedMetadataType === metadataType &&
							selectedMetadataItem === metadataItem &&
							wirePath === selectedNode
						}
						context={context}
					/>
				)
			})}
		</div>
	)
}
WiresPanel.displayName = "WiresPanel"

export default WiresPanel
