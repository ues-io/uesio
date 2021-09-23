import { FC } from "react"
import { definition, styles, component, util } from "@uesio/ui"
import Column, { getColumnFlexStyles } from "./column"

const BuildWrapper = component.registry.getUtility("studio.buildwrapper")

const ColumnBuilder: FC<definition.BaseProps> = (props) => {
	const { path = "", context, index = 0 } = props

	const template = context.getParentComponentDef(path)?.template

	const classes = styles.useStyles(
		{
			root: {
				...getColumnFlexStyles(template, index),
			},
		},
		{
			context: props.context,
		}
	)

	return (
		<BuildWrapper {...props} classes={classes}>
			<Column {...props} />
		</BuildWrapper>
	)
}

export default ColumnBuilder
