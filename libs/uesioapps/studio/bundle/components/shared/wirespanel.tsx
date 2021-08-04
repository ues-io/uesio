import { FunctionComponent } from "react"
import { definition, component, hooks } from "@uesio/ui"
import PropNodeTag from "../shared/buildpropitem/propnodetag"

const ScrollPanel = component.registry.getUtility("io.scrollpanel")
const TitleBar = component.registry.getUtility("io.titlebar")
const IconButton = component.registry.getUtility("io.iconbutton")

const WiresPanel: FunctionComponent<definition.UtilityProps> = (props) => {
	const { context, className } = props
	const uesio = hooks.useUesio(props)
	const [selectedMetadataType, selectedMetadataItem, selectedNode] =
		uesio.builder.useSelectedNode()
	const metadataType = "viewdef"
	const metadataItem = uesio.getViewDefId() || ""
	const localPath = '["wires"]'
	const path = component.path.makeFullPath(
		metadataType,
		metadataItem,
		localPath
	)
	const def = uesio.builder.useDefinition(path) as definition.DefinitionMap
	return (
		<ScrollPanel
			header={
				<TitleBar
					variant="io.primary"
					title={"wires"}
					context={context}
					actions={
						<IconButton
							context={context}
							variant="io.small"
							icon="add"
							onClick={() =>
								uesio.builder.addDefinitionPair(
									path,
									null,
									"newwire" +
										(Math.floor(Math.random() * 60) + 1),
									"wire"
								)
							}
						/>
					}
				/>
			}
			context={context}
			className={className}
		>
			<div style={{ padding: "6px 4px 4px 4px", background: "#f5f5f5" }}>
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
		</ScrollPanel>
	)
}
WiresPanel.displayName = "WiresPanel"

export default WiresPanel
