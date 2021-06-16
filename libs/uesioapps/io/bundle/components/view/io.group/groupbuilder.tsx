import { FunctionComponent } from "react"
import { GroupProps } from "./groupdefinition"
import Group from "./group"
import { component } from "@uesio/ui"

const BuildWrapper = component.registry.getUtility("studio.buildwrapper")

const GroupBuilder: FunctionComponent<GroupProps> = (props) => (
	<BuildWrapper {...props}>
		<Group {...props} />
	</BuildWrapper>
)

export default GroupBuilder
