import { material } from "uesio"
import React, { ReactElement } from "react"

interface TextProps {
	text: string
}

const useStyles = material.makeStyles(() =>
	material.createStyles({
		loginButtonText: {
			padding: "10px 10px 10px 0px",
			fontWeight: 500,
		},
	})
)

function LoginText(props: TextProps): ReactElement | null {
	const classes = useStyles(props)
	return <span className={classes.loginButtonText}>{props.text}</span>
}

export default LoginText
