import { FunctionComponent } from "react"
import { hooks } from "@uesio/ui"
import { ActionProps } from "./actiondefinition"
import ActionButton from "./actionbutton"

const DeleteAction: FunctionComponent<ActionProps> = (props) => {
	const uesio = hooks.useUesio(props)
	return (
		<ActionButton
			title="Delete"
			onClick={(): void => uesio.view.removeDefinition()}
			icon="delete"
			context={props.context}
		/>
	)
}

export default DeleteAction
