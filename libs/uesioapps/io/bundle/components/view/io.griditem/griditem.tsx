import { FunctionComponent, useRef } from "react"
import { component, styles } from "@uesio/ui"
import { GridItemProps } from "./griditemdefinition"

const GridItem: FunctionComponent<GridItemProps> = (props) => {
	const { definition, context, path } = props
	const ref = useRef<HTMLDivElement>(null)
	if (!definition) return <div />
	const classes = styles.useStyles(
		{
			root: {
				gridColumn: definition.column,
				gridArea: definition.area,
			},
		},
		props
	)
	return (
		<div ref={ref} className={classes.root}>
			<component.Slot
				parentRef={ref}
				definition={definition}
				listName="components"
				path={path}
				accepts={["uesio.standalone"]}
				context={context}
			/>
		</div>
	)
}

export default GridItem
