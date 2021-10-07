import { FC } from "react"
import { component, styles } from "@uesio/ui"
import { TableColumnProps } from "./tablecolumndefinition"

const Layout: FC<TableColumnProps> = (props) => {
	const { context, path = "", definition } = props

	const { fitToContent } = context.getParentComponentDef(path)
	const classes = styles.useStyles(
		{
			root: {
				minHeight: "50px",
				flex: fitToContent ? "none" : 1,
			},
		},
		props
	)

	return (
		<div className={classes.root} {...props}>
			{definition.field && (
				<component.Component
					componentType="io.field"
					definition={{
						fieldId: definition.field,
						hideLabel: true,
						"uesio.variant": "io.table",
					}}
					path={path}
					context={context}
				/>
			)}
			{/* <component.Slot
				definition={definition}
				listName="components"
				path={path}
				accepts={["uesio.context"]}
				context={context}
			/> */}
		</div>
	)
}

export default Layout
