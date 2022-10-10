import { builder } from "@uesio/ui"

const CustomProp: builder.PropComponent<builder.CustomProp> = ({
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
