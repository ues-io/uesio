import React, { FunctionComponent } from "react"
import { hooks, material } from "@uesio/ui"
import { ColumnProps, ColumnDefinition } from "./columndefinition"

const useStyles = material.makeStyles((theme: material.Theme) =>
	material.createStyles({
		root: () => ({
			padding: theme.spacing(1),
		}),
	})
)

const ColumnBuilder: FunctionComponent<ColumnProps> = (props) => {
	const classes = useStyles(props)
	const uesio = hooks.useUesio(props)
	const definition = uesio.view.useDefinition(props.path) as ColumnDefinition
	if (definition.field) {
		return <div className={classes.root}>{definition.field}</div>
	}
	return null
}

export default ColumnBuilder
