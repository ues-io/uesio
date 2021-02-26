import { styles, definition } from "@uesio/ui"
import React, { FunctionComponent } from "react"

interface TextProps extends definition.BaseProps {
	text: string
}

const useStyles = styles.getUseStyles(["loginButtonText"], {
	loginButtonText: {
		padding: "10px",
		fontWeight: 500,
		margin: "auto",
	},
})

const LoginText: FunctionComponent<TextProps> = (props) => {
	const classes = useStyles(props)
	return <span className={classes.loginButtonText}>{props.text}</span>
}

export default LoginText
