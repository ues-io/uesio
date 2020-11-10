import { LoadResponse, PlainCollectionMap } from "../wire/loadresponse"

import cli from "cli-ux"
import chalk from "chalk"

type TableColumn = {
	id: string
	type?: string
}

const wiretable = (
	response: LoadResponse,
	metadata: PlainCollectionMap,
	columns: TableColumn[]
): void => {
	const collectionMetadata = metadata[response.collection]
	const tableColumns = {} as any

	columns.forEach((column) => {
		const fieldMetadata = collectionMetadata.fields[column.id]
		const tableColumn = {
			header: fieldMetadata.label,
		} as any
		if (column.type === "COLOR") {
			tableColumn.get = (row: any): string => {
				const value = row[column.id]
				return chalk.hex(value).bold(value)
			}
		}
		tableColumns[column.id] = tableColumn
	})
	cli.table(response.data, tableColumns)
}

export { wiretable, TableColumn }
