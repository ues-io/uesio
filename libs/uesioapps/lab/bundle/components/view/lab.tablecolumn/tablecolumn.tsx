import { FC } from "react"
import { component, styles } from "@uesio/ui"
import { TableColumnProps } from "./tablecolumndefinition"

const Layout: FC<TableColumnProps> = (props) => {
	const { context, path = "", definition } = props

	// const { fitToContent } = context.getParentComponentDef(path)
	const classes = styles.useStyles(
		{
			root: {
				minHeight: "50px",
				flex: 1,
				border: "1px solid #eee",
				padding: "5px",
				height: "100%",
			},
		},
		props
	)

	const searchFields = (k: any) => Object.keys(k)[0] === "io.field"
	const fieldComponentKey = definition.components.find(searchFields)

	const newDefinition = {
		...definition,
		components: [
			...definition.components.filter(
				(k: any) => Object.keys(k)[0] !== "io.field"
			),
		],
	}

	return (
		<div className={classes.root}>
			{fieldComponentKey && (
				<component.Component
					componentType="io.field"
					definition={{
						fieldId: fieldComponentKey["io.field"].fieldId,
						hideLabel: true,
						"uesio.variant": "io.table",
					}}
					path={path}
					context={context.addFrame({
						buildMode: false,
					})}
				/>
			)}

			<component.Slot
				definition={newDefinition}
				listName="components"
				path={path}
				accepts={["uesio.standalone", "uesio.field"]}
				context={context}
			/>

			{/* {!definition.components.length && <div>Helper</div>} */}
		</div>
	)
}

export default Layout
