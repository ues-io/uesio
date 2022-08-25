import React, { FC, DragEvent, useState, ChangeEvent } from "react"
import FieldPicker from "./fieldpicker"
import { SectionRendererProps } from "./sectionrendererdefinition"
import { hooks, component, context, wire } from "@uesio/ui"
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

const prepareFieldForDisplay = (
	[key, value]: [string, wire.WireFieldDefinition],
	path: string,
	collectionKey: string
): FieldProp => ({
	collectionKey, // We need to make this dynamic to support ref field selection
	fieldId: key,
	fieldPath: `${path}["fields"]["${key}"]`,
	fields:
		value && value.fields
			? Object.entries(value.fields).map((el) =>
					prepareFieldForDisplay(
						el,
						`${path}["fields"]["${key}"]`,
						collectionKey // This should be the referenced collection
					)
			  )
			: [],
})

const useFields = (
	uesio: hooks.Uesio,
	wireDef: wire.RegularWireDefinition | undefined,
	path: string | undefined,
	context: context.Context,
	collectionKey?: string
): [
	FieldProp[],
	string[],
	string,
	React.Dispatch<React.SetStateAction<string>>
] => {
	const { fields: fieldsDef, collection: wireCollection } = wireDef || {}

	// We want to allow calling the hook with another collection as defined in the wire def.
	const [collection, setCollection] = useState(
		collectionKey || wireCollection || ""
	)

	const collectionFields = uesio.builder.useMetadataList(
		context,
		"FIELD",
		"",
		collection
	)

	// All the fields keys available in a collection
	const collectionFieldKeys = Object.keys(collectionFields || {})

	const selectedFields = Object.entries(fieldsDef || {}).map((el) =>
		prepareFieldForDisplay(el, path || "", collection)
	)
	return [selectedFields, collectionFieldKeys, collection, setCollection]
}

const FieldsSection: FC<SectionRendererProps> = (props) => {
	const { path, context, valueAPI } = props
	const uesio = hooks.useUesio(props)
	const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)
	const [searchTerm, setSearchTerm] = useState("")
	const [showPopper, setShowPopper] = useState(false)
	const [scrollBoxRef, scrolledStyles] = useShadowOnScroll([showPopper])
	const wireDef = valueAPI.get(path) as wire.RegularWireDefinition | undefined
	const [selectedFields, fieldKeys, collectionKey, setCollection] = useFields(
		uesio,
		wireDef,
		path,
		context,
		wireDef?.collection || ""
	)

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

	const onSearch = (e: ChangeEvent<HTMLInputElement>) => {
		setSearchTerm(e.target.value)
	}

	const results = !searchTerm
		? fieldKeys
		: fieldKeys &&
		  fieldKeys.filter((field) =>
				field.toLowerCase().includes(searchTerm.toLocaleLowerCase())
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
						<FieldPicker
							fieldsDef={wireDef?.fields}
							scrollBoxRef={scrollBoxRef}
							collectionKey={collectionKey}
							context={context}
							path={path || ""}
							valueAPI={valueAPI}
							results={results}
							setCollection={setCollection}
						/>
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
				{selectedFields.map((el, i) => (
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
