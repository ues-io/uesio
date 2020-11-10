import RuntimeState from "../store/types/runtimestate"
import { BuilderActor } from "./builderactor"
import {
	SET_ACTIVE_NODE,
	SET_SELECTED_NODE,
	TOGGLE_BUILD_MODE,
	SET_DRAG_NODE,
	SET_DROP_NODE,
	SET_RIGHT_PANEL,
	SET_LEFT_PANEL,
	SET_VIEW,
	SetActiveNodeAction,
	SetSelectedNodeAction,
	ToggleBuildModeAction,
	SetDragNodeAction,
	SetDropNodeAction,
	SetLeftPanelAction,
	SetRightPanelAction,
	SetViewAction,
	SET_METADATA_LIST,
	SetMetadataListAction,
	SET_AVAILABLE_NAMESPACES,
	SetAvailableNamespacesAction,
	CLEAR_AVAILABLE_METADATA,
	ClearAvailableMetadataAction,
	BuilderBandAction,
} from "./builderbandactions"
import { ActionGroup, BAND } from "../store/actions/actions"
import { Dispatcher, DispatchReturn, ThunkFunc } from "../store/store"
import BuilderState from "../store/types/builderstate"
import Actor from "../actor/actor"
import { SignalsHandler } from "../definition/signal"
import {
	GET_METADATA_LIST,
	GetMetadataListSignal,
	GET_AVAILABLE_NAMESPACES,
	GetAvailableNamespacesSignal,
	BuilderBandSignal,
} from "./builderbandsignals"
import { Platform } from "../platform/platform"
import { PropDescriptor } from "../buildmode/buildpropdefinition"
import { Context } from "../context/context"

const BUILDER_BAND = "builder"

class BuilderBand {
	static actionGroup: ActionGroup = {
		[SET_ACTIVE_NODE]: (
			action: SetActiveNodeAction,
			state: BuilderState
		): BuilderState => {
			return Actor.assignStateItem(
				{
					activeNode: action.data.path,
				},
				state
			)
		},
		[SET_SELECTED_NODE]: (
			action: SetSelectedNodeAction,
			state: BuilderState
		): BuilderState => {
			return Actor.assignStateItem(
				{
					selectedNode: action.data.path,
				},
				state
			)
		},
		[TOGGLE_BUILD_MODE]: (
			action: ToggleBuildModeAction,
			state: BuilderState
		): BuilderState => {
			return Actor.assignStateItem(
				{
					buildMode: !state.buildMode,
				},
				state
			)
		},
		[SET_DRAG_NODE]: (
			action: SetDragNodeAction,
			state: BuilderState
		): BuilderState => {
			return Actor.assignStateItem(
				{
					draggingNode: action.data.path,
				},
				state
			)
		},
		[SET_DROP_NODE]: (
			action: SetDropNodeAction,
			state: BuilderState
		): BuilderState => {
			return Actor.assignStateItem(
				{
					droppingNode: action.data.path,
				},
				state
			)
		},
		[SET_LEFT_PANEL]: (
			action: SetLeftPanelAction,
			state: BuilderState
		): BuilderState => {
			return Actor.assignStateItem(
				{
					leftPanel: action.data.panel,
				},
				state
			)
		},
		[SET_RIGHT_PANEL]: (
			action: SetRightPanelAction,
			state: BuilderState
		): BuilderState => {
			return Actor.assignStateItem(
				{
					rightPanel: action.data.panel,
				},
				state
			)
		},
		[SET_VIEW]: (
			action: SetViewAction,
			state: BuilderState
		): BuilderState => {
			return Actor.assignStateItem(
				{
					buildView: action.data.view,
				},
				state
			)
		},
		[SET_METADATA_LIST]: (
			action: SetMetadataListAction,
			state: BuilderState
		): BuilderState => {
			const metadataType = action.data.metadataType
			const namespace = action.data.namespace
			const grouping = action.data.grouping
			return Actor.assignStateItem(
				{
					metadata: Actor.assignStateItem(
						{
							[metadataType]: Actor.assignStateItem(
								{
									[namespace]: grouping
										? Actor.assignStateItem(
												{
													[grouping]:
														action.data.metadata,
												},
												state.metadata?.[
													metadataType
												]?.[grouping] || {}
										  )
										: action.data.metadata,
								},
								state.metadata?.[metadataType] || {}
							),
						},
						state.metadata || {}
					),
				},
				state
			)
		},
		[SET_AVAILABLE_NAMESPACES]: (
			action: SetAvailableNamespacesAction,
			state: BuilderState
		): BuilderState => {
			return Actor.assignStateItem(
				{
					namespaces: action.data.namespaces,
				},
				state
			)
		},
		[CLEAR_AVAILABLE_METADATA]: (
			action: ClearAvailableMetadataAction,
			state: BuilderState
		): BuilderState => {
			return Actor.assignStateItem(
				{
					namespaces: null,
					metadata: null,
				},
				state
			)
		},
	}

	static getSignalHandlers(): SignalsHandler {
		return {
			[GET_METADATA_LIST]: {
				dispatcher: (
					signal: GetMetadataListSignal,
					context: Context
				): ThunkFunc => {
					return async (
						dispatch: Dispatcher<SetMetadataListAction>,
						getState: () => RuntimeState,
						platform: Platform
					): DispatchReturn => {
						const metadata = await platform.getMetadataList(
							context,
							signal.metadataType,
							signal.namespace,
							signal.grouping
						)
						dispatch({
							type: BAND,
							band: BUILDER_BAND,
							name: SET_METADATA_LIST,
							data: {
								metadataType: signal.metadataType,
								namespace: signal.namespace,
								grouping: signal.grouping,
								metadata,
							},
						})
						return context
					}
				},
			},
			[GET_AVAILABLE_NAMESPACES]: {
				dispatcher: (
					signal: GetAvailableNamespacesSignal,
					context: Context
				): ThunkFunc => {
					return async (
						dispatch: Dispatcher<SetAvailableNamespacesAction>,
						getState: () => RuntimeState,
						platform: Platform
					): DispatchReturn => {
						const namespaces = await platform.getAvailableNamespaces(
							context
						)
						dispatch({
							type: BAND,
							band: BUILDER_BAND,
							name: SET_AVAILABLE_NAMESPACES,
							data: {
								namespaces,
							},
						})
						return context
					}
				},
			},
		}
	}

	static receiveSignal(
		signal: BuilderBandSignal,
		context: Context
	): ThunkFunc {
		const handlers = BuilderBand.getSignalHandlers()
		const handler = handlers?.[signal.signal]
		if (!handler) {
			throw new Error("No Handler found for signal: " + signal.signal)
		}
		return handler.dispatcher(signal, context)
	}

	static receiveAction(
		action: BuilderBandAction,
		state: RuntimeState
	): RuntimeState {
		const handler = this.actionGroup[action.name]

		return {
			...state,
			...(handler
				? {
						builder: handler(
							action,
							state.builder,
							state
						) as BuilderState,
				  }
				: {}),
		}
	}

	static getActor(): BuilderActor {
		return new BuilderActor()
	}

	static getSignalProps(): PropDescriptor[] {
		return []
	}
}

export { BuilderBand, BUILDER_BAND }
