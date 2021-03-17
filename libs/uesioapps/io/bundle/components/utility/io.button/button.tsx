import { FunctionComponent } from "react"
import { definition, styles } from "@uesio/ui"

interface ButtonProps extends definition.BaseProps {
	onClick?: () => void
	label?: string
	width?: string
}

const useStyles = styles.getUseStyles(["root", "label"], {
	root: ({ width }) => ({
		fontFamily: "inherit",
		border: "none",
		cursor: "pointer",
		...(width && { width }),
	}),
})

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
