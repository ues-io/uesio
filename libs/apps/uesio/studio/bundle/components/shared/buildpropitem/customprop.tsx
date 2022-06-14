import { FunctionComponent } from "react"
import { builder } from "@uesio/ui"
import PropList from "../buildproparea/proplist"

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
		PropList,
	})

export default CustomProp
