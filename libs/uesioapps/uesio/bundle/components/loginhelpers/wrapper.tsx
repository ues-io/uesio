import { material } from "uesio"
import React, { ReactElement, ReactNode } from "react"

interface WrapperProps {
	align: "left" | "center" | "right"
	children?: ReactNode
}

const useStyles = material.makeStyles(() =>
	material.createStyles({
		root: (props: WrapperProps) => ({
			textAlign: props.align,
			marginBottom: "10px",
		}),
	})
)

function LoginWrapper(props: WrapperProps): ReactElement | null {
	const classes = useStyles(props)
	return <div className={classes.root}>{props.children}</div>
}

export default LoginWrapper
