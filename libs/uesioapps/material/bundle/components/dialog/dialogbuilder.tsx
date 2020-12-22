import { FunctionComponent } from "react";
import { DialogProps, DialogDefinition } from "./dialogdefinition"
import Dialog from "./dialog"
import { hooks } from "@uesio/ui"

const DialogBuilder: FunctionComponent<DialogProps> = (props) => {
	const uesio = hooks.useUesio(props)
	const definition = uesio.view.useDefinition(props.path) as DialogDefinition
	return <Dialog {...props} definition={definition} />
}

export default DialogBuilder
