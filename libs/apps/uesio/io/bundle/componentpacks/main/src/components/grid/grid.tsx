import { component, styles, definition } from "@uesio/ui"
import { default as IOGrid } from "../../utilities/grid/grid"

const Grid: definition.UC = (props) => {
	const { definition, context } = props

	const classes = styles.useStyles(
		{
			root: {},
		},
		props
	)
	return (
		<IOGrid classes={classes} context={props.context}>
			<component.Slot
				definition={definition}
				listName="items"
				path={props.path}
				context={context}
			/>
		</IOGrid>
	)
}

Grid.displayName = "Grid"

export default Grid
