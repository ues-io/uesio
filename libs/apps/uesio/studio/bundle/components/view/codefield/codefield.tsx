import { FunctionComponent } from "react"
import { definition, component } from "@uesio/ui"

type CodeFieldDefinition = {
	fieldId: string
	height: string
	language?: CodeFieldLanguage
	id?: string
}

type CodeFieldLanguage = "yaml" | "json" | "javascript"

interface Props extends definition.BaseProps {
	definition: CodeFieldDefinition
}

const IOCodeField = component.getUtility("uesio/io.codefield")
const FieldWrapper = component.getUtility("uesio/io.fieldwrapper")

const CodeField: FunctionComponent<Props> = (props) => {
	const { context, definition } = props
	const record = context.getRecord()
	const wire = context.getWire()
	if (!wire || !record) {
		return null
	}

	const collection = wire.getCollection()
	const fieldId = definition.fieldId

	const fieldMetadata = collection.getField(fieldId)
	if (!fieldMetadata) return null
	const value = record.getFieldValue(fieldId)

	const language = definition.language || "yaml"

	const changeHandler = (newValue: string) => {
		const oldValue = context.getRecord()?.getFieldValue(fieldId) || ""
		if (newValue !== oldValue) record.update(fieldId, newValue)
	}

	return (
		<FieldWrapper context={context}>
			<IOCodeField
				label={fieldMetadata.getLabel()}
				value={value || ""}
				setValue={changeHandler}
				language={language}
				context={props.context}
			/>
		</FieldWrapper>
	)
}

export default CodeField
