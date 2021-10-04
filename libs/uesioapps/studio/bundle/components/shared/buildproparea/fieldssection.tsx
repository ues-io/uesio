import { FunctionComponent, DragEvent, useState } from "react"
import { hooks, component, definition, styles } from "@uesio/ui"
import { SectionRendererProps } from "./sectionrendererdefinition"
import ExpandPanel from "../expandpanel"
import FieldRemove from "./fieldRemove"
import PropNodeTag from "../buildpropitem/propnodetag"

const FieldsSection: FunctionComponent<SectionRendererProps> = (props) => {
	const { section, path, context, valueAPI } = props
	const uesio = hooks.useUesio(props)

	// Field removal
	const [anchorEl, setAnchorEl] = useState<HTMLDivElement | null>(null)
	const [fieldToRemove, setFieldToRemove] = useState<string | null>(null)

	const wireDef = valueAPI.get(path) as definition.DefinitionMap | undefined
	// Limit the fields to just the same namespace as the collection for now.
	// In theory, you could have fields from a different namespace attached to
	// this collection.
	const collectionKey = wireDef?.collection as string | undefined
	const [namespace] = component.path.parseKey(collectionKey || "")
	const fields = uesio.builder.useMetadataList(
		context,
		"FIELD",
		namespace,
		collectionKey
	)

	const classes = styles.useUtilityStyles(
		{
			search: {
				marginBottom: "2px",
				width: "100%",
				height: "30px",
				outline: 0,
				borderWidth: "0 0 1px",
			},
		},
		null
	)

	const theme = uesio.getTheme()

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

	const handleFieldClick = (fieldId: string) => {
		const selected = fieldsDef?.[fieldId] !== undefined

		return selected
			? setFieldToRemove(fieldId)
			: valueAPI.addPair(`${path}["fields"]`, null, fieldId)
	}

	return (
		<ExpandPanel
			defaultExpanded={false}
			title={section.title}
			context={context}
			searchValue={searchTerm}
			onSearch={handleChange}
		>
			<div
				style={{
					display: "grid",
					rowGap: "8px",
				}}
				onDragStart={onDragStart}
				onDragEnd={onDragEnd}
				ref={setAnchorEl}
			>
				{fieldToRemove && (
					<FieldRemove
						valueAPI={valueAPI}
						anchorEl={anchorEl}
						fieldId={fieldToRemove}
						path={path}
						context={context}
					/>
				)}
				{collectionKey &&
					results &&
					results.map((fieldId, index) => {
						const fieldDef = fieldsDef?.[fieldId]
						const selected = fieldDef !== undefined

						return (
							<div
								ref={
									fieldId === fieldToRemove
										? setAnchorEl
										: null
								}
							>
								<PropNodeTag
									draggable={`${collectionKey}.${fieldId}`}
									title={fieldId}
									icon={
										selected
											? "check_box"
											: "check_box_outline_blank"
									}
									iconColor={
										selected
											? theme.definition.palette.primary
											: undefined
									}
									key={index}
									onClick={() => handleFieldClick(fieldId)}
									context={context}
								/>
							</div>
						)
					})}
			</div>
		</ExpandPanel>
	)
}

export default FieldsSection
