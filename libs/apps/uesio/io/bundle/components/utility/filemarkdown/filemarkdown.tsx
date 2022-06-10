import { FunctionComponent, useEffect } from "react"
import { MDOptions } from "../markdownfield/types"

import {
	definition,
	context,
	collection,
	wire,
	hooks,
	component,
} from "@uesio/ui"

import { FieldState, LabelPosition } from "../../view/field/fielddefinition"

import { MarkDownFieldProps } from "../markdownfield/markdownfield"

const MarkDownField = component.getUtility<MarkDownFieldProps>(
	"uesio/io.markdownfield"
)

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
	variant?: string
	options: MDOptions
}

const FileMarkDown: FunctionComponent<FileMarkDownProps> = (props) => {
	const uesio = hooks.useUesio(props)
	const {
		fieldId,
		fieldMetadata,
		record,
		wire,
		context,
		id,
		path,
		mode,
		options,
	} = props

	const userFile = record.getFieldValue<wire.PlainWireRecord | undefined>(
		fieldId
	)
	const fileName = userFile?.["uesio/core.name"] as string
	const mimeType = "text/markdown; charset=utf-8"

	const fileContent = uesio.file.useUserFile(context, record, fieldId)
	const componentId = id || path || ""
	const currentValue = uesio.component.useExternalState<FieldState>(
		context.getViewId() || "",
		"uesio/io.field",
		componentId
	)

	useEffect(() => {
		uesio.signal.run(
			{
				signal: "component/uesio/io.field/INIT_FILE",
				target: componentId,
				value: currentValue?.value || fileContent,
				recordId: record.getIdFieldValue(),
				fieldId,
				collectionId: wire.getCollection().getFullName(),
				fileName,
				mimeType,
			},
			context
		)
	}, [fileContent])

	return (
		<MarkDownField
			context={context}
			fieldMetadata={fieldMetadata}
			value={currentValue?.value || ""}
			mode={mode}
			setValue={(value: string) => {
				uesio.signal.run(
					{
						signal: "component/uesio/io.field/SET_FILE",
						target: componentId,
						value,
					},
					context
				)
			}}
			options={options}
			variant={props.variant}
		/>
	)
}

export default FileMarkDown
