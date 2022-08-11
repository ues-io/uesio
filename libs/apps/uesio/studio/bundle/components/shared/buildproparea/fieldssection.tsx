import { FC, DragEvent, useState, useRef, ChangeEvent, useEffect } from "react"
import { SectionRendererProps } from "./sectionrendererdefinition"
import { hooks, component, definition } from "@uesio/ui"
import PropNodeTag from "../buildpropitem/propnodetagnew"

const TitleBar = component.getUtility("uesio/io.titlebar")
const ScrollPanel = component.getUtility("uesio/io.scrollpanel")
const IconButton = component.getUtility("uesio/io.iconbutton")

type FieldProp = { fieldId: string; fields: FieldProp[] }
type FieldDef = null | { fields: FieldDef }
const Popper = component.getUtility("uesio/io.popper")
const Button = component.getUtility("uesio/io.button")
const Icon = component.getUtility("uesio/io.icon")
const FieldsSection: FC<SectionRendererProps> = (props) => {
	const { path, context, valueAPI } = props
	const uesio = hooks.useUesio(props)
	const [anchorEl, setAnchorEl] = useState<HTMLDivElement | null>(null)

	const wireDef = valueAPI.get(path) as definition.DefinitionMap | undefined
	const collectionKey = wireDef?.collection as string | undefined

	if (!collectionKey) {
		return null
	}

	const fields = uesio.builder.useMetadataList(
		context,
		"FIELD",
		"",
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
			<span>{fieldId}</span>
			{fields?.map((el) => (
				<FieldRenderer
					key={fieldId}
					fieldId={el.fieldId}
					fields={el.fields}
				/>
			))}
		</PropNodeTag>
	)
	const [showPopper, setShowPopper] = useState(false)

	// Scroll logic for shaow on the search bar
	const scrollBoxRef = useRef<HTMLDivElement | null>(null)
	const [hasScroll, setHasScroll] = useState(false)
	useEffect(() => {
		if (showPopper) setHasScroll(false)
	}, [showPopper])
	useEffect(() => {
		if (!scrollBoxRef || !scrollBoxRef.current) return

		const onScroll = () => {
			if (!scrollBoxRef.current) return
			setHasScroll(scrollBoxRef.current.scrollTop > 0)
		}

		scrollBoxRef.current.removeEventListener("scroll", onScroll)
		scrollBoxRef.current.addEventListener("scroll", onScroll)
		return () => {
			if (!scrollBoxRef || !scrollBoxRef.current) return

			scrollBoxRef.current.removeEventListener("scroll", onScroll)
		}
	}, [scrollBoxRef, scrollBoxRef.current, showPopper])

	return (
		<>
			{showPopper && anchorEl && (
				<Popper
					referenceEl={anchorEl}
					context={context}
					placement="right"
				>
					<ScrollPanel
						header={
							<TitleBar
								title="Field Selector"
								variant="uesio/io.primary"
								context={context}
								actions={
									<IconButton
										context={context}
										variant="uesio/studio.buildtitle"
										icon="close"
										onClick={(): void => {
											setShowPopper(!showPopper)
										}}
									/>
								}
							/>
						}
						context={context}
					>
						<div
							style={{
								padding: "8px",
								position: "relative",
								zIndex: 1,
								transition: "all 0.3s ease",
								boxShadow: hasScroll
									? "rgb(0 0 0 / 40%) 0px 0px 20px -6px"
									: "none",
							}}
						>
							<input
								value={searchTerm}
								style={{
									outline: "none",
									padding: "8px",
									fontSize: "9pt",
									border: "none",
									background: "#eee",
									borderRadius: "4px",
									width: "100%",
								}}
								onChange={(
									event: ChangeEvent<HTMLInputElement>
								) => {
									handleChange(event.target.value)
								}}
								type="search"
								placeholder="Search..."
							/>
						</div>
						<div
							ref={scrollBoxRef}
							style={{ maxHeight: "400px", overflow: "scroll" }}
						>
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
											<span>{fieldId}</span>
										</PropNodeTag>
									)
								})}
						</div>
					</ScrollPanel>
				</Popper>
			)}
			<TitleBar
				variant="uesio/studio.propsubsection"
				title={""}
				context={context}
				actions={
					<>
						<div ref={setAnchorEl}>
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
								onClick={(): void => {
									setShowPopper(!showPopper)
								}}
							/>
						</div>
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
							fields={fields}
						/>
					))}
			</div>
		</>
	)
}

export default FieldsSection
