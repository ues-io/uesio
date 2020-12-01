import React, { FunctionComponent } from "react"

import {
	material,
	styles,
	hooks,
	component,
	action,
	signal,
	context,
} from "@uesio/ui"
import { DeckProps, DeckState } from "./deckdefinition"

const useStyles = material.makeStyles((theme) =>
	material.createStyles({
		root: (props: DeckProps) => ({
			...styles.getMarginStyles(props.definition.margin, theme),
		}),
	})
)

const actionReducers: action.ActionGroup = {
	TOGGLE_MODE: (
		action: action.ComponentAction,
		state: DeckState
	): DeckState => ({
		...state,
		mode: state.mode === "READ" ? "EDIT" : "READ",
	}),
}

const signalHandlers: signal.SignalsHandler = {
	TOGGLE_MODE: {
		dispatcher: (
			signal: signal.ComponentSignal,
			ctx: context.Context
		): signal.ThunkFunc => {
			return async (
				dispatch: action.Dispatcher<action.ComponentAction>
			): signal.DispatchReturn => {
				dispatch({
					type: action.ACTOR,
					name: signal.signal,
					band: signal.band,
					target: signal.target,
					scope: signal.scope,
					data: {},
					view: ctx.getView()?.getId(),
				})
				return ctx
			}
		},
	},
}

const Deck: FunctionComponent<DeckProps> = (props) => {
	const { path, context, definition } = props
	const classes = useStyles(props)
	const uesio = hooks.useUesio(props)
	const wire = uesio.wire.useWire(definition.wire)
	const data = wire.getData()
	const collection = wire.getCollection()

	const initialState: DeckState = {
		mode: definition.mode || "READ",
	}

	const componentActor = uesio.signal.useSignals(
		definition.id,
		signalHandlers,
		actionReducers,
		initialState
	)

	if (!wire.isValid() || !collection.isValid() || !componentActor.isValid())
		return null

	const state = componentActor.toState() as DeckState

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
							fieldMode: state.mode,
						})}
					/>
				</material.Grid>
			))}
		</material.Grid>
	)
}

export default Deck
