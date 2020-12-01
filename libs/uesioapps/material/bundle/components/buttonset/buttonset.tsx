import React, { FunctionComponent } from "react"
import { component } from "@uesio/ui"
import { ButtonSetProps } from "./buttonsetdefinition"

const ButtonSet: FunctionComponent<ButtonSetProps> = (props) => (
	<div>
		<component.Slot
			definition={props.definition}
			listName="buttons"
			path={props.path}
			accepts={["material.button"]}
			direction="horizontal"
			context={props.context}
		/>
	</div>
)

export default ButtonSet
