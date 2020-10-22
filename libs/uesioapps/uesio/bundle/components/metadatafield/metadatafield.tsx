import React, { ReactElement, useEffect } from "react"
import { definition, material, component, hooks } from "@uesio/ui"

type MetadataFieldDefinition = {
	fieldId: string
	metadataType: string
	label: string
}

interface Props extends definition.BaseProps {
	definition: MetadataFieldDefinition
}

function MetadataField(props: Props): ReactElement | null {
	const uesio = hooks.useUesio(props)
	const record = props.context.getRecord()
	const wire = props.context.getWire()
	const view = props.context.getView()
	const workspaceName = view?.getParam("workspacename")
	const appName = view?.getParam("appname")

	if (!wire || !record || !workspaceName || !appName) {
		return null
	}

	uesio.addContextFrame({
		workspace: {
			name: workspaceName,
			app: appName,
		},
	})

	const collection = wire.getCollection()
	const fieldId = props.definition.fieldId
	const label = props.definition.label
	const fieldMetadata = collection.getField(fieldId)
	const mode = props.context.getFieldMode() || "READ"
	const value = record.getFieldValue(fieldId) as string
	const metadataType = props.definition.metadataType

	const namespaces = uesio.builder.useAvailableNamespaces()

	const [namespace, name] = component.path.parseKey(value)

	const metadata = uesio.builder.useMetadataList(metadataType, namespace)

	useEffect(() => {
		if (!namespaces) {
			uesio.builder.getAvailableNamespaces(uesio.getContext())
			return
		}
		if (!metadata && namespace) {
			uesio.builder.getMetadataList(
				uesio.getContext(),
				metadataType,
				namespace
			)
			return
		}
	})

	if (!fieldMetadata.isValid()) {
		return null
	}

	const FieldComponent = component.registry.get("material", "field")

	if (mode === "READ") {
		return <FieldComponent {...props}></FieldComponent>
	}

	const SelectField = component.registry.get("material", "selectfield")

	return (
		<material.Grid container spacing={1}>
			<material.Grid item xs={6}>
				<SelectField
					{...props}
					label={label}
					value={namespace}
					options={[
						{
							value: "",
							label: "<No Value>",
						},
					].concat(
						namespaces
							? Object.keys(namespaces).map((key) => {
									return {
										value: key,
										label: key,
									}
							  })
							: []
					)}
					setValue={(value: string) => {
						record.update(fieldId, value ? value + "." : "")
					}}
				></SelectField>
			</material.Grid>
			<material.Grid item xs={6}>
				<SelectField
					{...props}
					label=" "
					value={name}
					options={
						metadata
							? Object.keys(metadata).map((key) => {
									const [, name] = component.path.parseKey(
										key
									)
									return {
										value: name,
										label: name,
									}
							  })
							: []
					}
					setValue={(value: string) => {
						record.update(fieldId, namespace + "." + value)
					}}
				></SelectField>
			</material.Grid>
		</material.Grid>
	)
}

export default MetadataField
