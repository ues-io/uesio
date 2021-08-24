import { FunctionComponent } from "react"
import { ActionProps } from "./actiondefinition"
import { component } from "@uesio/ui"

import CloneActionComp from "./componenets/cloneaction"
import CloneActionMaps from "./maps/cloneaction"

const CloneAction: FunctionComponent<ActionProps> = (props) => {
	const { path = "" } = props
	const [metadataType] = component.path.getFullPathParts(path)

	if (metadataType === "wires") {
		return <CloneActionMaps {...props} />
	}

	return <CloneActionComp {...props} />
}

export default CloneAction
