import { FunctionComponent, useRef } from "react"

import { component, styles, hooks } from "@uesio/ui"
import { TileProps } from "./tiledefinition"
import { TileUtilityProps } from "../../utility/io.tile/tile"

const IOTile = component.registry.getUtility<TileUtilityProps>("io.tile")

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
	const ref = useRef<HTMLDivElement>(null)
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
			avatar={
				definition.avatar && (
					<component.Slot
						parentRef={ref}
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
				parentRef={ref}
				definition={definition}
				listName="content"
				path={path}
				accepts={["uesio.standalone"]}
				context={context}
			/>
			{portals}
		</IOTile>
	)
}

export default Tile
