import { FunctionComponent } from "react"

import { component, styles } from "@uesio/ui"
import { DeckProps } from "./deckdefinition"
import List from "../io.list/list"

const IOGrid = component.registry.getUtility("io.grid")

const useStyles = styles.getUseStyles(["root"], {
	root: (props) => {
		const definition = props.definition
		const gridCols =
			definition.templateColumns &&
			styles.getResponsiveStyles(
				"gridTemplateColumns",
				definition.templateColumns
			)
		const gridRows =
			definition.templateRows &&
			styles.getResponsiveStyles(
				"gridTemplateRows",
				definition.templateRows
			)

		return {
			...gridCols,
			...gridRows,
		}
	},
})

const Deck: FunctionComponent<DeckProps> = (props) => {
	const classes = useStyles(props)
	return (
		<IOGrid className={classes.root} context={props.context}>
			<List {...props} />
		</IOGrid>
	)
}

export default Deck
