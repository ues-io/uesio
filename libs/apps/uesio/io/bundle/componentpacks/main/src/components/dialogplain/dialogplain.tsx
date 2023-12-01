import { definition, component } from "@uesio/ui"
import { default as IODialogPlain } from "../../utilities/dialogplain/dialogplain"

const PlainDialog: definition.UC = ({
	context,
	definition,
	path,
	componentType,
}) => (
	<IODialogPlain context={context}>
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
