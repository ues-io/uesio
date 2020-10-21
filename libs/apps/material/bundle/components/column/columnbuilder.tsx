import React, { ReactElement } from "react"
import { hooks, material } from "uesio"
import { ColumnProps, ColumnDefinition } from "./columndefinition"

const useStyles = material.makeStyles((theme) =>
	material.createStyles({
		root: () => ({
			padding: theme.spacing(1),
		}),
	})
)

function ColumnBuilder(props: ColumnProps): ReactElement | null {
	const classes = useStyles(props)
	const uesio = hooks.useUesio(props)
	const definition = uesio.view.useDefinition(props.path) as ColumnDefinition
	if (definition.field) {
		return <div className={classes.root}>{definition.field}</div>
	}
	return null
}

export default ColumnBuilder
