import React, { FunctionComponent } from "react"
import { component, hooks, definition } from "@uesio/ui"
import { FormColumnProps } from "./formcolumndefinition"
import toPath from "lodash.topath"
import * as material from "@material-ui/core"
const { useUesio } = hooks

const FormColumn: FunctionComponent<FormColumnProps> = (props) => {
	const uesio = useUesio(props)
	const pathified = toPath(props.path)
	const columnsPath = `["${pathified
		.slice(0, pathified.length - 2)
		.join('"]["')}"]`
	const columnsDef = uesio.view.useDefinition(
		columnsPath
	) as definition.DefinitionList

	//TODO: This approach to column sizing likely has issues -
	//but is probably alright for a first pass? Could use a revamp
	return (
		<material.Grid
			item={true}
			sm={columnsDef.length < 3}
			md={columnsDef.length < 4}
			lg={columnsDef.length < 5}
			xl={columnsDef.length < 6}
		>
			<component.Slot
				definition={props.definition}
				listName="components"
				path={props.path}
				accepts={["uesio.standalone", "uesio.field"]}
				context={props.context}
			/>
		</material.Grid>
	)
}

export default FormColumn
