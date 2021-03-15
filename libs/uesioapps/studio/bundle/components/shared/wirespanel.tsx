import { CSSProperties, FunctionComponent } from "react"
import { definition, component, hooks } from "@uesio/ui"
import PropNodeTag from "../shared/buildpropitem/propnodetag"
import Power from "@material-ui/icons/Power"

const ScrollPanel = component.registry.getUtility("io.scrollpanel")
const TitleBar = component.registry.getUtility("io.titlebar")
const IconButton = component.registry.getUtility("io.iconbutton")

interface Props extends definition.BaseProps {
	style?: CSSProperties
}

const WiresPanel: FunctionComponent<Props> = (props) => {
	const path = '["wires"]'
	const uesio = hooks.useUesio(props)
	const selectedNode = uesio.builder.useSelectedNode()
	const def = uesio.view.useDefinition(path) as definition.DefinitionMap
	return (
		<ScrollPanel
			header={
				<TitleBar
					variant="io.primary"
					title={"wires"}
					{...props}
					actions={
						<IconButton
							{...props}
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
			{...props}
		>
			<div style={{ padding: "6px 4px 4px 4px", background: "#f5f5f5" }}>
				{Object.keys(def || {}).map((key: string, index) => {
					const wirePath = `${path}["${key}"]`
					const onClick = (): void =>
						uesio.builder.setSelectedNode(wirePath)
					return (
						<PropNodeTag
							title={key}
							onClick={onClick}
							icon={Power}
							key={index}
							selected={wirePath === selectedNode}
						/>
					)
				})}
			</div>
		</ScrollPanel>
	)
}

export default WiresPanel
