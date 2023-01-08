import ActionButton from "../shared/buildproparea/actions/actionbutton"
import { definition } from "@uesio/ui"
import { cloneKey } from "../api/defapi"

const CloneKeyAction: definition.UtilityComponent = ({
	path = "",
	context,
}) => (
	<ActionButton
		title="Clone"
		onClick={() => cloneKey(path)}
		icon="content_copy"
		context={context}
	/>
)

export default CloneKeyAction
