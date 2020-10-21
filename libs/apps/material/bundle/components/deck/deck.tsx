import React, { ReactElement } from "react"

import {
	material,
	styles,
	hooks,
	component,
	action,
	signal,
	context,
} from "uesio"
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
	): DeckState => {
		return Object.assign({}, state, {
			mode: state.mode === "READ" ? "EDIT" : "READ",
		})
	},
}

const signalHandlers: signal.SignalsHandler = {
	TOGGLE_MODE: {
		dispatcher: (
			signal: signal.ComponentSignal,
			ctx: context.Context
		): action.Dispatcher<action.ComponentAction> => {
			return (
				dispatch: action.Dispatcher<action.ComponentAction>
			): action.ComponentAction => {
				return dispatch({
					type: action.ACTOR,
					name: signal.signal,
					band: signal.band,
					target: signal.target,
					scope: signal.scope,
					data: {},
					view: ctx.getView()?.getId(),
				})
			}
		},
	},
}

function Deck(props: DeckProps): ReactElement | null {
	const classes = useStyles(props)
	const uesio = hooks.useUesio(props)
	const definition = props.definition
	const wire = uesio.wire.useWire(definition.wire)
	const data = wire.getData()
	const collection = wire.getCollection()
	const path = props.path
	const context = props.context

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

	const deckProps = {
		className: classes.root,
		container: true,
	}

	return (
		<material.Grid {...deckProps}>
			{data.map((record) => {
				const slotProps = {
					definition,
					listName: "components",
					path,
					accepts: ["uesio.context"],
					direction: "manual",
					context: context.addFrame({
						record,
						wire,
						fieldMode: state.mode,
					}),
				}
				const itemProps = {
					xs: props.definition.xs,
					sm: props.definition.sm,
					md: props.definition.md,
					lg: props.definition.lg,
					xl: props.definition.xl,
					item: true,
				}
				return (
					<material.Grid key={record.getId()} {...itemProps}>
						<component.Slot {...slotProps}></component.Slot>
					</material.Grid>
				)
			})}
		</material.Grid>
	)
}

export default Deck
