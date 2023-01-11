import { FunctionComponent } from "react"
import { MDOptions } from "../markdownfield/types"

import { definition, context, collection, wire, api, metadata } from "@uesio/ui"

import { FieldState, LabelPosition } from "../../components/field/field"
import MarkDownField from "../markdownfield/markdownfield"

interface FileMarkDownProps extends definition.UtilityProps {
	label?: string
	width?: string
	fieldId: string
	fieldMetadata: collection.Field
	labelPosition?: LabelPosition
	id?: string
	mode?: context.FieldMode
	record: wire.WireRecord
	wire: wire.Wire
	variant?: metadata.MetadataKey
	options?: MDOptions
}

const FileMarkDown: FunctionComponent<FileMarkDownProps> = (props) => {
	const { fieldId, fieldMetadata, record, wire, context, id, mode, options } =
		props

	const userFile = record.getFieldValue<wire.PlainWireRecord>(fieldId)
	const fileName = userFile?.["uesio/core.name"] as string
	const mimeType = "text/markdown; charset=utf-8"

	const fileContent = api.file.useUserFile(context, record, fieldId)
	const componentId = api.component.getComponentId(
		id,
		"uesio/io.field",
		props.path,
		context
	)
	const [state, setState] = api.component.useState<FieldState>(componentId, {
		value: fileContent,
		originalValue: fileContent,
		recordId: record.getIdFieldValue() || "",
		fieldId,
		collectionId: wire.getCollection().getFullName(),
		fileName,
		mimeType,
	})

	return (
		<MarkDownField
			context={context}
			fieldMetadata={fieldMetadata}
			value={state?.value || fileContent || ""}
			mode={mode}
			setValue={(value: string) => {
				if (!state) return
				setState({
					...state,
					value,
				})
			}}
			options={options}
			variant={props.variant}
		/>
	)
}

export default FileMarkDown
