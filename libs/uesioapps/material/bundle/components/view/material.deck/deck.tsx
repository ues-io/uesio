import { FunctionComponent } from "react"

import { styles, hooks, component } from "@uesio/ui"
import { DeckProps, DeckState } from "./deckdefinition"
import * as material from "@material-ui/core"

const useStyles = styles.getUseStyles(["root"], {
	root: (props: DeckProps) => ({
		...styles.getMarginStyles(
			props.definition.margin,
			props.context.getTheme()
		),
	}),
})

const Deck: FunctionComponent<DeckProps> = (props) => {
	const { path, context, definition } = props
	const classes = useStyles(props)
	const uesio = hooks.useUesio(props)
	const wire = uesio.wire.useWire(definition.wire)

	const [componentState] = uesio.component.useState<DeckState>(
		definition.id,
		{
			mode: definition.mode || "READ",
		}
	)

	if (!wire || !componentState) return null

	const data = wire.getData()

	return (
		<material.Grid className={classes.root} container={true}>
			{data.map((record) => (
				<material.Grid
					key={record.getId()}
					xs={props.definition.xs}
					sm={props.definition.sm}
					md={props.definition.md}
					lg={props.definition.lg}
					xl={props.definition.xl}
					item={true}
				>
					<component.Slot
						definition={definition}
						listName="components"
						path={path}
						accepts={["uesio.context"]}
						direction="manual"
						context={context.addFrame({
							record: record.getId(),
							wire: wire.getId(),
							fieldMode: componentState.mode,
						})}
					/>
				</material.Grid>
			))}
		</material.Grid>
	)
}

export default Deck
