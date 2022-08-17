import {
	FunctionComponent,
	DragEvent,
	useState,
	SyntheticEvent,
	ChangeEvent,
} from "react"
import { SectionRendererProps } from "./sectionrendererdefinition"
import { hooks, component, definition } from "@uesio/ui"
import PropNodeTag from "../buildpropitem/propnodetag"

const TitleBar = component.getUtility("uesio/io.titlebar")

const FieldsSection: FunctionComponent<SectionRendererProps> = (props) => {
	const { path, context, valueAPI } = props
	const wireDef = valueAPI.get(path) as definition.DefinitionMap | undefined
	const collectionKey = wireDef?.collection as string | undefined

	if (!collectionKey) {
		return null
	}

	// Limit the fields to just the same namespace as the collection for now.
	// In theory, you could have fields from a different namespace attached to
	// this collection.
	const [namespace] = component.path.parseKey(collectionKey)

	const uesio = hooks.useUesio(props)
	const fields = uesio.builder.useMetadataList(
		context,
		"FIELD",
		namespace,
		collectionKey
	)

	const fieldsDef = wireDef?.fields as definition.DefinitionMap

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

	const [searchTerm, setSearchTerm] = useState("")
	const handleChange = (value: string) => {
		setSearchTerm(value)
	}

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
						onChange={(event: ChangeEvent<HTMLInputElement>) => {
							handleChange(event.target.value)
						}}
						onClick={(event: SyntheticEvent): void => {
							event.stopPropagation()
						}}
						type="search"
						placeholder="Search..."
					/>
				}
			/>
			<div onDragStart={onDragStart} onDragEnd={onDragEnd}>
				{collectionKey &&
					results &&
					results.map((fieldId, index) => {
						const fieldDef = fieldsDef?.[fieldId]
						const selected = fieldDef !== undefined
						const onClick = (): void => {
							const setPath = `${path}["fields"]["${fieldId}"]`
							selected
								? valueAPI.remove(setPath)
								: valueAPI.set(setPath, null)
						}
						return (
							<PropNodeTag
								draggable={`${collectionKey}:${fieldId}`}
								key={index}
								onClick={onClick}
								selected={selected}
								context={context}
							>
								{fieldId}
							</PropNodeTag>
						)
					})}
			</div>
		</>
	)
}

export default FieldsSection
