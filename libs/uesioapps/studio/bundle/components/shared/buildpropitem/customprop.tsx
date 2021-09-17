import { FunctionComponent } from "react"
import { PropRendererProps } from "./proprendererdefinition"
import { builder, component } from "@uesio/ui"

interface CustomPropRendererProps extends PropRendererProps {
	descriptor: builder.CustomProp
}

const CustomProp: FunctionComponent<CustomPropRendererProps> = ({
	descriptor,
	valueAPI,
	context,
	path,
}) =>
	descriptor.renderFunc({
		descriptor,
		valueAPI,
		context,
		path,
	})

export default CustomProp

export { CustomPropRendererProps }
