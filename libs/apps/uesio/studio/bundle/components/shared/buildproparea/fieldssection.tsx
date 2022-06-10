import { hooks, component, definition, styles } from "@uesio/ui"
import { SectionRendererProps } from "./sectionrendererdefinition"
import ExpandPanel from "../expandpanel"
import FieldRemove from "./fieldRemove"
import {
	FunctionComponent,
	DragEvent,
	useState,
	SyntheticEvent,
	ChangeEvent,
} from "react"

import PropNodeTag from "../buildpropitem/propnodetag"

const TitleBar = component.getUtility("uesio/io.titlebar")

const FieldsSection: FunctionComponent<SectionRendererProps> = (props) => {
	const { section, path, context, valueAPI } = props
	const uesio = hooks.useUesio(props)

	// Field removal
	const [anchorEl, setAnchorEl] = useState<HTMLDivElement | null>(null)
	const [fieldToRemove, setFieldToRemove] = useState<string | null>(null)

	const wireDef = valueAPI.get(path) as definition.DefinitionMap | undefined

	const collectionKey = wireDef?.collection as string | undefined
	// Limit the fields to just the same namespace as the collection for now.
	// In theory, you could have fields from a different namespace attached to
	// this collection.
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

	// {fieldToRemove && (
	//
	// )}
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
			<FieldRemove
				valueAPI={valueAPI}
				anchorEl={anchorEl}
				fieldId={fieldToRemove || ""}
				path={path}
				context={context}
			/>
			<div onDragStart={onDragStart} onDragEnd={onDragEnd}>
				{collectionKey &&
					results &&
					results.map((fieldId, index) => {
						const selected = fieldsDef?.[fieldId] !== undefined
						return (
							<PropNodeTag
								draggable={`${collectionKey}:${fieldId}`}
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
								onClick={() => (fieldId: string) =>
									selected
										? setFieldToRemove(fieldId)
										: valueAPI.set(
												`${path}["fields"][${fieldId}]`,
												null
										  )}
								context={context}
							/>
						)
					})}
			</div>
		</>
	)
}

export default FieldsSection
