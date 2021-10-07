import { FunctionComponent } from "react"
import { TableProps } from "./tabledefinition"
import { component, styles, hooks } from "@uesio/ui"
const LabLayout = component.registry.getUtility("lab.layout")

const Grid: FunctionComponent<TableProps> = (props) => {
	const uesio = hooks.useUesio(props)
	const { definition, context, path = "" } = props
	const wire = uesio.wire.useWire(definition.wire)

	// If we got a wire from the definition, add it to context
	const newContext = definition.wire
		? context.addFrame({
				wire: definition.wire,
		  })
		: context

	const classes = styles.useStyles(
		{
			root: {},
			column: {
				flex: 1,
			},
		},
		props
	)
	const records = wire?.getData() || []

	return (
		<div className={classes.root}>
			{/* row */}
			{/* row column */}
			<LabLayout classes={classes} context={props.context}>
				{definition.columns.map((c) => {
					const column = Object.values(c)[0]
					return (
						<div
							className={classes.column}
							style={{
								order: column.order || "initial",
								padding: "10px",
								backgroundColor: "#eee",
							}}
						>
							{column.name ||
								(definition.shortName
									? column.field.replace(/.*\./, "")
									: column.field)}
						</div>
					)
				})}
			</LabLayout>

			{records.map((record) => {
				const rowContext = context.addFrame({
					record: record.getId(),
					wire: wire?.getId() || "",
					fieldMode: "READ",
				})

				return (
					<LabLayout
						key={record.getId()}
						classes={classes}
						context={props.context}
					>
						<component.Slot
							definition={definition}
							listName="columns"
							path={path}
							accepts={["uesio.tablecolumn"]}
							context={rowContext}
						/>
						{/* {definition.columns.map((column, index) => {
							console.log({ column })
							return (
								// <div className={classes.column}>
								<component.Slot
									definition={column}
									listName="columns"
									path={path}
									accepts={["uesio.tablecolumn"]}
									context={rowContext}
								/>
								// </div>
							)
						})} */}
					</LabLayout>
				)
			})}
		</div>
	)
}

export default Grid
