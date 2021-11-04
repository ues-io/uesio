import { FunctionComponent, useRef } from "react"

import { component, styles } from "@uesio/ui"
import { GridProps } from "./griddefinition"

const IOGrid = component.registry.getUtility("io.grid")

const Grid: FunctionComponent<GridProps> = (props) => {
	const { definition, context } = props
	const ref = useRef<HTMLDivElement>(null)
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
	const classes = styles.useStyles(
		{
			root: {
				...gridCols,
				...gridRows,
				...gridAreas,
				...columnGap,
			},
		},
		props
	)
	return (
		<IOGrid ref={ref} classes={classes} context={props.context}>
			<component.Slot
				parentRef={ref}
				definition={definition}
				listName="items"
				path={props.path}
				accepts={["io.griditem", "uesio.standalone", "uesio.field"]}
				context={context}
			/>
		</IOGrid>
	)
}

export default Grid
