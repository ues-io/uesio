import { FunctionComponent } from "react"
import { component, material, styles } from "@uesio/ui"
import { GridProps } from "./griddefinition"

const useStyles = material.makeStyles((theme) =>
	material.createStyles({
		root: (props: GridProps) => ({
			height: props.definition.height,
			...styles.getBackgroundStyles(
				props.definition.background,
				theme,
				props.context
			),
		}),
	})
)

const Grid: FunctionComponent<GridProps> = (props) => {
	const classes = useStyles(props)
	return (
		<material.Grid
			className={classes.root}
			justify={props.definition.justify}
			direction={props.definition.direction}
			alignItems={props.definition.alignitems}
			container={true}
			spacing={props.definition.spacing}
		>
			<component.Slot
				definition={props.definition}
				listName="items"
				path={props.path}
				accepts={["material.griditem"]}
				context={props.context}
			/>
		</material.Grid>
	)
}

export default Grid
