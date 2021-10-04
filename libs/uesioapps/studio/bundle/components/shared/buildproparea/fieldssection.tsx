import { FunctionComponent, DragEvent, useState, useRef } from "react"
import { SectionRendererProps } from "./sectionrendererdefinition"
import ExpandPanel from "../expandpanel"
import { hooks, component, definition, styles } from "@uesio/ui"
import PropNodeTag from "../buildpropitem/propnodetag"
const Popper = component.registry.getUtility("io.popper")
const IOButton = component.registry.getUtility("io.button")
const IOIcon = component.registry.getUtility("io.icon")
import FieldDelete from "./fieldDelete"
const { makeFullPath, parseKey } = component.path

function flattenObj(
	obj: any,
	parent?: string,
	res: { [key: string]: any } = {}
) {
	for (const key in obj) {
		const propName = parent ? parent + "_" + key : key
		if (typeof obj[key] === "object") {
			flattenObj(obj[key], propName, res)
		} else {
			res[propName] = obj[key]
		}
	}
	return res
}

const useHighlightedFields = () => {
	const [highlightedFields, setHighlightedFields] = useState<
		NodeListOf<HTMLDivElement> | []
	>([])

	const updateHighlightedFields = (fieldId: string) => {
		// Remove border from currently highlighted fields
		if (highlightedFields.length)
			highlightedFields.forEach((el) => (el.style.border = ""))

		const fields = document.querySelectorAll<HTMLDivElement>(
			`[data-fieldid="${fieldId}"]`
		)
		setHighlightedFields(fields)
		fields.forEach((el) => (el.style.border = "1px solid red"))
	}

	return updateHighlightedFields
}

const FieldsSection: FunctionComponent<SectionRendererProps> = (props) => {
	const { section, path, context, valueAPI } = props
	const uesio = hooks.useUesio(props)

	// Field deletion \
	const [anchorEl, setAnchorEl] = useState<HTMLDivElement | null>(null)
	const [fieldToRemove, setFieldToRemove] = useState<string | null>(null)
	const wireDef = valueAPI.get(path) as definition.DefinitionMap | undefined
	// Limit the fields to just the same namespace as the collection for now.
	// In theory, you could have fields from a different namespace attached to
	// this collection.
	const collectionKey = wireDef?.collection as string | undefined
	const [namespace] = parseKey(collectionKey || "")
	const fields = uesio.builder.useMetadataList(
		context,
		"FIELD",
		namespace,
		collectionKey
	)
	const viewDef = uesio.builder.useDefinition(
		makeFullPath("viewdef", context.getViewDefId() || "", "")
	) as any

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
					<FieldDelete
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
									selected={selected}
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
