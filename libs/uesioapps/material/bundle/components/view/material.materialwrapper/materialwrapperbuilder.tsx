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
	const isStructureView = uesio.builder.useIsStructureView()
	const definition = uesio.view.useDefinition(
		props.path
	) as Materialwrapperdefinition

	return (
		<div style={isStructureView ? { padding: "8px" } : {}}>
			<Materialwrapper {...props} definition={definition} />
		</div>
	)
}

export default Materialwrapperbuilder
