import { FunctionComponent } from "react"
import { definition, styles } from "@uesio/ui"

const useStyles = styles.getUseStyles(["root"], {
	root: {
		display: "grid",
	},
})

const Grid: FunctionComponent<definition.BaseProps> = (props) => {
	const classes = useStyles(props)
	return <div className={classes.root}>{props.children}</div>
}

export default Grid
