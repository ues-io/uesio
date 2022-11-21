import { FunctionComponent } from "react"

import { component, styles } from "@uesio/ui"
import { GridProps } from "./griddefinition"

const IOGrid = component.getUtility("uesio/io.grid")

const Grid: FunctionComponent<GridProps> = (props) => {
	const { definition, context } = props
	const gridCols = styles.getResponsiveStyles(
		"gridTemplateColumns",
		definition.templateColumns,
		context
	)
	const gridRows = styles.getResponsiveStyles(
		"gridTemplateRows",
		definition.templateRows,
		context
	)

	const gridAreas = styles.getResponsiveStyles(
		"gridTemplateAreas",
		definition.templateAreas,
		context
	)

	const columnGap = definition.columnGap && {
		gridColumnGap: definition.columnGap,
	}

	const rowGap = definition.rowGap && {
		gridRowGap: definition.rowGap,
	}

	const classes = styles.useStyles(
		{
			root: {
				...gridCols,
				...gridRows,
				...gridAreas,
				...columnGap,
				...rowGap,
			},
		},
		props
	)
	return (
		<IOGrid classes={classes} context={props.context}>
			<component.Slot
				definition={definition}
				listName="items"
				path={props.path}
				accepts={[
					"uesio/io.griditem",
					"uesio.standalone",
					"uesio.field",
				]}
				context={context}
			/>
		</IOGrid>
	)
}

export default Grid
