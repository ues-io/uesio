import { FunctionComponent } from "react"
import { definition, component } from "@uesio/ui"

const IODialogPlain = component.getUtility("uesio/io.dialogplain")

const PlainDialog: FunctionComponent<definition.BaseProps> = (props) => (
	<IODialogPlain context={props.context}>
		<component.Slot
			definition={props.definition}
			listName="components"
			path={props.path}
			accepts={["uesio.standalone"]}
			context={props.context}
		/>
	</IODialogPlain>
)

export default PlainDialog
