import { definition, component } from "@uesio/ui"
import { default as IODialogPlain } from "../../utilities/dialogplain/dialogplain"
import { DialogDefinition } from "../dialog/dialog"

const PlainDialog: definition.UC<DialogDefinition> = ({
  context,
  definition,
  path,
  componentType,
}) => (
  <IODialogPlain context={context} closed={definition.closed}>
    <component.Slot
      definition={definition}
      listName="components"
      path={path}
      context={context}
      componentType={componentType}
    />
  </IODialogPlain>
)

export default PlainDialog
