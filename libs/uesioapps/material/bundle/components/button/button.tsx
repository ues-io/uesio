import React, { FunctionComponent } from "react"

import { hooks, material, styles } from "@uesio/ui"
import { ButtonProps } from "./buttondefinition"

const useStyles = material.makeStyles((theme) =>
	material.createStyles({
		root: (props: ButtonProps) => ({
			fontWeight: 400,
			margin: theme.spacing(
				styles.useStyleProperty(props.definition.margin, 1)
			),
		}),
	})
)

const Button: FunctionComponent<ButtonProps> = (props) => {
	const {
		definition: { color, variant, fullWidth, signals, text },
	} = props
	const classes = useStyles(props)
	const uesio = hooks.useUesio(props)
	const buttonProps = {
		className: classes.root,
		color: color || "primary",
		variant: variant || "contained",
		fullWidth: fullWidth,
		onClick: signals && uesio.signal.getHandler(signals),
	}

	return <material.Button {...buttonProps}>{text}</material.Button>
}

export default Button
