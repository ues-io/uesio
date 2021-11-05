import { FunctionComponent } from "react"
import { component, styles } from "@uesio/ui"
import { GridItemProps } from "./griditemdefinition"

const GridItem: FunctionComponent<GridItemProps> = (props) => {
	const { definition, context, path } = props
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
		<div className={classes.root}>
			<component.Slot
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
