import { FunctionComponent } from "react"
import { material } from "@uesio/ui"

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

const LoginText: FunctionComponent<TextProps> = (props) => {
	const classes = useStyles(props)
	return <span className={classes.loginButtonText}>{props.text}</span>
}

export default LoginText
