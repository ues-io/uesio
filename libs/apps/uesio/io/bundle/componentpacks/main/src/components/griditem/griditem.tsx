import { component, styles, definition } from "@uesio/ui"

type GridItemDefinition = {
	column?: string
	area?: string
}

const GridItem: definition.UC<GridItemDefinition> = (props) => {
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
				context={context}
			/>
		</div>
	)
}

export default GridItem
