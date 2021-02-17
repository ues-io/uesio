import React, { FunctionComponent } from "react"

import { hooks, material, styles } from "@uesio/ui"
import { ButtonProps } from "./buttondefinition"

const stylesObj = {
	root: (props: ButtonProps, theme: styles.Theme) => ({
		fontWeight: 400,
		margin: theme.spacing(
			styles.useStyleProperty(props.definition.margin, 1)
		),
	}),
}

const useStyles = styles.getUseStyles(["root"], stylesObj)

const Button: FunctionComponent<ButtonProps> = (props) => {
	const { definition } = props
	const classes = useStyles(props)
	const uesio = hooks.useUesio(props)

	return (
		<material.Button
			className={classes.root}
			color={definition?.color || "primary"}
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
