import { FunctionComponent } from "react"

import { component, styles, hooks } from "@uesio/ui"
import { TileProps } from "./tiledefinition"
import { TileUtilityProps } from "../../utilities/tile/tile"

const IOTile = component.getUtility<TileUtilityProps>("uesio/io.tile")

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
	const handler = uesio.signal.getHandler(definition.signals, context)
	const isSelected = component.shouldHaveClass(
		context,
		"selected",
		definition
	)

	return (
		<IOTile
			classes={classes}
			variant={definition["uesio.variant"]}
			context={context}
			onClick={handler}
			isSelected={isSelected}
			avatar={
				definition.avatar && (
					<component.Slot
						definition={definition}
						listName="avatar"
						path={path}
						accepts={["uesio.standalone"]}
						context={context}
					/>
				)
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
