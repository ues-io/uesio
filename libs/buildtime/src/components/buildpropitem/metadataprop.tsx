import React, { FunctionComponent, useEffect } from "react"
import { PropRendererProps } from "./proprendererdefinition"
import { definition, component, hooks, builder, material } from "@uesio/ui"
import SelectProp from "./selectprop"

const MetadataProp: FunctionComponent<PropRendererProps> = (props) => {
	const uesio = hooks.useUesio(props)
	const descriptor = props.descriptor as builder.MetadataProp
	const metadataType = descriptor.metadataType

	const namespaces = uesio.builder.useAvailableNamespaces()

	let grouping = ""

	if (descriptor.groupingParents) {
		const groupingNodePath = component.path.getAncestorPath(
			props.path,
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

	const value = props.getValue() as string
	const [namespace, name] = component.path.parseKey(value)

	const metadata = uesio.builder.useMetadataList(
		metadataType,
		namespace,
		grouping
	)

	useEffect(() => {
		if (!namespaces) {
			uesio.builder.getAvailableNamespaces(props.context)
			return
		}
		if (!metadata && namespace) {
			uesio.builder.getMetadataList(
				props.context,
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
							props.setValue(value + ".")
						}}
						getValue={() => namespace}
						descriptor={{
							...descriptor,
							options: Object.keys(namespaces).map((key) => ({
								value: key,
								label: key,
							})),
						}}
					/>
				) : (
					<SelectProp {...props} />
				)}
			</material.Grid>
			<material.Grid item xs={6}>
				{metadata ? (
					<SelectProp
						{...props}
						setValue={(value: string) => {
							props.setValue(namespace + "." + value)
						}}
						getValue={() => name}
						descriptor={{
							...descriptor,
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
							label: "",
						}}
					/>
				)}
			</material.Grid>
		</material.Grid>
	)
}

export default MetadataProp
