import { FC, useState } from "react"
import { definition, styles, component, util, hooks } from "@uesio/ui"
import Column, { getColumnFlexStyles } from "./column"
import FieldHints from "./fieldhints"
const BuildWrapper = component.registry.getUtility("studio.buildwrapper")
const ColumnBuilder: FC<definition.BaseProps> = (props) => {
	const { path = "", context } = props
	const wire = context.getWire()

	// Get template val set on parent layout def
	const layoutOverrides = (() => {
		if (!path) return {}
		const pathArray = component.path.fromArray(path)

		const pathToLayout = pathArray.slice(0, -3)
		const layoutDef = context.getInViewDef(pathToLayout) as any
		if (!layoutDef.template) return {}
		const template = layoutDef.template

		return getColumnFlexStyles(template, path)
	})()

	const classes = styles.useStyles(
		{
			root: {
				...layoutOverrides,
				"&:hover .fieldHint": {
					opacity: 0.7,
				},
				gap: "inherit",
			},
			header: {
				display: "none",
			},
		},
		{
			context: props.context,
		}
	)

	return (
		<BuildWrapper {...props} classes={classes} className={classes.root}>
			<Column {...props} />
			{wire && <FieldHints {...props} wire={wire} />}
		</BuildWrapper>
	)
}

export default ColumnBuilder
