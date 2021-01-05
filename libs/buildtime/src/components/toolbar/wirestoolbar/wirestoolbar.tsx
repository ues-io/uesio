import React, { FunctionComponent } from "react"
import { definition, hooks, material } from "@uesio/ui"
import ToolbarTitle from "../toolbartitle"

import AddIcon from "@material-ui/icons/AddBox"
import Power from "@material-ui/icons/Power"
import PropNodeTag from "../../buildpropitem/propnodetag"

interface Props extends definition.BaseProps {
	selectedNode: string
}

const WiresToolbar: FunctionComponent<Props> = (props: Props) => {
	const uesio = hooks.useUesio(props)
	const theme = material.useTheme()
	const path = '["wires"]'
	const definition = uesio.view.useDefinition(
		path
	) as definition.DefinitionMap
	const selectedNode = uesio.builder.useSelectedNode()
	return (
		<>
			<ToolbarTitle
				title="Wires"
				icon={AddIcon}
				iconColor={theme.palette.primary.main}
				iconOnClick={(): void => {
					uesio.view.addDefinitionPair(
						path,
						null,
						"newwire" + (Math.floor(Math.random() * 60) + 1)
					)
				}}
			/>
			<div style={{ padding: "6px 4px 4px 4px", background: "#f5f5f5" }}>
				{Object.keys(definition || {}).map((key: string, index) => {
					const wirePath = `${path}["${key}"]`
					const onClick = () =>
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
		</>
	)
}

export default WiresToolbar
