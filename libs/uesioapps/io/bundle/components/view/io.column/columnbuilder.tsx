import { FC } from "react"
import { definition, styles, component } from "@uesio/ui"
import Column, { getColumnFlexStyles } from "./column"
import { LayoutDefinition } from "../io.layout/layoutdefinition"

import FieldHints from "./fieldhints"
const BuildWrapper = component.registry.getUtility("studio.buildwrapper")
const ColumnBuilder: FC<definition.BaseProps> = (props) => {
	const { path = "", context } = props
	const wire = context.getWire()

	const layoutOverrides = (() => {
		if (!path) return {}
		const pathArray = component.path.fromArray(path)
		const pathToLayout = pathArray.slice(0, -3)
		const { template } =
			context.getInViewDef<LayoutDefinition>(pathToLayout)
		return template ? getColumnFlexStyles(template, path) : {}
	})()

	const classes = styles.useStyles(
		{
			root: {
				...layoutOverrides,

				".hint": {
					maxHeight: "0px",
					opacity: 0,
					willChange: "max-height",
					transition: "all 0.6s ease",
				},
				"&:hover .hint": {
					opacity: 1,
					maxHeight: "100px",
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
