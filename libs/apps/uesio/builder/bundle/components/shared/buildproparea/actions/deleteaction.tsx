import { FunctionComponent } from "react"
import { ActionProps } from "./actiondefinition"
import ActionButton from "./actionbutton"
import { component } from "@uesio/ui"

const DeleteAction: FunctionComponent<ActionProps> = ({
	path,
	valueAPI,
	context,
	propsDef,
}) => {
	if (!path) return null

	return (
		<ActionButton
			title="Delete"
			onClick={() =>
				valueAPI.remove(
					propsDef?.type === "component"
						? component.path.getParentPath(path)
						: path
				)
			}
			icon="delete"
			context={context}
		/>
	)
}

export default DeleteAction
