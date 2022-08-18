import { FC } from "react"
import { builder } from "@uesio/ui"
import { ActionProps } from "./actiondefinition"
import ActionButton from "./actionbutton"

const AddAction: FC<ActionProps<builder.CustomAction>> = ({
	action,
	context,
}) =>
	!action ? null : (
		<ActionButton
			title={action.label}
			onClick={action.handler}
			icon={action.icon}
			context={context}
		/>
	)

export default AddAction
