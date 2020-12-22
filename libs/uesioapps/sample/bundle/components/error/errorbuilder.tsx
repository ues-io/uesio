import { FunctionComponent } from "react"
import Error from "./error"
import { hooks } from "@uesio/ui"
import { ErrorProps, ErrorDefinition } from "./errordefinition"

const ErrorBuilder: FunctionComponent<ErrorProps> = (props) => {
	const uesio = hooks.useUesio(props)
	const definition = uesio.view.useDefinition(props.path) as ErrorDefinition
	return <Error {...props} definition={definition} />
}

export default ErrorBuilder
