import { FunctionComponent, ComponentType } from "react"
import { definition, builder, styles } from "@uesio/ui"

import DeleteAction from "./actions/deleteaction"
import MoveActions from "./actions/moveactions"
import AddAction from "./actions/addaction"
import RunSignalsAction from "./actions/runsignalsaction"
import LoadWireAction from "./actions/loadwireaction"
import ToggleConditionAction from "./actions/toggleconditionaction"
import { ActionProps } from "./actions/actiondefinition"

interface Props extends definition.BaseProps {
	actions?: builder.ActionDescriptor[]
}

const ACTION_TO_COMPONENT: {
	[K in builder.ActionDescriptor["type"]]: ComponentType<ActionProps>
} = {
	ADD: AddAction,
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
				backgroundColor: "#f0f0f0",
				padding: "8px",
			},
		},
		props
	)
	const actions = props.actions
	return (
		<div className={classes.wrapper}>
			<DeleteAction {...props} definition={definition} />
			<MoveActions {...props} definition={definition} />
			{actions?.map?.((action, index) => {
				const ActionHandler = ACTION_TO_COMPONENT[action.type]
				return (
					<ActionHandler
						{...props}
						key={index}
						definition={definition}
						action={action}
					/>
				)
			})}
		</div>
	)
}

export default BuildActionsArea
