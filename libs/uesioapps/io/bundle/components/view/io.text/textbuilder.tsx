import { FunctionComponent } from "react"
import { TextProps, TextDefinition } from "./textdefinition"
import Text from "./text"
import { hooks } from "@uesio/ui"

const TextBuilder: FunctionComponent<TextProps> = (props) => {
	const uesio = hooks.useUesio(props)
	const definition = uesio.view.useDefinition(props.path) as TextDefinition
	return <Text {...props} definition={definition} />
}

export default TextBuilder
