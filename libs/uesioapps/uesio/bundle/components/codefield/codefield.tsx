import React, { ReactElement } from "react"
import { definition, material } from "@uesio/ui"
import LazyMonaco from "@uesio/lazymonaco"

type CodeFieldDefinition = {
	fieldId: string
	height: string
	language?: "yaml" | "json" | "javascript"
	id?: string
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

function CodeField(props: Props): ReactElement | null {
	const classes = useStyles(props)
	const record = props.context.getRecord()
	const wire = props.context.getWire()
	if (!wire || !record) {
		return null
	}

	const collection = wire.getCollection()
	const fieldId = props.definition.fieldId
	const fieldMetadata = collection.getField(fieldId)
	const value = record.getFieldValue(fieldId)

	if (!fieldMetadata.isValid()) {
		return null
	}

	const language = props.definition.language as string

	return (
		<div className={classes.root}>
			<material.InputLabel shrink={true}>
				{fieldMetadata.getLabel()}
			</material.InputLabel>
			<div className={classes.input}>
				<LazyMonaco
					{...{
						value: value as string,
						language: language,
						onChange: (newValue /*, event*/): void => {
							record.update(fieldId, newValue)
						},
					}}
				></LazyMonaco>
			</div>
		</div>
	)
}

export default CodeField
