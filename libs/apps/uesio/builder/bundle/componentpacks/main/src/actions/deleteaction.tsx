import ActionButton from "../helpers/actionbutton"
import { remove } from "../api/defapi"
import { definition } from "@uesio/ui"
import { FullPath } from "../api/path"
import { setSelectedPath, useSelectedPath } from "../api/stateapi"

type Props = {
	path: FullPath
}

const DeleteAction: definition.UtilityComponent<Props> = ({
	path,
	context,
	id,
}) => {
	const selectedPath = useSelectedPath(context)
	return (
		<ActionButton
			title="Delete"
			onClick={() => {
				remove(context, path)
				if (path.startsWith(selectedPath)) {
					setSelectedPath(context, selectedPath.setLocal(""))
				}
			}}
			icon="delete"
			id={`${id}:delete-selected`}
			context={context}
		/>
	)
}

export default DeleteAction
