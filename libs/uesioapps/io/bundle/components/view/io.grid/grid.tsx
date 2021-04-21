import { FunctionComponent } from "react"

import { component, styles } from "@uesio/ui"
import { GridProps } from "./griddefinition"

const IOGrid = component.registry.getUtility("io.grid")

const Grid: FunctionComponent<GridProps> = (props) => {
	const definition = props.definition
	const gridCols =
		definition.templateColumns &&
		styles.getResponsiveStyles(
			"gridTemplateColumns",
			definition.templateColumns
		)
	const gridRows =
		definition.templateRows &&
		styles.getResponsiveStyles("gridTemplateRows", definition.templateRows)

	const columnGap = definition.columnGap && {
		gridColumnGap: definition.columnGap,
	}
	const classes = styles.useStyles(
		{
			root: {
				...gridCols,
				...gridRows,
				...columnGap,
			},
		},
		props
	)
	return (
		<IOGrid className={classes.root} context={props.context}>
			<component.Slot
				definition={props.definition}
				listName="items"
				path={props.path}
				accepts={["io.griditem"]}
				context={props.context}
			/>
		</IOGrid>
	)
}

export default Grid
