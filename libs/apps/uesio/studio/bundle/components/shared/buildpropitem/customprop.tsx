import { FunctionComponent } from "react"
import { builder } from "@uesio/ui"

const CustomProp: FunctionComponent<builder.CustomPropRendererProps> = ({
	descriptor,
	valueAPI,
	context,
	path,
	propsDef,
}) =>
	descriptor.renderFunc({
		descriptor,
		valueAPI,
		context,
		path,
		propsDef,
	})

export default CustomProp
