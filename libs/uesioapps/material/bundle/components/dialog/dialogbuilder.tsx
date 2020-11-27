import React, { ReactElement } from "react"
import { DialogProps, DialogDefinition } from "./dialogdefinition"
import Dialog from "./dialog"
import { hooks } from "@uesio/ui"

function DialogBuilder(props: DialogProps): ReactElement {
	const uesio = hooks.useUesio(props)
	const definition = uesio.view.useDefinition(props.path) as DialogDefinition
	return <Dialog {...props} definition={definition} />
}

export default DialogBuilder
