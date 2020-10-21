import React, { ReactElement } from "react"
import { hooks } from "@uesio/ui"
import DeleteIcon from "@material-ui/icons/Delete"
import { ActionProps } from "./actiondefinition"
import ActionButton from "./actionbutton"

function DeleteAction(props: ActionProps): ReactElement {
	const uesio = hooks.useUesio(props)
	return (
		<ActionButton
			title="Delete"
			onClick={(): void => {
				uesio.view.removeDefinition()
			}}
			icon={DeleteIcon}
		></ActionButton>
	)
}

export default DeleteAction
