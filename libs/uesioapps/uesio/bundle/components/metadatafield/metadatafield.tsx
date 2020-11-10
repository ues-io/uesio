//  @ts-nocheck
import React, { FunctionComponent, useEffect } from "react"
import { definition, material, component, hooks } from "@uesio/ui"

type MetadataFieldDefinition = {
	fieldId: string
	metadataType: string
	label: string
}

interface Props extends definition.BaseProps {
	definition: MetadataFieldDefinition
}

const MetadataField: FunctionComponent<Props> = (props) => {
	const { context, definition } = props
	const uesio = hooks.useUesio(props)
	const record = context.getRecord()
	const wire = context.getWire()
	const view = context.getView()
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
	const fieldId = definition.fieldId
	const label = definition.label
	const fieldMetadata = collection.getField(fieldId)
	const mode = context.getFieldMode() || "READ"
	const value = record.getFieldValue(fieldId) as string
	const metadataType = definition.metadataType
	const namespaces = uesio.builder.useAvailableNamespaces()
	const [namespace, name] = component.path.parseKey(value)
	const metadata = uesio.builder.useMetadataList(metadataType, namespace)

	const value_uesio_collectionname = record.getFieldValue(
		"uesio.collectionname"
	) as string

	const grouping = value_uesio_collectionname
		? `${namespace}.${value_uesio_collectionname}`
		: //This reads the fields from the Ref. collection
		  //grouping = record.getFieldValue("uesio.referencedCollection") as string
		  //This read the fields from the actual collection
		  (record.getFieldValue("uesio.collection") as string)

	useEffect(() => {
		if (!namespaces) {
			uesio.builder.getAvailableNamespaces(uesio.getContext())
			return
		}
		if (!metadata && namespace && metadataType == "FIELD") {
			uesio.builder.getMetadataList(
				uesio.getContext(),
				metadataType,
				namespace,
				grouping
			)
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
		return <FieldComponent {...props} />
	}

	const SelectField = component.registry.get("material", "selectfield")

	const options =
		metadataType == "FIELD"
			? (metadata &&
					Object.keys(metadata[grouping] as Object).map((key) => {
						const [, name] = component.path.parseKey(key)
						return {
							value: name,
							label: name,
						}
					})) ||
			  []
			: (metadata &&
					Object.keys(metadata).map((key) => {
						const [, name] = component.path.parseKey(key)
						return {
							value: name,
							label: name,
						}
					})) ||
			  []

	if (metadataType === "FILE") {
		return <div>this is type file</div>
	} else {
		return <div>this is NOT type file</div>
	}

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
						(namespaces &&
							Object.keys(namespaces).map((key) => ({
								value: key,
								label: key,
							}))) ||
							[]
					)}
					setValue={(value: string) => {
						record.update(fieldId, value ? value + "." : "")
					}}
				/>
			</material.Grid>
			<material.Grid item xs={6}>
				<SelectField
					{...props}
					label=" "
					value={name}
					options={options}
					setValue={(value: string) => {
						record.update(fieldId, namespace + "." + value)
					}}
				/>
			</material.Grid>
		</material.Grid>
	)
}

export default MetadataField
