import { FunctionComponent } from "react"
import { ActionProps } from "./actiondefinition"
import ActionButton from "./actionbutton"
import { component } from "@uesio/ui"

const CloneAction: FunctionComponent<ActionProps> = ({
	path = "",
	valueAPI,
	context,
	propsDef,
}) => {
	const isComponent = propsDef?.type === "component"
	const clonePath = isComponent ? component.path.getParentPath(path) : path
	return (
		<ActionButton
			title="Clone"
			onClick={() => valueAPI.clone(clonePath)}
			icon="content_copy"
			context={context}
		/>
	)
}

export default CloneAction
