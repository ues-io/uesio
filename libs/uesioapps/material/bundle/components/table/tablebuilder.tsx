import React, { ReactElement } from "react"
import { hooks, component } from "uesio"
import { TableProps, TableDefinition } from "./tabledefinition"
import Table from "./table"

function TableBuilder(props: TableProps): ReactElement {
	const uesio = hooks.useUesio(props)
	const definition = uesio.view.useDefinition(props.path) as TableDefinition
	const buildView = uesio.builder.useView()
	const isExpanded = buildView === "expandedview"

	const path = props.path
	const context = props.context

	const slotProps = {
		definition,
		listName: "columns",
		path,
		accepts: ["uesio.field", "material.column"],
		context: context.addFrame({
			noMerge: true,
		}),
		direction: "horizontal",
	}
	return (
		<>
			{isExpanded && (
				<div
					style={{
						border: "1px dashed #ccc",
						minHeight: "40px",
						margin: "8px",
						backgroundColor: "#f5f5f5",
					}}
				>
					<component.Slot {...slotProps}></component.Slot>
				</div>
			)}
			<Table {...props} definition={definition}></Table>
		</>
	)
}

export default TableBuilder
