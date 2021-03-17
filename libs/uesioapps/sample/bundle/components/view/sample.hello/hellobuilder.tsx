import { FunctionComponent } from "react"
import Hello from "./hello"
import { hooks } from "@uesio/ui"
import { HelloProps, HelloDefinition } from "./hellodefinition"

const HelloBuilder: FunctionComponent<HelloProps> = (props) => {
	const uesio = hooks.useUesio(props)
	const definition = uesio.view.useDefinition(props.path) as HelloDefinition
	return <Hello {...props} definition={definition} />
}

export default HelloBuilder
