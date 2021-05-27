import { FunctionComponent } from "react"

import { component } from "@uesio/ui"
import { GroupProps } from "./groupdefinition"

const IOGroup = component.registry.getUtility("io.group")

const Grid: FunctionComponent<GroupProps> = (props) => (
	<IOGroup context={props.context}>
		<component.Slot
			definition={props.definition}
			listName="components"
			path={props.path}
			accepts={["uesio.standalone"]}
			context={props.context}
		/>
	</IOGroup>
)

export default Grid
