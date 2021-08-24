import { FunctionComponent } from "react"
import { component } from "@uesio/ui"
import { ActionProps } from "./actiondefinition"
import MoveActionsComp from "./componenets/moveactions"
import MoveActionsMaps from "./maps/moveactions"

const MoveActions: FunctionComponent<ActionProps> = (props) => {
	const { path = "" } = props
	const [metadataType] = component.path.getFullPathParts(path)

	if (metadataType === "wires") {
		return <MoveActionsMaps {...props} />
	}

	return <MoveActionsComp {...props} />
}

export default MoveActions
