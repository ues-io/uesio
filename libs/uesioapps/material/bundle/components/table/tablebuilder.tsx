import React, { FunctionComponent } from "react"
import { hooks, component } from "@uesio/ui"
import { TableProps, TableDefinition } from "./tabledefinition"
import Table from "./table"

const TableBuilder: FunctionComponent<TableProps> = (props) => {
	const { path, context } = props
	const uesio = hooks.useUesio(props)
	const definition = uesio.view.useDefinition(props.path) as TableDefinition
	const buildView = uesio.builder.useView()
	const isContentView = buildView === "contentview"

	return (
		<>
			{isContentView && (
				<div
					style={{
						border: "1px dashed #ccc",
						minHeight: "40px",
						margin: "8px",
						backgroundColor: "#f5f5f5",
					}}
				>
					<component.Slot
						definition={definition}
						listName="columns"
						path={path}
						accepts={["uesio.field", "material.column"]}
						context={context.addFrame({ noMerge: true })}
						direction="horizontal"
					/>
				</div>
			)}
			<Table {...props} definition={definition} />
		</>
	)
}

export default TableBuilder
