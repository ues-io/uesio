import { FunctionComponent } from "react"
import { component, styles } from "@uesio/ui"
import { GridItemProps } from "./griditemdefinition"
import * as material from "@material-ui/core"

const useStyles = material.makeStyles(() =>
	material.createStyles({
		root: (props: GridItemProps) => ({
			height: props.definition.height,
			...styles.getBackgroundStyles(
				props.definition.background,
				props.context.getTheme(),
				props.context
			),
			...(props.definition.align && {
				textAlign: props.definition.align,
			}),
		}),
	})
)

const GridItem: FunctionComponent<GridItemProps> = (props) => {
	const classes = useStyles(props)

	return (
		<material.Grid
			className={classes.root}
			xs={props.definition.xs}
			sm={props.definition.sm}
			md={props.definition.md}
			lg={props.definition.lg}
			xl={props.definition.xl}
			item={true}
		>
			<component.Slot
				definition={props.definition}
				listName="components"
				path={props.path}
				accepts={["uesio.standalone"]}
				context={props.context}
			/>
		</material.Grid>
	)
}

export default GridItem
