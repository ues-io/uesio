import { FunctionComponent } from "react"
import { builder, component } from "@uesio/ui"

interface T extends builder.PropRendererProps {
	descriptor: builder.ConditionalDisplayProp
}

const ConditionalDisplayProp: FunctionComponent<T> = ({
	descriptor,
	valueAPI,
	context,
	path,
}) => <h1>Conditional display</h1>

export default ConditionalDisplayProp
