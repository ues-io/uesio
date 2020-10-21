import React, { FC, Fragment } from "react"
import { definition, hooks, material } from "@uesio/ui"
import ToolbarTitle from "../toolbartitle"

import AddIcon from "@material-ui/icons/AddBox"
import Power from "@material-ui/icons/Power"
import PropNodeTag from "../../buildpropitem/propnodetag"

interface Props extends definition.BaseProps {
	selectedNode: string
}

const WiresToolbar: FC<Props> = (props: Props) => {
	const uesio = hooks.useUesio(props)
	const theme = material.useTheme()
	const path = '["wires"]'
	const definition = uesio.view.useDefinition(
		path
	) as definition.DefinitionMap
	const selectedNode = uesio.builder.useSelectedNode()
	return (
		<Fragment>
			<ToolbarTitle
				title="Wires"
				icon={AddIcon}
				iconColor={theme.palette.primary.main}
				iconOnClick={(): void => {
					uesio.view.addDefinitionPair(
						'["wires"]',
						null,
						"newwire" + (Math.floor(Math.random() * 60) + 1)
					)
				}}
			></ToolbarTitle>
			<div style={{ padding: "6px 4px 4px 4px", background: "#f5f5f5" }}>
				{definition &&
					Object.keys(definition).map(
						(key: string, index: number) => {
							const wirePath = path + `["${key}"]`
							return (
								<PropNodeTag
									title={key}
									onClick={(): void => {
										uesio.builder.setSelectedNode(wirePath)
									}}
									icon={Power}
									key={index}
									selected={wirePath === selectedNode}
								></PropNodeTag>
							)
						}
					)}
			</div>
		</Fragment>
	)
}

export default WiresToolbar
