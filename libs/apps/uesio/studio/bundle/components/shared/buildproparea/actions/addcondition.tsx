import { FunctionComponent } from "react"
import { builder } from "@uesio/ui"
import { ActionProps } from "./actiondefinition"
import ActionButton from "./actionbutton"

const AddCondition: FunctionComponent<ActionProps> = (props) => {
	const action = props.action as builder.AddCondition

	if (!action) {
		return null
	}

	const onClickHandler = (): void => {
		props.valueAPI.add(`${action.path}["conditions"]`, action.definition)
	}

	return (
		<ActionButton
			title={action.label}
			onClick={onClickHandler}
			icon={action.logo}
			context={props.context}
		/>
	)
}

export default AddCondition
