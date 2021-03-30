import { FunctionComponent } from "react"
import { component, styles } from "@uesio/ui"
import { GridItemProps } from "./griditemdefinition"

const useStyles = styles.getUseStyles(["root"])

const GridItem: FunctionComponent<GridItemProps> = (props) => {
	const classes = useStyles(props)
	const { definition, context, path } = props
	return (
		<div className={classes.root}>
			<component.Slot
				definition={definition}
				listName="components"
				path={path}
				accepts={["uesio.standalone"]}
				context={context}
			/>
		</div>
	)
}

export default GridItem
