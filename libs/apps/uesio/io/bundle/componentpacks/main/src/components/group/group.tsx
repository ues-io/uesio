import { component, styles, definition } from "@uesio/ui"
import { default as IOGroup } from "../../utilities/group/group"

type GroupDefinition = {
	components?: definition.DefinitionList
}

const Grid: definition.UC<GroupDefinition> = (props) => {
	const { context, definition, path } = props
	const classes = styles.useStyles(
		{
			root: {},
		},
		props
	)
	return (
		<IOGroup classes={classes} context={context}>
			<component.Slot
				definition={definition}
				listName="components"
				path={path}
				context={context}
				direction="HORIZONTAL"
			/>
		</IOGroup>
	)
}

export default Grid
