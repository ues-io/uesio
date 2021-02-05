import React, { FunctionComponent } from "react"

import { material, hooks, component } from "@uesio/ui"
import { FormProps, FormState } from "./formdefinition"
import { createStyles } from "@material-ui/core"

const useStyles = material.makeStyles(() =>
	createStyles({
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
		<material.Grid className={classes.root} container={true}>
			{data.map((record) => (
				<material.Grid key={record.getId()} lg={true} item={true}>
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
			))}
		</material.Grid>
	)
}

export default Form
