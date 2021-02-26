import { styles } from "@uesio/ui"
import React, { FunctionComponent } from "react"

interface WrapperProps {
	align: "left" | "center" | "right"
}

const useStyles = styles.getUseStyles(["root"], {
	root: (props: WrapperProps) => ({
		textAlign: props.align,
		marginBottom: "10px",
	}),
})

const LoginWrapper: FunctionComponent<WrapperProps> = (props) => {
	const classes = useStyles(props)
	return <div className={classes.root}>{props.children}</div>
}

export default LoginWrapper
