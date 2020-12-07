import React, { ReactElement } from "react"
import { FieldProps, FieldDefinition } from "./fielddefinition"
import Field from "./field"
import { hooks } from "@uesio/ui"

const FieldBuilder = (props: FieldProps): ReactElement => {
	const uesio = hooks.useUesio(props)
	const definition = uesio.view.useDefinition(props.path) as FieldDefinition
	return <Field {...props} definition={definition} />
}

export default FieldBuilder
