import { styles, definition } from "@uesio/ui"
import React, { FunctionComponent } from "react"

interface TextProps extends definition.BaseProps {
	text: string
}

const useStyles = styles.getUseStyles(["loginButtonText"], {
	loginButtonText: {
		padding: "10px 10px 10px 0",
		fontWeight: 500,
	},
})

const LoginText: FunctionComponent<TextProps> = (props) => {
	const classes = useStyles(props)
	return <span className={classes.loginButtonText}>{props.text}</span>
}

export default LoginText
