import React, { FunctionComponent } from "react"
import { makeStyles, createStyles } from "@material-ui/core"
import { definition, builder } from "@uesio/ui"

import DeleteAction from "./actions/deleteaction"
import { ActionProps } from "./actions/actiondefinition"
import MoveActions from "./actions/moveactions"
import AddAction from "./actions/addaction"
import RunSignalsAction from "./actions/runsignalsaction"
import LoadWireAction from "./actions/loadwireaction"
import ToggleConditionAction from "./actions/toggleconditionaction"

interface Props extends definition.BaseProps {
	actions?: builder.ActionDescriptor[]
	definition: definition.DefinitionMap
}

const useStyles = makeStyles(() =>
	createStyles({
		wrapper: {
			backgroundColor: "#f0f0f0",
			padding: "8px",
		},
	})
)

function getActionHandler(type?: string) {
	switch (type) {
		case "ADD":
			return AddAction
		case "RUN_SIGNALS":
			return RunSignalsAction
		case "TOGGLE_CONDITION":
			return ToggleConditionAction
		case "LOAD_WIRE":
			return LoadWireAction
		default:
			return null
	}
}

const BuildActionsArea: FunctionComponent<Props> = (props) => {
	const classes = useStyles(props)
	const actions = props.actions
	//const propsDef = props.buildPropsDef
	const actionProps: ActionProps = {
		...props,
		definition,
	}

	return (
		<div className={classes.wrapper}>
			<DeleteAction {...actionProps}></DeleteAction>
			<MoveActions {...actionProps}></MoveActions>
			{actions?.map?.((action, index) => {
				const ActionHandler = getActionHandler(action.type)
				if (ActionHandler) {
					return (
						<ActionHandler
							key={index}
							{...{ ...actionProps, ...{ action } }}
						></ActionHandler>
					)
				}
			})}
		</div>
	)
}

export default BuildActionsArea
