import { FC } from "react"
import { definition, styles, component } from "@uesio/ui"
import Column, { getColumnFlexStyles } from "./column"

const BuildWrapper = component.getUtility("uesio/studio.buildwrapper")

const ColumnBuilder: FC<definition.BaseProps> = (props) => {
	const { path = "", context, index = 0 } = props
	const [parentDef] = context.getParentComponentDef(path)
	const template = parentDef?.template

	const classes = styles.useStyles(
		{
			root: {
				...getColumnFlexStyles(template, index),
			},
		},
		{ context }
	)

	return (
		<BuildWrapper {...props} classes={classes}>
			<Column {...props} />
		</BuildWrapper>
	)
}

export default ColumnBuilder
