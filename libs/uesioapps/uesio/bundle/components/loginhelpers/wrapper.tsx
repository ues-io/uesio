import { FunctionComponent } from "react"
import { material } from "@uesio/ui"

interface WrapperProps {
	align: "left" | "center" | "right"
}

const useStyles = material.makeStyles(() =>
	material.createStyles({
		root: (props: WrapperProps) => ({
			textAlign: props.align,
			marginBottom: "10px",
		}),
	})
)

const LoginWrapper: FunctionComponent<WrapperProps> = (props) => {
	const classes = useStyles(props)
	return <div className={classes.root}>{props.children}</div>
}

export default LoginWrapper
