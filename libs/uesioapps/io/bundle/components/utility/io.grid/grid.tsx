import { FunctionComponent } from "react"
import { definition, styles } from "@uesio/ui"

const useStyles = styles.getUseStyles(["root"], {
	root: {
		display: "grid",
	},
})

const Grid: FunctionComponent<definition.UtilityProps> = (props) => {
	const classes = useStyles(props)
	return (
		<div
			className={styles.clsx(
				classes.root,
				props.className as string | undefined
			)}
		>
			{props.children}
		</div>
	)
}

export default Grid
