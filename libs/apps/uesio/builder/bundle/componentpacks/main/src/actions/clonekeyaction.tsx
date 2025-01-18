import ActionButton from "../helpers/actionbutton"
import { definition } from "@uesio/ui"
import { cloneKey } from "../api/defapi"
import { FullPath } from "../api/path"

type Props = {
  path: FullPath
}

const CloneKeyAction: definition.UtilityComponent<Props> = ({
  path,
  context,
}) => (
  <ActionButton
    title="Clone"
    onClick={() => cloneKey(context, path)}
    icon="content_copy"
    context={context}
  />
)

export default CloneKeyAction
