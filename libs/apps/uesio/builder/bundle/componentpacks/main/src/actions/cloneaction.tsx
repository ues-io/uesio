import ActionButton from "../helpers/actionbutton"
import { clone } from "../api/defapi"
import { definition } from "@uesio/ui"
import { FullPath } from "../api/path"

type Props = {
	path: FullPath
	purgeProperties?: string[]
}

const CloneAction: definition.UtilityComponent<Props> = ({
	path,
	purgeProperties,
	context,
	id,
}) => (
	<ActionButton
		title="Clone"
		onClick={() => clone(context, path, purgeProperties)}
		icon="content_copy"
		id={`${id}:clone-selected`}
		context={context}
	/>
)

export default CloneAction
