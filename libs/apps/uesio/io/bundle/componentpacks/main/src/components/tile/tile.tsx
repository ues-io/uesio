import { component, styles, api, definition, signal } from "@uesio/ui"
import { TileUtilityProps } from "../../utilities/tile/tile"

const IOTile = component.getUtility<TileUtilityProps>("uesio/io.tile")

type TileDefinition = {
	signals?: signal.SignalDefinition[]
	avatar?: definition.DefinitionList
	content?: definition.DefinitionList
} & definition.BaseDefinition

interface TileProps extends definition.BaseProps {
	definition: TileDefinition
}

const Tile: definition.UesioComponent<TileProps> = (props) => {
	const classes = styles.useStyles(
		{
			root: {},
			content: {},
			avatar: {},
			selected: {},
		},
		props
	)
	const { definition, context, path } = props
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
			onClick={api.signal.getHandler(definition.signals, context)}
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

/*
const TilePropertyDefinition: builder.BuildPropertiesDefinition = {
	title: "Tile",
	description: "A clickable tag representing a record.",
	link: "https://docs.ues.io/",
	defaultDefinition: () => ({}),
	properties: [],
	sections: [
		{
			title: "Signals",
			type: "SIGNALS",
		},
	],
	actions: [],
	traits: ["uesio.standalone"],
	type: "component",
	classes: ["root", "content", "avatar"],
	category: "CONTENT",
}
*/

export default Tile
