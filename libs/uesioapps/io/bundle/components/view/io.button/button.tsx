import { FunctionComponent } from "react"

import { hooks, styles } from "@uesio/ui"
import { ButtonProps } from "./buttondefinition"
import IOButton from "../../utility/io.button/button"

const Button: FunctionComponent<ButtonProps> = (props) => {
	const { definition, context } = props
	const uesio = hooks.useUesio(props)
	const classes = styles.useStyles(
		{
			root: {},
			label: {},
		},
		props
	)
	const [handler, portals] = uesio.signal.useHandler(definition.signals)
	return (
		<>
			<IOButton
				classes={classes}
				label={definition.text}
				onClick={handler}
				context={context}
			/>
			{portals}
		</>
	)
}

export default Button
