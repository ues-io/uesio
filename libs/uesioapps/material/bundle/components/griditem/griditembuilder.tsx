import { FunctionComponent } from "react";
import { GridItemProps, GridItemDefinition } from "./griditemdefinition"
import GridItem from "./griditem"
import { hooks } from "@uesio/ui"

const GridItemBuilder: FunctionComponent<GridItemProps> = (props) => {
	const uesio = hooks.useUesio(props)
	const definition = uesio.view.useDefinition(
		props.path
	) as GridItemDefinition
	return <GridItem {...props} definition={definition} />
}

export default GridItemBuilder
