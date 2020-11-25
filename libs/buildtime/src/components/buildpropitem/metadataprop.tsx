import React, { FunctionComponent, useEffect } from "react"
import { PropRendererProps } from "./proprendererdefinition"
import { definition, component, hooks, builder, material } from "@uesio/ui"
import SelectProp from "./selectprop"

interface MetadataPropRendererProps extends PropRendererProps {
	descriptor: builder.MetadataProp
}

const MetadataProp: FunctionComponent<MetadataPropRendererProps> = (props) => {
	const uesio = hooks.useUesio(props)
	const { path, getValue, context, setValue, descriptor } = props
	const metadataType = descriptor.metadataType
	const value = getValue() as string

	const namespaces = uesio.builder.useAvailableNamespaces()

	let grouping = ""

	if (descriptor.groupingParents) {
		const groupingNodePath = component.path.getAncestorPath(
			path,
			descriptor.groupingParents
		)

		const groupingNode = uesio.view.useDefinition(
			groupingNodePath
		) as definition.DefinitionMap

		if (!descriptor.groupingProperty) {
			return null
		}

		grouping = groupingNode[descriptor.groupingProperty] as string
	}

	const [namespace, name] = component.path.parseKey(value)

	const metadata = uesio.builder.useMetadataList(
		metadataType,
		namespace,
		grouping
	)

	useEffect(() => {
		if (!namespaces) {
			uesio.builder.getAvailableNamespaces(context)
			return
		}
		if (!metadata && namespace) {
			uesio.builder.getMetadataList(
				context,
				metadataType,
				namespace,
				grouping
			)
			return
		}
	})

	return (
		<material.Grid container spacing={1}>
			<material.Grid item xs={6}>
				{namespaces ? (
					<SelectProp
						{...props}
						setValue={(value: string) => {
							setValue(value + ".")
						}}
						getValue={() => namespace}
						descriptor={{
							...descriptor,
							type: "SELECT",
							options: Object.keys(namespaces).map((key) => ({
								value: key,
								label: key,
							})),
						}}
					/>
				) : (
					<SelectProp
						{...props}
						descriptor={{
							...descriptor,
							type: "SELECT",
							label: "",
							options: [],
						}}
					/>
				)}
			</material.Grid>
			<material.Grid item xs={6}>
				{metadata ? (
					<SelectProp
						{...props}
						setValue={(value: string) => {
							setValue(namespace + "." + value)
						}}
						getValue={() => name}
						descriptor={{
							...descriptor,
							type: "SELECT",
							label: "",
							options: Object.keys(metadata).map((key) => {
								const [, name] = component.path.parseKey(key)
								return {
									value: name,
									label: name,
								}
							}),
						}}
					/>
				) : (
					<SelectProp
						{...props}
						descriptor={{
							...descriptor,
							type: "SELECT",
							label: "",
							options: [],
						}}
					/>
				)}
			</material.Grid>
		</material.Grid>
	)
}

export default MetadataProp
