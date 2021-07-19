import { FunctionComponent } from "react"
import { definition, component, hooks } from "@uesio/ui"
import PropNodeTag from "../shared/buildpropitem/propnodetag"

const ScrollPanel = component.registry.getUtility("io.scrollpanel")
const TitleBar = component.registry.getUtility("io.titlebar")
const IconButton = component.registry.getUtility("io.iconbutton")

const WiresPanel: FunctionComponent<definition.UtilityProps> = (props) => {
	const path = '["wires"]'
	const { context, className } = props
	const uesio = hooks.useUesio(props)
	const [metadataType, metadataItem, selectedNode] =
		uesio.builder.useSelectedNode()
	const def = uesio.view.useDefinition(path) as definition.DefinitionMap
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
								uesio.view.addDefinitionPair(
									path,
									null,
									"newwire" +
										(Math.floor(Math.random() * 60) + 1)
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
					const wirePath = `${path}["${key}"]`
					const onClick = (): void =>
						uesio.builder.setSelectedNode(
							metadataType,
							metadataItem,
							wirePath
						)
					return (
						<PropNodeTag
							title={key}
							onClick={onClick}
							icon="power"
							key={index}
							selected={wirePath === selectedNode}
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
