import { FunctionComponent } from "react"

import { component, styles } from "@uesio/ui"
import { GridProps } from "./griddefinition"

const IOGrid = component.registry.getUtility("io.grid")

const Grid: FunctionComponent<GridProps> = (props) => {
	const { definition, context } = props
	const gridCols =
		definition.templateColumns &&
		styles.getResponsiveStyles(
			"gridTemplateColumns",
			definition.templateColumns,
			context
		)
	const gridRows =
		definition.templateRows &&
		styles.getResponsiveStyles(
			"gridTemplateRows",
			definition.templateRows,
			context
		)

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
		<IOGrid classes={classes} context={props.context}>
			<component.Slot
				definition={props.definition}
				listName="items"
				path={props.path}
				accepts={["io.griditem", "uesio.standalone", "uesio.field"]}
				context={props.context}
			/>
		</IOGrid>
	)
}

export default Grid
