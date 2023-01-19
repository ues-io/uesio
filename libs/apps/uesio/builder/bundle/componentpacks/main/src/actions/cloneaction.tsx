import ActionButton from "../helpers/actionbutton"
import { clone } from "../api/defapi"
import { definition } from "@uesio/ui"
import { FullPath } from "../api/path"

type Props = {
	path: FullPath
}

const CloneAction: definition.UtilityComponent<Props> = ({ path, context }) => (
	<ActionButton
		title="Clone"
		onClick={() => clone(context, path)}
		icon="content_copy"
		context={context}
	/>
)

export default CloneAction
