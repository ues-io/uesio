import { component, styles, definition } from "@uesio/ui"

type GridItemDefinition = {
	column?: string
	area?: string
}

interface GridItemProps extends definition.BaseProps {
	definition?: GridItemDefinition
}

const GridItem: definition.UesioComponent<GridItemProps> = (props) => {
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

/*
const GridItemPropertyDefinition: builder.BuildPropertiesDefinition = {
	title: "Grid Item",
	description: "Grid Item",
	link: "https://docs.ues.io/",
	defaultDefinition: () => ({
		components: [],
	}),
	properties: [
		{
			name: "column",
			type: "TEXT",
			label: "Column",
		},
		{
			name: "area",
			type: "TEXT",
			label: "Area",
		},
	],
	sections: [],
	classes: ["root"],
	type: "component",
}
*/

export default GridItem
