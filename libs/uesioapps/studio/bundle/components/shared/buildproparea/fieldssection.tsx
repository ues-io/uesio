import { FunctionComponent, DragEvent, useState, useRef } from "react"
import { SectionRendererProps } from "./sectionrendererdefinition"
import ExpandPanel from "../expandpanel"
import { hooks, component, definition, styles } from "@uesio/ui"
import PropNodeTag from "../buildpropitem/propnodetag"
const Popper = component.registry.getUtility("io.popper")
const Button = component.registry.getUtility("io.button")

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

const FieldsSection: FunctionComponent<SectionRendererProps> = (props) => {
	const { section, path, context, valueAPI } = props
	const uesio = hooks.useUesio(props)

	// Field deletion \
	const [anchorEl, setAnchorEl] = useState<HTMLDivElement | null>(null)
	const [affectedPaths, setAffectedPaths] = useState<string[][]>([])
	const [showWarning, setShowWarning] = useState(false)
	// Field deletion /

	const wireDef = valueAPI.get(path) as definition.DefinitionMap | undefined
	const viewDef = uesio.builder.useDefinition(
		makeFullPath("viewdef", context.getViewDefId() || "", "")
	) as any
	const collectionKey = wireDef?.collection as string | undefined

	if (!collectionKey) {
		return null
	}

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

	// Limit the fields to just the same namespace as the collection for now.
	// In theory, you could have fields from a different namespace attached to
	// this collection.
	const [namespace] = parseKey(collectionKey)

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

	const fieldRemover = {
		getDeprecatedFields: (fieldId: string) => {
			const flatObject = flattenObj(viewDef.components, "components")
			return Object.entries(flatObject)
				.filter(([key, value]) => value === fieldId)
				.map(([key]) => key)
		},

		removePathsFromDef: (paths: string[][]) =>
			paths.forEach((pathArray) =>
				valueAPI.remove(component.path.fromPath(pathArray))
			),

		handleRemoveField: (fieldId: string) => {
			setAffectedPaths([])
			const brokenPaths = fieldRemover.getDeprecatedFields(fieldId)

			// Field is used in viewDef
			if (brokenPaths.length) {
				const affectedPaths = brokenPaths.map((p) =>
					p.split("_").slice(0, -2)
				)
				setAffectedPaths(affectedPaths)
				fieldRemover.highlightBrokenFields(fieldId)
				setShowWarning(true)
				return
			}

			valueAPI.remove(`${path}["fields"]["${fieldId}"]`)
		},

		handleFieldClick: (fieldId: string) => {
			const selected = fieldsDef?.[fieldId] !== undefined

			return selected
				? fieldRemover.handleRemoveField(fieldId)
				: valueAPI.addPair(`${path}["fields"]`, null, fieldId)
		},

		highlightBrokenFields: (fieldId: string) => {
			const fields = document.querySelectorAll<HTMLDivElement>(
				`[data-fieldid="${fieldId}"]`
			)
			fields.forEach((f) => (f.style.border = "1px solid red"))
		},
	}

	//

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
				{affectedPaths.length && showWarning && (
					<Popper
						referenceEl={anchorEl}
						context={context}
						placement="right"
					>
						<div style={{ padding: "8px", fontSize: "14px" }}>
							<p style={{ fontWeight: 700 }}>crm.name</p>
							<p>
								Do you want to delete the field and{" "}
								{affectedPaths.length > 1 ? "the" : ""}
								{affectedPaths.length} element
								{affectedPaths.length > 1 ? "s" : ""} using this
								field?
							</p>
							<div
								style={{
									display: "flex",
									justifyContent: "space-between",
								}}
							>
								<Button
									variant="io.primary"
									label="Cancel"
									context={context}
									icon="arrow_back"
									onClick={() => setShowWarning(false)}
								/>
								<Button
									variant="io.primary"
									label="Delete "
									context={context}
									icon="delete"
									onClick={() => {
										fieldRemover.removePathsFromDef(
											affectedPaths
										)
										setShowWarning(false)
									}}
								/>
							</div>
						</div>
					</Popper>
				)}
				{collectionKey &&
					results &&
					results.map((fieldId, index) => {
						const fieldDef = fieldsDef?.[fieldId]
						const selected = fieldDef !== undefined

						return (
							// <div ref={setAnchorEl}>
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
							// </div>
						)
					})}
			</div>
		</ExpandPanel>
	)
}

export default FieldsSection
