import React, { ReactElement } from "react"
import Hello from "./hello"
import { hooks } from "@uesio/ui"
import { HelloProps, HelloDefinition } from "./hellodefinition"

function HelloBuilder(props: HelloProps): ReactElement {
	const uesio = hooks.useUesio(props)
	const definition = uesio.view.useDefinition(props.path) as HelloDefinition
	return <Hello {...props} definition={definition}></Hello>
}

export default HelloBuilder
