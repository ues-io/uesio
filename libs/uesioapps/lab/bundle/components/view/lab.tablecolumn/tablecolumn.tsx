import { FC } from "react"
import { component, styles } from "@uesio/ui"
import { TableColumnProps } from "./tablecolumndefinition"

const TableColumn: FC<TableColumnProps> = (props) => {
	const { context, path = "", definition, style } = props

	const classes = styles.useStyles(
		{
			root: {
				minHeight: "50px",
				flex: 1,
				border: "1px solid #eee",
				padding: "5px",
				height: "100%",
				display: "flex",
				flexFlow: "column",
				justifyContent: definition.verticalAlignment,
				// order: definition.order || "initial",
			},
		},
		props
	)

	const searchFields = (k: any) => /(io.field)$/.test(Object.keys(k)[0])
	const fieldComponentKey = definition.components.find(searchFields) as {
		[key: string]: { fieldId: string }
	}

	const newDefinition = {
		...definition,
		components: [
			...definition.components.filter(
				(k: any) => Object.keys(k)[0] !== "io.field"
			),
		],
	}

	return (
		<div style={style} className={classes.root}>
			{fieldComponentKey && (
				<component.Component
					componentType="io.field"
					definition={{
						fieldId: fieldComponentKey["io.field"]?.fieldId,
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

export default TableColumn
