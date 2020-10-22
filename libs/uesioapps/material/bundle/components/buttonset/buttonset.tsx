import React, { ReactElement } from "react"
import { component } from "@uesio/ui"
import { ButtonSetProps } from "./buttonsetdefinition"

function ButtonSet(props: ButtonSetProps): ReactElement {
	const slotProps = {
		definition: props.definition,
		listName: "buttons",
		path: props.path,
		accepts: ["material.button"],
		direction: "horizontal",
		context: props.context,
	}
	return (
		<div>
			<component.Slot {...slotProps}></component.Slot>
		</div>
	)
}

export default ButtonSet
