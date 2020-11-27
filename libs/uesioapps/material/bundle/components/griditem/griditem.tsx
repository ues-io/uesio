import React, { ReactElement } from "react"
import { material, component, styles } from "@uesio/ui"
import { GridItemProps } from "./griditemdefinition"

const useStyles = material.makeStyles(() => {
	return material.createStyles({
		root: (props: GridItemProps) => ({
			height: props.definition.height,
			...styles.getBackgroundStyles(
				props.definition.background,
				props.context
			),
			...(props.definition.align && {
				textAlign: props.definition.align,
			}),
		}),
	})
})

function GridItem(props: GridItemProps): ReactElement {
	const classes = useStyles(props)

	const slotprops = {
		definition: props.definition,
		listName: "components",
		path: props.path,
		accepts: ["uesio.standalone"],
		context: props.context,
	}

	const gridItemProps = {
		className: classes.root,
		xs: props.definition.xs,
		sm: props.definition.sm,
		md: props.definition.md,
		lg: props.definition.lg,
		xl: props.definition.xl,
		item: true,
	}

	return (
		<material.Grid {...gridItemProps}>
			<component.Slot {...slotprops} />
		</material.Grid>
	)
}

export default GridItem
