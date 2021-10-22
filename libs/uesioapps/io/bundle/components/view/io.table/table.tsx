import { hooks, styles, component } from "@uesio/ui"
import { FunctionComponent } from "react"

import { ColumnDefinition, TableProps, TableState } from "./tabledefinition"

const Group = component.registry.getUtility("io.group")
const Button = component.registry.getUtility("io.button")
const IOTable = component.registry.getUtility("io.table")

const Table: FunctionComponent<TableProps> = (props) => {
	const { path, context, definition } = props
	const uesio = hooks.useUesio(props)
	const wire = uesio.wire.useWire(definition.wire)

	// If we got a wire from the definition, add it to context
	const newContext = definition.wire
		? context.addFrame({
				wire: definition.wire,
		  })
		: context

	const [componentState] = uesio.component.useState<TableState>(
		definition.id,
		{
			mode: definition.mode || "READ",
		}
	)

	if (!wire || !componentState || !path) return null

	const classes = styles.useStyles(
		{
			root: {},
		},
		props
	)

	const collection = wire.getCollection()

	const columns = definition.columns.map((columnDef) => {
		const column = columnDef["io.column"] as ColumnDefinition
		const fieldId = column.field
		const fieldMetadata = collection.getField(fieldId)
		return {
			label: column.label || fieldMetadata?.getLabel() || "",
		}
	})

	const rows = wire.getData().map((record, index) => {
		const recordContext = newContext.addFrame({
			record: record.getId(),
			wire: wire.getId(),
			fieldMode: componentState.mode,
		})
		return {
			cells: definition.columns.map((columnDef) => {
				const column = columnDef["io.column"] as ColumnDefinition
				return column.components ? (
					<component.Slot
						definition={column}
						listName="components"
						path={`${path}["columns"]["${index}"]["io.column"]`}
						accepts={["uesio.context"]}
						direction="horizontal"
						context={recordContext}
					/>
				) : (
					<component.Component
						componentType="io.field"
						definition={{
							fieldId: column.field,
							hideLabel: true,
							"uesio.variant": "io.table",
						}}
						index={index}
						path={`${path}["columns"]["${index}"]`}
						context={recordContext}
					/>
				)
			}),
			rowactions: definition.rowactions && (
				<Group
					styles={{ root: { padding: "0 16px" } }}
					columnGap={0}
					context={recordContext}
				>
					{definition.rowactions.map((action) => {
						const [handler, portals] = uesio.signal.useHandler(
							action.signals,
							recordContext
						)
						return (
							<Button
								variant="io.nav"
								className="rowaction"
								label={action.text}
								context={recordContext}
								onClick={handler}
							/>
						)
					})}
				</Group>
			),
			isDeleted: record.isDeleted(),
		}
	})

	return (
		<IOTable
			variant={definition["uesio.variant"]}
			rows={rows}
			columns={columns}
			context={context}
			classes={classes}
			showRowNumbers={definition.rownumbers}
			showRowActions={!!definition.rowactions}
		/>
	)
}

export default Table
