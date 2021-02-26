import React, { FunctionComponent } from "react"

import { hooks } from "@uesio/ui"
import { ButtonProps } from "./buttondefinition"
import IOButton from "../../utility/button/button"

const Button: FunctionComponent<ButtonProps> = (props) => {
	const { definition } = props
	const uesio = hooks.useUesio(props)
	return (
		<IOButton
			{...props}
			label={definition.text}
			onClick={
				definition?.signals &&
				uesio.signal.getHandler(definition.signals)
			}
		/>
	)
}

export default Button
