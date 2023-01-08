import ActionButton from "../shared/buildproparea/actions/actionbutton"
import { clone } from "../api/defapi"
import { definition } from "@uesio/ui"

const CloneAction: definition.UtilityComponent = ({ path = "", context }) => (
	<ActionButton
		title="Clone"
		onClick={() => clone(path)}
		icon="content_copy"
		context={context}
	/>
)

export default CloneAction
