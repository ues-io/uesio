import React, { FunctionComponent, useEffect } from "react"
import { definition, component, hooks } from "@uesio/ui"
import { metadata } from "@uesio/constants"
import { Grid } from "@material-ui/core"

type MetadataFieldDefinition = {
	fieldId: string
	metadataType: metadata.MetadataType
	label: string
}

interface Props extends definition.BaseProps {
	definition: MetadataFieldDefinition
}

const MetadataField: FunctionComponent<Props> = (props) => {
	const {
		context,
		definition: { fieldId, label, metadataType },
	} = props
	const uesio = hooks.useUesio(props)
	const record = context.getRecord()
	const wire = context.getWire()
	const view = context.getView()
	const workspaceName = view?.params?.workspacename
	const appName = view?.params?.appname

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
	const fieldMetadata = collection.getField(fieldId)
	const mode = context.getFieldMode() || "READ"
	const value = record.getFieldValue(fieldId) as string
	const namespaces = uesio.builder.useAvailableNamespaces(uesio.getContext())
	const [namespace, name] = component.path.parseKey(value)
	const metadata = uesio.builder.useMetadataList(metadataType, namespace)

	const valueUesioCollectionname = record.getFieldValue(
		"uesio.collectionname"
	) as string

	const grouping = valueUesioCollectionname
		? `${namespace}.${valueUesioCollectionname}`
		: //This reads the fields from the Ref. collection
		  //grouping = record.getFieldValue("uesio.referencedCollection") as string
		  //This read the fields from the actual collection
		  (record.getFieldValue("uesio.collection") as string)

	useEffect(() => {
		if (!metadata && namespace && metadataType === "FIELD") {
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
		}
	})

	if (!fieldMetadata) return null

	if (mode === "READ") {
		return <component.Component {...props} componentType="field" />
	}

	const SelectField = component.registry.get("material", "selectfield")

	const options =
		metadataType === "FIELD"
			? Object.keys(metadata?.[grouping] || {})?.map?.((key) => {
					const [, name] = component.path.parseKey(key)
					return {
						value: name,
						label: name,
					}
			  })
			: Object.keys(metadata || {}).map((key) => {
					const [, name] = component.path.parseKey(key)
					return {
						value: name,
						label: name,
					}
			  })

	return (
		<Grid container spacing={1}>
			<Grid item xs={6}>
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
						Object.keys(namespaces || {}).map((key) => ({
							value: key,
							label: key,
						}))
					)}
					setValue={(value: string) => {
						record.update(fieldId, value ? `${value}.` : "")
					}}
				/>
			</Grid>
			<Grid item xs={6}>
				<SelectField
					{...props}
					label=" "
					value={name}
					options={options}
					setValue={(value: string) => {
						record.update(fieldId, `${namespace}.${value}`)
					}}
				/>
			</Grid>
		</Grid>
	)
}

export default MetadataField
