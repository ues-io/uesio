import { definition, component } from "@uesio/ui"
import { default as IODialogPlain } from "../../utilities/dialogplain/dialogplain"

const PlainDialog: definition.UC = (props) => (
	<IODialogPlain context={props.context}>
		<component.Slot
			definition={props.definition}
			listName="components"
			path={props.path}
			context={props.context}
		/>
	</IODialogPlain>
)

export default PlainDialog
