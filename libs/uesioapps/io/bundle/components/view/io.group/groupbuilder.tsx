import { FunctionComponent } from "react"
import { GroupProps, GroupDefinition } from "./groupdefinition"
import Group from "./group"
import { hooks, styles } from "@uesio/ui"

const GroupBuilder: FunctionComponent<GroupProps> = (props) => {
	const uesio = hooks.useUesio(props)
	const definition = uesio.view.useDefinition(props.path) as GroupDefinition

	return <Group {...props} definition={definition} />
}

export default GroupBuilder
