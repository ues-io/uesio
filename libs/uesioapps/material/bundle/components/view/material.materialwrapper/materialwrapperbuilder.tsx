import { FunctionComponent } from "react"
import { hooks } from "@uesio/ui"
import {
	MaterialWrapperProps,
	Materialwrapperdefinition,
} from "./materialwrapperdefinition"
import Materialwrapper from "./materialwrapper"

const Materialwrapperbuilder: FunctionComponent<MaterialWrapperProps> = (
	props
) => {
	const uesio = hooks.useUesio(props)
	const viewMode = uesio.builder.useView()
	const strucutreView = viewMode === "structureview"
	const definition = uesio.view.useDefinition(
		props.path
	) as Materialwrapperdefinition

	return (
		<div style={strucutreView ? { padding: "8px" } : {}}>
			<Materialwrapper {...props} definition={definition} />
		</div>
	)
}

export default Materialwrapperbuilder
