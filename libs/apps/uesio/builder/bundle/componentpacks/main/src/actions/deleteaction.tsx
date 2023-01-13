import ActionButton from "../shared/buildproparea/actions/actionbutton"
import { remove } from "../api/defapi"
import { definition } from "@uesio/ui"
import { FullPath } from "../api/stateapi"

type Props = {
	path: FullPath
}

const DeleteAction: definition.UtilityComponent<Props> = ({
	path,
	context,
}) => (
	<ActionButton
		title="Delete"
		onClick={() => remove(path)}
		icon="delete"
		context={context}
	/>
)

export default DeleteAction
