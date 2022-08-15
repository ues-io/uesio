import React, { FC, DragEvent, useState, ChangeEvent } from "react"

import { SectionRendererProps } from "./sectionrendererdefinition"
import { hooks, component, definition } from "@uesio/ui"
import PropNodeTag from "../buildpropitem/propnodetag"
import useShadowOnScroll from "../hooks/useshadowonscroll"
import FieldPropTag, {
	FieldProp,
} from "../../utility/fieldproptag/fieldproptag"

const TitleBar = component.getUtility("uesio/io.titlebar")
const ScrollPanel = component.getUtility("uesio/io.scrollpanel")
const IconButton = component.getUtility("uesio/io.iconbutton")
const Popper = component.getUtility("uesio/io.popper")
const Button = component.getUtility("uesio/io.button")
const Icon = component.getUtility("uesio/io.icon")

type FieldDef = null | { fields: FieldDef }
const FieldsSection: FC<SectionRendererProps> = (props) => {
	const { path, context, valueAPI } = props
	const uesio = hooks.useUesio(props)
	const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)
	const [searchTerm, setSearchTerm] = useState("")
	const [showPopper, setShowPopper] = useState(false)
	const [scrollBoxRef, scrolledStyles] = useShadowOnScroll([showPopper])

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

	const onSearch = (e: ChangeEvent<HTMLInputElement>) => {
		setSearchTerm(e.target.value)
	}

	const results = !searchTerm
		? fieldKeys
		: fieldKeys &&
		  fieldKeys.filter((field) =>
				field.toLowerCase().includes(searchTerm.toLocaleLowerCase())
		  )

	// Create field objects for the render function to loop over
	const prepareFieldForDisplay = (
		[key, value]: [string, FieldDef],
		path: string
	): FieldProp => ({
		collectionKey, // We need to make this dynamic to support ref field selection
		fieldId: key,
		fieldPath: `${path}["fields"]["${key}"]`,
		fields:
			value && value.fields
				? Object.entries(value.fields).map((el) =>
						prepareFieldForDisplay(
							el,
							`${path}["fields"]["${key}"]`
						)
				  )
				: [],
	})

	const selectedFields = Object.entries(wireDef?.fields || {}).map((el) =>
		prepareFieldForDisplay(el, path || "")
	)

	// Scroll to the bottom of the list when adding new fields
	const itemsRef = React.useRef<(HTMLDivElement | null)[]>([])
	const prevLength = itemsRef.current.length
	React.useEffect(() => {
		itemsRef.current = itemsRef.current.slice(0, selectedFields.length)
		if (prevLength !== 0 && prevLength < itemsRef.current.length)
			itemsRef.current[itemsRef.current.length - 1]?.scrollIntoView({
				block: "end",
				behavior: "smooth",
			})
	}, [selectedFields])

	// const items = React.useState()

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
								...scrolledStyles,
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
								onChange={onSearch}
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
									const onClick = () => {
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
			{/* Just an element for popper to anchor on */}
			<div
				style={{
					pointerEvents: "none",
					position: "absolute",
					inset: 0,
				}}
				ref={setAnchorEl}
			/>
			<TitleBar
				variant="uesio/studio.propsubsection"
				title={""}
				context={context}
				actions={
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
						label="Set fields"
						onClick={() => setShowPopper(!showPopper)}
					/>
				}
			/>

			{/* List of selected fields, from here we can only delete */}
			<div onDragStart={onDragStart} onDragEnd={onDragEnd}>
				{collectionKey &&
					selectedFields.map((el, i) => (
						<div
							key={el.fieldId}
							ref={(el) => (itemsRef.current[i] = el)}
						>
							<FieldPropTag
								{...el}
								context={context}
								togglePopper={() => setShowPopper(!showPopper)}
								removeField={() =>
									valueAPI.remove(
										`${path}["fields"]["${el.fieldId}"]`
									)
								}
							/>
						</div>
					))}
			</div>
		</>
	)
}

export default FieldsSection
