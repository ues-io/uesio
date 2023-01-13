import ActionButton from "../shared/buildproparea/actions/actionbutton"
import { clone } from "../api/defapi"
import { definition } from "@uesio/ui"
import { FullPath } from "../api/stateapi"

type Props = {
	path: FullPath
}

const CloneAction: definition.UtilityComponent<Props> = ({ path, context }) => (
	<ActionButton
		title="Clone"
		onClick={() => clone(path)}
		icon="content_copy"
		context={context}
	/>
)

export default CloneAction
