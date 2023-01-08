import ActionButton from "../shared/buildproparea/actions/actionbutton"
import { remove } from "../api/defapi"
import { definition } from "@uesio/ui"

const DeleteAction: definition.UtilityComponent = ({ path, context }) => (
	<ActionButton
		title="Delete"
		onClick={() => remove(path)}
		icon="delete"
		context={context}
	/>
)

export default DeleteAction
