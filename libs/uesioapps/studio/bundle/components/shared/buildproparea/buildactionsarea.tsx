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
import { ValueAPI } from "../propertiespaneldefinition"

interface Props extends definition.BaseProps {
	actions?: builder.ActionDescriptor[]
	valueAPI: ValueAPI
}

const ACTION_TO_COMPONENT: {
	[K in builder.ActionDescriptor["type"]]: ComponentType<ActionProps>
} = {
	ADD: AddAction,
	CLONE: CloneAction,
	RUN_SIGNALS: RunSignalsAction,
	TOGGLE_CONDITION: ToggleConditionAction,
	LOAD_WIRE: LoadWireAction,
}

const BuildActionsArea: FunctionComponent<Props> = (props) => {
	const classes = styles.useStyles(
		{
			wrapper: {
				display: "flex",
				justifyContent: "space-around",
				padding: "8px",
				position: "relative",
				"&::after": {
					content: "''",
					position: "absolute",
					left: "6px",
					right: "6px",
					height: "1px",
					backgroundColor: "#eee",
					top: "0",
				},
			},
		},
		props
	)
	const { actions, path, context, valueAPI } = props

	const actionProps = {
		valueAPI,
		context,
		path,
	}

	return (
		<div className={classes.wrapper}>
			<DeleteAction {...actionProps} />
			<MoveActions {...actionProps} />
			<CloneAction {...actionProps} />
			{actions?.map?.((action, index) => {
				const ActionHandler = ACTION_TO_COMPONENT[action.type]
				return (
					<ActionHandler
						{...actionProps}
						key={index}
						action={action}
					/>
				)
			})}
		</div>
	)
}

export default BuildActionsArea
