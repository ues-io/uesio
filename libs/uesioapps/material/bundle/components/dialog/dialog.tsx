import React, { ReactElement } from "react"
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
import Icon from "../icon/icon"

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
	): DialogState => {
		return Object.assign({}, state, {
			mode: state.mode === "OPEN" ? "CLOSE" : "OPEN",
		})
	},
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

function Dialog(props: DialogProps): ReactElement {
	const uesio = hooks.useUesio(props)
	const classes = useStyles(props)
	const definition = props.definition

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

	const disagreeButtonProps = {
		className: classes.root,
		onClick:
			props.definition?.disagreeSignals &&
			uesio.signal.getHandler(props.definition.disagreeSignals),
	}

	const agreeButtonProps = {
		className: classes.root,
		onClick:
			props.definition?.agreeSignals &&
			uesio.signal.getHandler(props.definition.agreeSignals),
	}

	const mylocalState = state.mode === "OPEN" ? true : false

	const slotProps = {
		definition: props.definition,
		listName: "content",
		path: props.path,
		accepts: ["uesio.standalone"],
		context: props.context,
	}

	return (
		<material.Dialog
			open={mylocalState}
			aria-labelledby="alert-dialog-title"
			aria-describedby="alert-dialog-description"
		>
			<material.DialogTitle>
				{props.definition.title}
			</material.DialogTitle>
			<material.DialogContent>
				<material.DialogContentText>
					<component.Slot {...slotProps} />
				</material.DialogContentText>
			</material.DialogContent>
			<material.DialogActions>
				<material.Button color="primary" {...disagreeButtonProps}>
					Disagree
				</material.Button>
				<material.Button color="primary" {...agreeButtonProps}>
					Agree
				</material.Button>
			</material.DialogActions>
		</material.Dialog>
	)
}

export default Dialog
