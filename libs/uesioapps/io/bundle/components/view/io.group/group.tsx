import { FunctionComponent, createRef, useRef } from "react"

import { component, styles } from "@uesio/ui"
import { GroupProps } from "./groupdefinition"

const IOGroup = component.registry.getUtility("io.group")

const Grid: FunctionComponent<GroupProps> = (props) => {
	const { context, definition, path } = props
	const ref = useRef<HTMLDivElement>(null)
	const classes = styles.useStyles(
		{
			root: {},
		},
		props
	)
	return (
		<IOGroup
			ref={ref}
			classes={classes}
			columnGap={definition.columnGap}
			alignItems={definition.alignItems}
			context={context}
		>
			<component.Slot
				parentRef={ref}
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
