import { FunctionComponent } from "react"
import { ActionProps } from "./actiondefinition"
import ActionButton from "./actionbutton"

const CloneKeyAction: FunctionComponent<ActionProps> = ({
	path = "",
	valueAPI,
	context,
}) => (
	<ActionButton
		title="Clone"
		onClick={() => valueAPI.cloneKey(path)}
		icon="content_copy"
		context={context}
	/>
)

export default CloneKeyAction
