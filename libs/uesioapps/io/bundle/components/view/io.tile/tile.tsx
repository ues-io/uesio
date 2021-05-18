import { FunctionComponent } from "react"

import { component, styles, hooks } from "@uesio/ui"
import { TileProps } from "./tiledefinition"

const IOTile = component.registry.getUtility("io.tile")

const Tile: FunctionComponent<TileProps> = (props) => {
	const classes = styles.useStyles(
		{
			root: {},
			content: {},
			avatar: {},
			selected: {},
		},
		props
	)
	const uesio = hooks.useUesio(props)
	const { definition, context, path } = props
	const [handler, portals] = uesio.signal.useHandler(definition.signals)
	const isSelected = component.shouldHaveClass(
		context,
		"selected",
		definition
	)

	return (
		<IOTile
			classes={classes}
			context={context}
			onClick={handler}
			isSelected={isSelected}
			portals={portals}
			avatar={
				<component.Slot
					definition={definition}
					listName="avatar"
					path={path}
					accepts={["uesio.standalone"]}
					context={context}
				/>
			}
		>
			<component.Slot
				definition={definition}
				listName="content"
				path={path}
				accepts={["uesio.standalone"]}
				context={context}
			/>
		</IOTile>
	)
}

export default Tile
