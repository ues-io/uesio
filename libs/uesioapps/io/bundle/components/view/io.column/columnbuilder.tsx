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

	const transitionIn = "all 0.6s ease"
	const transitionOut = "all 0.3s ease"
	const maxHeight = "100px"
	const opacity = 1
	const classes = styles.useStyles(
		{
			root: {
				...layoutOverrides,
				".hint": {
					maxHeight: "0px",
					opacity: 0,
					willChange: "max-height",
					transition: transitionIn,
				},
				"&:hover .hint": {
					opacity,
					maxHeight,
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
		<div className={classes.root}>
			<BuildWrapper {...props} classes={classes}>
				<Column {...props} />

				{wire && (
					<div className="hint">
						<FieldHints {...props} wire={wire} />
					</div>
				)}
			</BuildWrapper>
		</div>
	)
}

export default ColumnBuilder
