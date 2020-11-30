import React, { ReactElement, useState } from "react"
import { definition, material, collection, wire, component } from "@uesio/ui"
import LazyMonaco from "@uesio/lazymonaco"

type CodeFieldDefinition = {
	fieldId: string
	height: string
	language?: CodeFieldLanguage
	id?: string
}

type CodeFieldLanguage = "yaml" | "json" | "javascript"

const tryParseJSON = (jsonString: string) => {
	try {
		const o = JSON.parse(jsonString)

		// Handle non-exception-throwing cases:
		// Neither JSON.parse(false) or JSON.parse(1234) throw errors, hence the type-checking,
		// but... JSON.parse(null) returns null, and typeof null === "object",
		// so we must check for that, too. Thankfully, null is falsey, so this suffices:
		if (o && typeof o === "object") {
			return o
		}
	} catch (e) {
		return false
	}
}

interface Props extends definition.BaseProps {
	definition: CodeFieldDefinition
}

const useStyles = material.makeStyles((theme) =>
	material.createStyles({
		root: () => ({
			margin: theme.spacing(1),
		}),
		input: (props: Props) => ({
			height: props.definition.height || "200px",
			margin: theme.spacing(1, 0),
			border: "1px solid #c8c8c8",
		}),
	})
)

function getChangeHandler(
	fieldType: collection.FieldType,
	language: CodeFieldLanguage,
	record: wire.WireRecord,
	fieldId: string,
	setMessage: React.Dispatch<React.SetStateAction<string>>,
	setStringValue: React.Dispatch<React.SetStateAction<string>>
) {
	switch (fieldType) {
		case "MAP":
			return (newValue: string) => {
				if (language === "json") {
					setStringValue(newValue)
					const jsonValue = tryParseJSON(newValue)
					if (jsonValue) {
						record.update(fieldId, jsonValue)
						setMessage("")
						return
					}
					setMessage("Invalid JSON")
					return
				}
				setMessage("Language not supported for maps: " + language)
			}
		default:
			return (newValue: string) => {
				record.update(fieldId, newValue)
			}
	}
}

function getValue(
	fieldType: collection.FieldType,
	language: CodeFieldLanguage,
	value: wire.FieldValue,
	setMessage: React.Dispatch<React.SetStateAction<string>>
): string {
	switch (fieldType) {
		case "MAP":
			if (language === "json") {
				return JSON.stringify(value, null, "\t")
			}
			setMessage("Language not supported for maps: " + language)
			return ""
		default:
			return (value || "") as string
	}
}

function CodeField(props: Props): ReactElement | null {
	const classes = useStyles(props)
	const record = props.context.getRecord()
	const wire = props.context.getWire()
	const [message, setMessage] = useState("")
	const [stringValue, setStringValue] = useState("")
	if (!wire || !record) {
		return null
	}

	const collection = wire.getCollection()
	const fieldId = props.definition.fieldId

	const fieldMetadata = collection.getField(fieldId)
	const fieldType = fieldMetadata.getType()
	const value = record.getFieldValue(fieldId)

	if (!fieldMetadata.isValid()) {
		return null
	}
	const language = props.definition.language || "yaml"

	const AlertComponent = component.registry.get("material", "alert")

	return (
		<div className={classes.root}>
			<material.InputLabel shrink={true}>
				{fieldMetadata.getLabel()}
			</material.InputLabel>
			{message && (
				<AlertComponent
					{...props}
					onClose={() => setMessage("")}
					severity="error"
				>
					{message}
				</AlertComponent>
			)}
			<div className={classes.input}>
				<LazyMonaco
					value={
						stringValue ||
						getValue(fieldType, language, value, setMessage)
					}
					language={language}
					onChange={getChangeHandler(
						fieldType,
						language,
						record,
						fieldId,
						setMessage,
						setStringValue
					)}
				/>
			</div>
		</div>
	)
}

export default CodeField
