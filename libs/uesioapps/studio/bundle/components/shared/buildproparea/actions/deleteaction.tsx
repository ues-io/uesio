import { FunctionComponent } from "react"
import { hooks } from "@uesio/ui"
import DeleteIcon from "@material-ui/icons/Delete"
import { ActionProps } from "./actiondefinition"
import ActionButton from "./actionbutton"

const DeleteAction: FunctionComponent<ActionProps> = (props) => {
	const uesio = hooks.useUesio(props)
	return (
		<ActionButton
			title="Delete"
			onClick={(): void => uesio.view.removeDefinition()}
			icon={DeleteIcon}
		/>
	)
}

export default DeleteAction
