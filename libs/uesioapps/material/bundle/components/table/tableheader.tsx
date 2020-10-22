import React, { FC } from "react"

import { material, collection, definition } from "uesio"
import { ColumnDefinition } from "./tabledefinition"

type Props = {
	columns: definition.DefinitionList
	collection: collection.Collection
}

const TableHeader: FC<Props> = (props: Props) => {
	return (
		<material.TableHead key={0}>
			<material.TableRow>
				{props.columns.map((columnDef) => {
					const column = columnDef[
						"material.column"
					] as ColumnDefinition
					const fieldId = column.field
					const fieldMetadata = props.collection.getField(fieldId)
					return (
						<material.TableCell key={fieldId}>
							{column.label || fieldMetadata.getLabel()}
						</material.TableCell>
					)
				})}
			</material.TableRow>
		</material.TableHead>
	)
}

TableHeader.displayName = "TableHeader"

export default TableHeader
