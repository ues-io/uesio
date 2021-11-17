import { FunctionComponent } from "react"
import { ActionProps } from "./actiondefinition"
import ActionButton from "./actionbutton"

const CloneAction: FunctionComponent<ActionProps> = ({
	path = "",
	valueAPI,
	context,
}) => (
	<ActionButton
		title="Clone"
		onClick={() => valueAPI.clone(path)}
		icon="copy"
		context={context}
	/>
)

export default CloneAction
