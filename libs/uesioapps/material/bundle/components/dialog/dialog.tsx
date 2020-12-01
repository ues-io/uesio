import React, { FunctionComponent } from "react"
import {
	hooks,
	material,
	signal,
	action,
	context,
	builder,
	component,
} from "@uesio/ui"
import { DialogProps } from "./dialogdefinition"

const useStyles = material.makeStyles((theme) =>
	material.createStyles({
		root: {
			margin: theme.spacing(1),
		},
	})
)

type DialogMode = "OPEN" | "CLOSE"

type DialogState = {
	mode: DialogMode
}

const actionReducers: action.ActionGroup = {
	TOGGLE_MODE: (
		action: action.ComponentAction,
		state: DialogState
	): DialogState => ({
		...state,
		mode: state.mode === "OPEN" ? "CLOSE" : "OPEN",
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
		public: true,
		label: "Open Dialog",
		properties: (): builder.PropDescriptor[] => {
			return [
				{
					name: "target",
					type: "COMPONENT",
					scope: "material.dialog",
					label: "Target",
				},
			]
		},
	},
}

const Dialog: FunctionComponent<DialogProps> = (props) => {
	const uesio = hooks.useUesio(props)
	const classes = useStyles(props)
	const { definition, path, context } = props

	const initialState: DialogState = {
		mode: definition.mode || "CLOSE",
	}

	const componentActor = uesio.signal.useSignals(
		definition.id,
		signalHandlers,
		actionReducers,
		initialState
	)

	const state = componentActor.toState() as DialogState

	return (
		<material.Dialog
			open={state.mode === "OPEN"}
			aria-labelledby="alert-dialog-title"
			aria-describedby="alert-dialog-description"
		>
			<material.DialogTitle>{definition.title}</material.DialogTitle>
			<material.DialogContent>
				<material.DialogContentText>
					<component.Slot
						definition={definition}
						listName="content"
						path={path}
						accepts={["uesio.standalone"]}
						context={context}
					/>
				</material.DialogContentText>
			</material.DialogContent>
			<material.DialogActions>
				<material.Button
					color="primary"
					className={classes.root}
					onClick={
						definition?.disagreeSignals &&
						uesio.signal.getHandler(definition.disagreeSignals)
					}
				>
					Disagree
				</material.Button>
				<material.Button
					color="primary"
					className={classes.root}
					onClick={
						definition?.agreeSignals &&
						uesio.signal.getHandler(definition.agreeSignals)
					}
				>
					Agree
				</material.Button>
			</material.DialogActions>
		</material.Dialog>
	)
}

export default Dialog
