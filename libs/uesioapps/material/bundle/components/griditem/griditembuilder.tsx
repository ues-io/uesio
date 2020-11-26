import React, { ReactElement } from "react"
import { GridItemProps, GridItemDefinition } from "./griditemdefinition"
import GridItem from "./griditem"
import { hooks } from "@uesio/ui"

function GridItemBuilder(props: GridItemProps): ReactElement {
	const uesio = hooks.useUesio(props)
	const definition = uesio.view.useDefinition(
		props.path
	) as GridItemDefinition
	return <GridItem {...props} definition={definition} />
}

export default GridItemBuilder
