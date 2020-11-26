import React, { ReactElement } from "react"
import { hooks } from "@uesio/ui"
import { GridProps, GridDefinition } from "./griddefinition"
import Grid from "./grid"

function GridBuilder(props: GridProps): ReactElement {
	const uesio = hooks.useUesio(props)
	const definition = uesio.view.useDefinition(props.path) as GridDefinition
	return <Grid {...props} definition={definition} />
}

export default GridBuilder
