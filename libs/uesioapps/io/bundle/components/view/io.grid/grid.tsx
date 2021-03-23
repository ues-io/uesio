import { FunctionComponent } from "react"

import { component, styles } from "@uesio/ui"
import { GridProps } from "./griddefinition"

const IOGrid = component.registry.getUtility("io.grid")

const useStyles = styles.getUseStyles(["root"], {
	root: (props) => {
		const definition = props.definition
		const grid =
			definition.templateColumns &&
			styles.getResponsiveStyles(
				"gridTemplateColumns",
				definition.templateColumns
			)

		return {
			minHeight: "100vh",
			...grid,
		}
	},
})

const Grid: FunctionComponent<GridProps> = (props) => {
	const classes = useStyles(props)
	return (
		<IOGrid className={classes.root} {...props}>
			<component.Slot
				definition={props.definition}
				listName="items"
				path={props.path}
				accepts={["io.griditem"]}
				context={props.context}
			/>
		</IOGrid>
	)
}

export default Grid
