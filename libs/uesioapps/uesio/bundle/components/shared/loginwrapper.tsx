import { styles } from "@uesio/ui"
import { FunctionComponent } from "react"

interface WrapperProps {
	align: "left" | "center" | "right"
}

const LoginWrapper: FunctionComponent<WrapperProps> = (props) => {
	const classes = styles.useStyles(
		{
			root: {
				textAlign: props.align,
				marginBottom: "10px",
			},
		},
		null
	)
	return <div className={classes.root}>{props.children}</div>
}

export default LoginWrapper
