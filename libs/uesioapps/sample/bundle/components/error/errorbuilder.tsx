import React, { ReactElement } from "react"
import Error from "./error"
import { hooks } from "@uesio/ui"
import { ErrorProps, ErrorDefinition } from "./errordefinition"

function ErrorBuilder(props: ErrorProps): ReactElement {
	const uesio = hooks.useUesio(props)
	const definition = uesio.view.useDefinition(props.path) as ErrorDefinition
	return <Error {...props} definition={definition} />
}

export default ErrorBuilder
