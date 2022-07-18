import { context, hooks, definition, builder } from "@uesio/ui"
import { FC } from "react"
import has from "lodash/has"
import toPath from "lodash/toPath"
import PropNodeTag from "../buildpropitem/propnodetag"

const FieldTag: FC<{
	fieldId: string
	path: string
	collectionKey: string
	context: context.Context
	uesio: hooks.Uesio
	namespace: string
	valueAPI: builder.ValueAPI
}> = (props) => {
	const {
		fieldId,
		path,
		collectionKey,
		uesio,
		context,
		namespace,
		valueAPI,
	} = props
	const collection = uesio.collection.useCollection(context, collectionKey)
	const wireDef = valueAPI.get(path) as definition.DefinitionMap | undefined
	const fieldsDef = wireDef?.fields as definition.DefinitionMap
	const isFieldSelected = (path: string) => {
		const pathArray = toPath(path).slice(3)
		return !!has(fieldsDef, pathArray)
	}
	const field = collection?.getField(fieldId)
	const referencedCollection = field?.getReferenceMetadata()?.collection

	const nestedFields = Object.keys(
		uesio.builder.useMetadataList(
			context,
			"FIELD",
			namespace,
			referencedCollection
		) || {}
	)

	const setPath = `${path}["fields"]["${fieldId}"]`
	const selected = isFieldSelected(setPath)

	return (
		<PropNodeTag
			draggable={`${collectionKey}:${fieldId}`}
			title={fieldId}
			onClick={(e) => {
				e.stopPropagation()
				if (selected) return valueAPI.remove(setPath)
				// The yaml lib will fail if the field has a null value.
				valueAPI.get(path)
					? valueAPI.set(setPath, null)
					: valueAPI.set(`${path}["fields"]`, { [fieldId]: null })
			}}
			selected={selected}
			context={context}
			expandChildren={!!nestedFields.length}
		>
			{nestedFields.map((fieldId) => (
				<FieldTag
					{...props}
					fieldId={fieldId}
					key={fieldId}
					path={setPath}
					collectionKey={referencedCollection || ""}
				/>
			))}
		</PropNodeTag>
	)
}

export default FieldTag
