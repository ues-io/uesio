import { FunctionComponent } from "react"

import { hooks } from "@uesio/ui"
import { ButtonProps } from "./buttondefinition"
import IOButton from "../../utility/io.button/button"

const Button: FunctionComponent<ButtonProps> = (props) => {
	const { definition } = props
	const uesio = hooks.useUesio(props)
	const [handler, portals] = uesio.signal.useHandler(definition.signals)
	return (
		<>
			<IOButton {...props} label={definition.text} onClick={handler} />
			{portals}
		</>
	)
}

export default Button
