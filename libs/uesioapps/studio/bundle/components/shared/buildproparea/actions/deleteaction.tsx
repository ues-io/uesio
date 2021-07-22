import { FunctionComponent } from "react"
import { ActionProps } from "./actiondefinition"
import ActionButton from "./actionbutton"

const DeleteAction: FunctionComponent<ActionProps> = ({
	path,
	valueAPI,
	context,
}) => (
	<ActionButton
		title="Delete"
		onClick={() => valueAPI.remove(path)}
		icon="delete"
		context={context}
	/>
)

export default DeleteAction
