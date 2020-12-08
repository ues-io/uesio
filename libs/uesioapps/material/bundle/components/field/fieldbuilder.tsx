import React, { ReactElement } from "react"
import { FieldProps, FieldDefinition } from "./fielddefinition"
import Field from "./field"
import { hooks } from "@uesio/ui"

const FieldBuilder = (props: FieldProps): ReactElement | null => {
	const uesio = hooks.useUesio(props)
	const definition = uesio.view.useDefinition(props.path) as FieldDefinition

	if (definition) {
		return <Field {...props} definition={definition} />
	}
	return <Field {...props} />
}

export default FieldBuilder
