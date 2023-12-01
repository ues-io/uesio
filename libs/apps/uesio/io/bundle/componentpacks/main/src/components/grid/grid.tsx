import { component, styles, definition } from "@uesio/ui"
import { default as IOGrid } from "../../utilities/grid/grid"

const StyleDefaults = Object.freeze({
	root: [],
})

const Grid: definition.UC = (props) => {
	const { definition, context, componentType } = props

	const classes = styles.useStyleTokens(StyleDefaults, props)
	return (
		<IOGrid classes={classes} context={props.context}>
			<component.Slot
				definition={definition}
				listName="items"
				path={props.path}
				context={context}
				componentType={componentType}
			/>
		</IOGrid>
	)
}

Grid.displayName = "Grid"

export default Grid
