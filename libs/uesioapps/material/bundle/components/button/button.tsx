import React, { FunctionComponent } from "react"

import { hooks, material, styles } from "@uesio/ui"
import { ButtonProps } from "./buttondefinition"

interface ThemedProps extends ButtonProps {
	theme: styles.ThemeState
}
const stylesObj = {
	root: (props: ThemedProps) => ({
		fontWeight: 400,
		backgroundColor:
			props.theme.definition?.palette?.[
				props.definition?.color || "primary"
			],
		margin: styles.getSpacing(props.theme, props.definition.margin || 1),
	}),
}

const useStyles = styles.getNewUseStyles(["root"], stylesObj)

const Button: FunctionComponent<ButtonProps> = (props) => {
	const { definition } = props
	const uesio = hooks.useUesio(props)
	const theme = uesio.getTheme()
	if (!theme) return null
	const classes = useStyles({ theme, ...props })

	return (
		<material.Button
			className={classes.root}
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
