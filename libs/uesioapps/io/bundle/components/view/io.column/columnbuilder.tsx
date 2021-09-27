import { FC } from "react"
import { definition, styles, component } from "@uesio/ui"
import Column, { getColumnFlexStyles } from "./column"
import FieldHints from "./fieldhints"
const BuildWrapper = component.registry.getUtility("studio.buildwrapper")

const ColumnBuilder: FC<definition.BaseProps> = (props) => {
	const { path = "", context, index = 0 } = props
	const wire = context.getWire()
	const template: string = context.getParentComponentDef(path)?.template

	const classes = styles.useStyles(
		{
			root: {
				...getColumnFlexStyles(template, index),
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

		{ context }
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
