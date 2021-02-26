import React, { FunctionComponent } from "react"

import { hooks, component } from "@uesio/ui"
import { FormProps, FormState } from "./formdefinition"
import * as material from "@material-ui/core"
const useStyles = material.makeStyles(() =>
	material.createStyles({
		root: {},
	})
)

const Form: FunctionComponent<FormProps> = (props) => {
	const { path, context, definition } = props
	const uesio = hooks.useUesio(props)
	const wire = uesio.wire.useWire(definition.wire)
	const classes = useStyles(props)
	const initialState: FormState = {
		mode: definition.mode || "READ",
	}

	const componentState = uesio.component.useState(
		definition.id,
		initialState
	) as FormState

	if (!wire || !componentState) return null

	const data = wire.getData()
	return (
		<div className={classes.root}>
			{data.map((record) => (
				<form>
					<material.Grid container key={record.getId()} spacing={3}>
						<component.Slot
							definition={definition}
							listName="columns"
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
				</form>
			))}
		</div>
	)
}

export default Form
