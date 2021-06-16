import { FunctionComponent } from "react"
import { GroupProps, GroupDefinition } from "./groupdefinition"
import Group from "./group"
import { hooks, styles } from "@uesio/ui"

const GroupBuilder: FunctionComponent<GroupProps> = (props) => {
	const classes = styles.useStyles(
		{
			root: {
				pointerEvents: "none",
			},
		},
		{
			context: props.context,
		}
	)

	const uesio = hooks.useUesio(props)
	const definition = uesio.view.useDefinition(props.path) as GroupDefinition

	return (
		<div className={classes.root}>
			<Group {...props} definition={definition} />
		</div>
	)
}

export default GroupBuilder
