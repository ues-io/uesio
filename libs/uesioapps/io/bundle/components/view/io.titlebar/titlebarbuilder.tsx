import { FunctionComponent } from "react"
import { TitleBarProps, TitleBarDefinition } from "./titlebardefinition"
import TitleBar from "./titlebar"
import { hooks, styles } from "@uesio/ui"

const TitleBarBuilder: FunctionComponent<TitleBarProps> = (props) => {
	const uesio = hooks.useUesio(props)
	const definition = uesio.view.useDefinition(
		props.path
	) as TitleBarDefinition

	return <TitleBar {...props} definition={definition} />
}

export default TitleBarBuilder
