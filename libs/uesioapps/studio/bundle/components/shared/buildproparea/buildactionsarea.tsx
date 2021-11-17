import { FunctionComponent, ComponentType } from "react"
import { definition, builder, styles } from "@uesio/ui"

import DeleteAction from "./actions/deleteaction"
import MoveActions from "./actions/moveactions"
import AddAction from "./actions/addaction"
import CloneAction from "./actions/cloneaction"
import RunSignalsAction from "./actions/runsignalsaction"
import LoadWireAction from "./actions/loadwireaction"
import ToggleConditionAction from "./actions/toggleconditionaction"
import { ActionProps } from "./actions/actiondefinition"

interface Props extends definition.BaseProps {
	actions?: builder.ActionDescriptor[]
	valueAPI: builder.ValueAPI
	propsDef: builder.BuildPropertiesDefinition
}

const ACTION_TO_COMPONENT: {
	[K in builder.ActionDescriptor["type"]]: ComponentType<ActionProps>
} = {
	ADD: AddAction,
	CLONE: CloneAction,
	RUN_SIGNALS: RunSignalsAction,
	TOGGLE_CONDITION: ToggleConditionAction,
	LOAD_WIRE: LoadWireAction,
	DELETE: DeleteAction,
	MOVE: MoveActions,
}

const BuildActionsArea: FunctionComponent<Props> = (props) => {
	const classes = styles.useStyles(
		{
			wrapper: {
				display: "flex",
				justifyContent: "space-around",
				padding: "8px",
				position: "relative",
				backgroundColor: "#fcfcfc",
			},
		},
		props
	)
	const { actions, path, context, valueAPI, propsDef } = props

	const actionProps = {
		valueAPI,
		context,
		path,
		propsDef,
	}

	//For actions like Refresh or Run Signals we need a view on context
	const viewDefId = props.context.getViewDefId()
	const contextWithView = context.addFrame({
		view: viewDefId + "()",
	})

	return (
		<div className={classes.wrapper}>
			{actions?.map?.((action, index) => {
				const ActionHandler = ACTION_TO_COMPONENT[action.type]
				return (
					<ActionHandler
						{...actionProps}
						key={index}
						action={action}
						context={contextWithView}
					/>
				)
			})}
		</div>
	)
}

export default BuildActionsArea
