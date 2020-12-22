import { FunctionComponent } from "react"
import { component } from "@uesio/ui"
import { ButtonSetProps } from "./buttonsetdefinition"

const ButtonSet: FunctionComponent<ButtonSetProps> = ({
	definition,
	path,
	context,
}) => (
	<div>
		<component.Slot
			definition={definition}
			listName="buttons"
			path={path}
			accepts={["material.button"]}
			direction="horizontal"
			context={context}
		/>
	</div>
)

export default ButtonSet
