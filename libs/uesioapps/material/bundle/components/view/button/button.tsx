import React, { FunctionComponent } from "react"

import { hooks, styles } from "@uesio/ui"
import { ButtonProps } from "./buttondefinition"
import * as material from "@material-ui/core"

const stylesObj = {
	root: (props: ButtonProps) => ({
		fontWeight: 400,
		margin: styles.getSpacing(
			props.context.getTheme(),
			props.definition.margin || 1
		),
	}),
}

const useStyles = styles.getUseStyles(["root"], stylesObj)

const Button: FunctionComponent<ButtonProps> = (props) => {
	const { definition } = props
	const uesio = hooks.useUesio(props)
	const classes = useStyles(props)

	return (
		<material.Button
			className={classes.root}
			color={props.definition.color || "primary"}
			variant={definition?.variant || "contained"}
			fullWidth={definition.fullWidth}
			onClick={
				definition?.signals &&
				uesio.signal.getHandler(definition.signals)
			}
		>
			{definition?.text}
		</material.Button>
	)
}

export default Button
