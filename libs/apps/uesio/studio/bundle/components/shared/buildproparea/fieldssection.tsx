import { FC, DragEvent, useState } from "react"
import { SectionRendererProps } from "./sectionrendererdefinition"
import { hooks, component, definition } from "@uesio/ui"
import FieldTag from "./fieldtag"
const TitleBar = component.getUtility("uesio/io.titlebar")

const FieldsSection: FC<SectionRendererProps> = (props) => {
	const { path, context, valueAPI } = props
	const [searchTerm, setSearchTerm] = useState("")

	const wireDef = valueAPI.get(path) as definition.DefinitionMap | undefined
	const collectionKey = (wireDef?.collection as string) || ""
	// Limit the fields to just the same namespace as the collection for now.
	// In theory, you could have fields from a different namespace attached to
	// this collection.
	const [namespace] = component.path.parseKey(collectionKey)

	const uesio = hooks.useUesio(props)

	// Get field metadata
	// const collection = uesio.collection.useCollection(context, collectionKey)
	// const theme = uesio.getTheme()
	const fields = uesio.builder.useMetadataList(
		context,
		"FIELD",
		namespace,
		collectionKey
	)

	if (!collectionKey) {
		return null
	}

	const onDragStart = (e: DragEvent) => {
		const target = e.target as HTMLDivElement
		if (target && target.dataset.type) {
			uesio.builder.setDragNode("field", target.dataset.type, "")
		}
	}
	const onDragEnd = () => {
		uesio.builder.clearDragNode()
		uesio.builder.clearDropNode()
	}

	const fieldKeys = fields && Object.keys(fields)

	const results = !searchTerm
		? fieldKeys
		: fieldKeys &&
		  fieldKeys.filter((field) =>
				field.toLowerCase().includes(searchTerm.toLocaleLowerCase())
		  )

	return (
		<>
			<TitleBar
				variant="uesio/studio.propsubsection"
				title={""}
				context={context}
				actions={
					<input
						value={searchTerm}
						style={{
							outline: "none",
							padding: "4px",
							fontSize: "9pt",
							border: "none",
							background: "#eee",
							borderRadius: "4px",
						}}
						onChange={(event) => setSearchTerm(event.target.value)}
						onClick={(event) => event.stopPropagation()}
						type="search"
						placeholder="Search..."
					/>
				}
			/>
			<div onDragStart={onDragStart} onDragEnd={onDragEnd}>
				{collectionKey &&
					results &&
					results.map((fieldId, index) => (
						<FieldTag
							context={context}
							uesio={uesio}
							fieldId={fieldId}
							key={index}
							path={path || ""}
							namespace={namespace}
							valueAPI={valueAPI}
							collectionKey={collectionKey}
						/>
					))}
			</div>
		</>
	)
}

export default FieldsSection
