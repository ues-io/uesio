import React, { ReactElement } from "react"
import { component, material, styles } from "@uesio/ui"
import { GridProps } from "./griddefinition"

const useStyles = material.makeStyles(() => {
	return material.createStyles({
		root: (props: GridProps) => ({
			height: props.definition.height,
			...styles.getBackgroundStyles(
				props.definition.background,
				props.context
			),
		}),
	})
})

function Grid(props: GridProps): ReactElement {
	const classes = useStyles(props)

	const slotprops = {
		definition: props.definition,
		listName: "items",
		path: props.path,
		accepts: ["material.griditem"],
		direction: "manual",
		context: props.context,
	}

	const gridProps = {
		className: classes.root,
		justify: props.definition.justify,
		direction: props.definition.direction,
		alignItems: props.definition.alignitems,
		container: true,
		spacing: props.definition.spacing,
	}
	return (
		<material.Grid {...gridProps}>
			<component.Slot {...slotprops} />
		</material.Grid>
	)
}

export default Grid
