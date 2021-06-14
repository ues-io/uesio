import { FunctionComponent } from "react"

import { component, styles } from "@uesio/ui"
import { GroupProps } from "./groupdefinition"

const IOGroup = component.registry.getUtility("io.group")

const Grid: FunctionComponent<GroupProps> = (props) => {
	const { context, definition, path } = props
	const classes = styles.useStyles(
		{
			root: {},
		},
		props
	)
	return (
		<IOGroup
			classes={classes}
			columnGap={definition.columnGap}
			context={context}
		>
			<component.Slot
				definition={definition}
				listName="components"
				path={path}
				accepts={["uesio.standalone"]}
				context={context}
				direction="horizontal"
			/>
		</IOGroup>
	)
}

export default Grid
