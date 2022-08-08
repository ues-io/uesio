import { context, hooks, definition, builder, collection } from "@uesio/ui"
import { FC } from "react"
import has from "lodash/has"
import toPath from "lodash/toPath"
import PropNodeTag from "../buildpropitem/propnodetagnew"

const FieldTag: FC<{
	fieldId: string
	path: string
	collection: collection.Collection
	context: context.Context
	uesio: hooks.Uesio
	namespace: string
	valueAPI: builder.ValueAPI
}> = (props) => {
	const { fieldId, path, collection, context, uesio, valueAPI } = props

	const wireDef = valueAPI.get(path) as definition.DefinitionMap | undefined
	const fieldsDef = wireDef?.fields as definition.DefinitionMap
	const isFieldSelected = (path: string) => {
		const pathArray = toPath(path).slice(-1)
		return !!has(fieldsDef, pathArray)
	}
	const field = collection?.getField(fieldId)
	const referencedCollectionKey = field?.getReferenceMetadata()?.collection
	const referencedCollectionNameSpace =
		referencedCollectionKey?.split(".")[0] || ""

	const nestedFields = Object.keys(
		uesio.builder.useMetadataList(
			context,
			"FIELD",
			referencedCollectionNameSpace,
			referencedCollectionKey
		) || {}
	)
	// console.log({
	// 	referencedCollectionNameSpace,
	// 	referencedCollectionKey,
	// 	[fieldId]: nestedFields,
	// })
	const referencedCollection = uesio.collection.useCollection(
		context,
		referencedCollectionKey || ""
	)

	const setPath = `${path}["fields"]["${fieldId}"]`
	const selected = isFieldSelected(setPath)

	return (
		<PropNodeTag
			draggable={`${collection.getId()}:${fieldId}`}
			onClick={(e) => {
				e.stopPropagation()
				if (selected) return valueAPI.remove(setPath)
				// The yaml lib will fail if the field has a null value.
				console.log({ x: valueAPI.get(path) })
				valueAPI.get(path)
					? valueAPI.set(setPath, null)
					: valueAPI.set(`${path}["fields"]`, { [fieldId]: null })
			}}
			selected={selected}
			context={context}
			expandChildren={
				referencedCollection &&
				nestedFields.map((fieldId) => {
					console.log({ fieldId })
					return (
						<FieldTag
							{...props}
							fieldId={fieldId}
							key={fieldId}
							path={setPath}
							collection={referencedCollection}
						/>
					)
				})
			}
		>
			<p>{fieldId}</p>
		</PropNodeTag>
	)
}

export default FieldTag
