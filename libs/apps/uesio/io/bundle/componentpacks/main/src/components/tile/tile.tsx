import { component, styles, api, definition, signal } from "@uesio/ui"
import { default as IOTile } from "../../utilities/tile/tile"

type TileDefinition = {
	signals?: signal.SignalDefinition[]
	avatar?: definition.DefinitionList
	content?: definition.DefinitionList
}

const StyleDefaults = Object.freeze({
	root: [],
	content: [],
	avatar: [],
	selected: [],
})

const Tile: definition.UC<TileDefinition> = (props) => {
	const { definition, context, path } = props

	const classes = styles.useStyleTokens(StyleDefaults, props)
	const isSelected = component.shouldHaveClass(
		context,
		"selected",
		definition
	)

	const [link, handler] = api.signal.useLinkHandler(
		// Don't run tile actions in View Builder
		// TODO: Find way to avoid this builder-specific check
		context.getCustomSlotLoader() ? [] : definition.signals,
		context
	)

	return (
		<IOTile
			id={api.component.getComponentIdFromProps(props)}
			classes={classes}
			variant={definition[component.STYLE_VARIANT]}
			context={context}
			onClick={handler}
			isSelected={isSelected}
			link={link}
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

export default Tile
