import { FunctionComponent } from "react"

import { material, styles, hooks, component } from "@uesio/ui"
import { DeckProps, DeckState } from "./deckdefinition"

const useStyles = material.makeStyles((theme) =>
	material.createStyles({
		root: (props: DeckProps) => ({
			...styles.getMarginStyles(props.definition.margin, theme),
		}),
	})
)

const Deck: FunctionComponent<DeckProps> = (props) => {
	const { path, context, definition } = props
	const classes = useStyles(props)
	const uesio = hooks.useUesio(props)
	const wire = uesio.wire.useWire(definition.wire)

	const initialState: DeckState = {
		mode: definition.mode || "READ",
	}

	const componentState = uesio.component.useState(
		definition.id,
		initialState
	) as DeckState

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
