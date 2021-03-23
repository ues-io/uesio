import { FunctionComponent } from "react"
import { component, styles } from "@uesio/ui"
import { GridItemProps } from "./griditemdefinition"

const useStyles = styles.getUseStyles(["root"])

const GridItem: FunctionComponent<GridItemProps> = (props) => {
	const classes = useStyles(props)
	return (
		<div className={classes.root}>
			<component.Slot
				definition={props.definition}
				listName="components"
				path={props.path}
				accepts={["uesio.standalone"]}
				context={props.context}
			/>
		</div>
	)
}

export default GridItem
