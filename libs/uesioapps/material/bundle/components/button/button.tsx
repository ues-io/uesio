import React, { ReactElement } from "react"

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

function Button(props: ButtonProps): ReactElement {
	const classes = useStyles(props)
	const uesio = hooks.useUesio(props)
	const buttonProps = {
		className: classes.root,
		color: props.definition?.color || "primary",
		variant: props.definition?.variant || "contained",
		fullWidth: props.definition.fullWidth,
		onClick:
			props.definition?.signals &&
			uesio.signal.getHandler(props.definition.signals),
	}

	return (
		<material.Button {...buttonProps}>
			{props.definition?.text}
		</material.Button>
	)
}

export default Button
