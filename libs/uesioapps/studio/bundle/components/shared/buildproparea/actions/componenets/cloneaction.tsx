import { FunctionComponent } from "react"
import { ActionProps } from "../actiondefinition"
import ActionButton from "../actionbutton"

const CloneActionComp: FunctionComponent<ActionProps> = ({
	path = "",
	valueAPI,
	action = { label: "copy" },
	context,
}) => (
	<ActionButton
		title={action.label}
		onClick={() => valueAPI.clone(path)}
		icon="copy"
		context={context}
	/>
)

export default CloneActionComp
