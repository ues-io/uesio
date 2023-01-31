import { component, styles, api, definition, signal } from "@uesio/ui"
import { default as IOTile } from "../../utilities/tile/tile"

type TileDefinition = {
	signals?: signal.SignalDefinition[]
	avatar?: definition.DefinitionList
	content?: definition.DefinitionList
}

const Tile: definition.UC<TileDefinition> = (props) => {
	const { definition, context, path } = props

	const classes = styles.useStyles(
		{
			root: {},
			content: {},
			avatar: {},
			selected: {},
		},
		props
	)
	const isSelected = component.shouldHaveClass(
		context,
		"selected",
		definition
	)

	return (
		<IOTile
			id={api.component.getComponentIdFromProps(props)}
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
						context={context}
					/>
				)
			}
		>
			<component.Slot
				definition={definition}
				listName="content"
				path={path}
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
