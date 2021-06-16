import { FunctionComponent } from "react"
import { BoxProps, BoxDefinition } from "./boxdefinition"
import Box from "./box"
import { hooks, styles } from "@uesio/ui"

const BoxBuilder: FunctionComponent<BoxProps> = (props) => {
	const uesio = hooks.useUesio(props)
	const definition = uesio.view.useDefinition(props.path) as BoxDefinition

	return <Box {...props} definition={definition} />
}

export default BoxBuilder
