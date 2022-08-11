import React, {
	FC,
	DragEvent,
	useState,
	useRef,
	ChangeEvent,
	useEffect,
	useCallback,
} from "react"
import throttle from "lodash/throttle"

import { SectionRendererProps } from "./sectionrendererdefinition"
import { hooks, component, definition } from "@uesio/ui"
import PropNodeTag from "../buildpropitem/propnodetag"

const TitleBar = component.getUtility("uesio/io.titlebar")
const ScrollPanel = component.getUtility("uesio/io.scrollpanel")
const IconButton = component.getUtility("uesio/io.iconbutton")

const useScroll = (
	// refEl: React.MutableRefObject<HTMLDivElement | null>,
	dependencies?: unknown[]
) => {
	// Scroll logic for shaow on the search bar
	const [hasScroll, setHasScroll] = useState(false)
	const refEl = useRef<HTMLDivElement | null>(null)

	useEffect(() => {
		console.log("effect")
		const element = refEl.current
		if (!element) return

		const onScroll = () => {
			console.log("scrolling")
			setHasScroll(element.scrollTop > 0)
		}
		const db = throttle(onScroll, 200)

		element.removeEventListener("scroll", db)
		element.addEventListener("scroll", db)
		return () => {
			element.removeEventListener("scroll", db)
		}
	}, [refEl, refEl.current, ...(dependencies || [])])

	return [
		refEl,
		{
			transition: "all 0.3s ease",
			boxShadow: hasScroll
				? "rgb(0 0 0 / 40%) 0px 0px 20px -6px"
				: "none",
		},
	]
}

type FieldProp = { fieldId: string; fields: FieldProp[] }
type FieldDef = null | { fields: FieldDef }
const Popper = component.getUtility("uesio/io.popper")
const Button = component.getUtility("uesio/io.button")
const Icon = component.getUtility("uesio/io.icon")
const FieldsSection: FC<SectionRendererProps> = (props) => {
	const { path, context, valueAPI } = props
	const uesio = hooks.useUesio(props)
	const [anchorEl, setAnchorEl] = useState<HTMLDivElement | null>(null)
	const [searchTerm, setSearchTerm] = useState("")
	const [showPopper, setShowPopper] = useState(false)

	const [scrollBoxRef, scrolledStyles] = useScroll([showPopper])
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

	console.log({ fields })

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
			<div style={{ display: "flex" }}>
				<span>{fieldId}</span>
				<IconButton
					context={context}
					variant="uesio/studio.buildtitle"
					icon="delete"
					onClick={(): void => {
						setShowPopper(!showPopper)
					}}
				/>
			</div>
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
