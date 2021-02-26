import React, { FunctionComponent } from "react"
import { definition, styles } from "@uesio/ui"

interface ButtonProps extends definition.BaseProps {
	onClick?: () => void
	label?: string
}

const useStyles = styles.getUseStyles(["root", "label"])

const Button: FunctionComponent<ButtonProps> = (props) => {
	const classes = useStyles(props)
	const { onClick, label } = props
	return (
		<button onClick={onClick} className={classes.root}>
			<div className={classes.label}>{label}</div>
		</button>
	)
}

export default Button
