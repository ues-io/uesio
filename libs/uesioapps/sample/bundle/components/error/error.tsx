import { FunctionComponent } from "react"
import { ErrorProps } from "./errordefinition"
import { material } from "@uesio/ui"

const useStyles = material.makeStyles(() =>
	material.createStyles({
		root: (props: ErrorProps) => ({
			padding: "100px",
			backgroundColor: props.definition?.color || "#2D72D9",
			height: "100%",
			textAlign: "center",
		}),
		h1_prop: (props: ErrorProps) => ({
			fontSize: "220px",
			color: props.definition?.font_color || "white",
		}),
		p_prop: (props: ErrorProps) => ({
			color: props.definition?.font_color || "white",
		}),
		a_prop: {
			color: "#fffee3",
		},
	})
)

const Error: FunctionComponent<ErrorProps> = (props) => {
	const classes = useStyles(props)
	return (
		<div className={classes.root}>
			<h1 className={classes.h1_prop}>{props.definition.message}</h1>
			<p className={classes.p_prop}> {props.definition.sub_message}</p>
			{/* <a className={classes.a_prop} href="{props.definition.url}"> {props.definition.url} </a> */}
			<material.Button
				color="primary"
				variant="contained"
				href="{props.definition.url}"
			>
				{props.definition.url}
			</material.Button>
		</div>
	)
}

export default Error
