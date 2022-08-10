import { FC, DragEvent, useState, SyntheticEvent, ChangeEvent } from "react"
import { SectionRendererProps } from "./sectionrendererdefinition"
import { hooks, component, definition } from "@uesio/ui"
import PropNodeTag from "../buildpropitem/propnodetagnew"

const TitleBar = component.getUtility("uesio/io.titlebar")

type FieldProp = { fieldId: string; fields: FieldProp[] }
type FieldDef = null | { fields: FieldDef }

const Button = component.getUtility("uesio/io.button")
const Icon = component.getUtility("uesio/io.icon")
const FieldsSection: FC<SectionRendererProps> = (props) => {
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
	const theme = uesio.getTheme()
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

	const handleField = ([key, value]: [string, FieldDef]): FieldProp => ({
		fieldId: key,
		fields:
			value && value.fields
				? Object.entries(value.fields).map((el) => handleField(el))
				: [],
	})

	const formattedFields = Object.entries(wireDef?.fields || {}).map((el) =>
		handleField(el)
	)

	const FieldRenderer: FC<FieldProp> = ({ fieldId, fields }) => (
		<PropNodeTag
			draggable={`${collectionKey}:${fieldId}`}
			key={fieldId}
			context={context}
		>
			<p>{fieldId}</p>
			{fields?.map((el) => (
				<FieldRenderer
					key={fieldId}
					fieldId={el.fieldId}
					fields={el.fields}
				/>
			))}
		</PropNodeTag>
	)
	return (
		<>
			<TitleBar
				variant="uesio/studio.propsubsection"
				title={""}
				context={context}
				actions={
					<>
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
							onChange={(
								event: ChangeEvent<HTMLInputElement>
							) => {
								handleChange(event.target.value)
							}}
							onClick={(event: SyntheticEvent): void => {
								event.stopPropagation()
							}}
							type="search"
							placeholder="Search..."
						/>
						<Button
							context={context}
							variant="uesio/studio.actionbutton"
							icon={
								<Icon
									context={context}
									icon="library_add"
									variant="uesio/studio.actionicon"
								/>
							}
							label="Add fields"
							onClick={() => null}
						/>
					</>
				}
			/>
			<div onDragStart={onDragStart} onDragEnd={onDragEnd}>
				{collectionKey &&
					formattedFields.map(({ fieldId, fields }) => (
						// const onClick = (): void => {
						// 	const setPath = `${path}["fields"]["${fieldId}"]`
						// 	selected
						// 		? valueAPI.remove(setPath)
						// 		: valueAPI.set(setPath, null)
						// }
						<FieldRenderer
							key={fieldId}
							fieldId={fieldId}
							fields={fields as any}
						/>
					))}
			</div>
		</>
	)
}

export default FieldsSection
