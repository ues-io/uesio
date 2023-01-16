import ActionButton from "../shared/buildproparea/actions/actionbutton"
import { remove } from "../api/defapi"
import { definition } from "@uesio/ui"
import { FullPath } from "../api/path"

type Props = {
	path: FullPath
}

const DeleteAction: definition.UtilityComponent<Props> = ({
	path,
	context,
}) => (
	<ActionButton
		title="Delete"
		onClick={() => remove(context, path)}
		icon="delete"
		context={context}
	/>
)

export default DeleteAction
