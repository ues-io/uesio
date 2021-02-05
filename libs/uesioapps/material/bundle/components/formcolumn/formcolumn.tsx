import React, { FunctionComponent } from "react"
import { material, component } from "@uesio/ui"
import { FormColumnProps } from "./formcolumndefinition"

const useStyles = material.makeStyles(() =>
	material.createStyles({
		root: {},
	})
)

const FormColumn: FunctionComponent<FormColumnProps> = (props) => {
	const classes = useStyles(props)

	return (
		<material.Grid className={classes.root} item={true} lg={true}>
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
