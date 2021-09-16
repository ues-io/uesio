import { FC } from "react"
import { definition, styles, component } from "@uesio/ui"
import Column, { getColumnFlexStyles } from "./column"

const BuildWrapper = component.registry.getUtility("studio.buildwrapper")

const ColumnBuilder: FC<definition.BaseProps> = (props) => {
	const { path = "", context } = props

	// Get template val set on parent layout def
	const layoutOverrides = (() => {
		if (!path) return {}
		const pathArray = component.path.fromArray(path)

		const pathToLayout = pathArray.slice(0, -3)
		const layoutDef = context.getInViewDef(pathToLayout) as any
		if (!layoutDef.template) return {}
		const template = layoutDef.template.split(",")

		return getColumnFlexStyles(template, path)
	})()

	const classes = styles.useStyles(
		{
			root: {
				...layoutOverrides,
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
