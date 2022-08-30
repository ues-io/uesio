import React, { FC, DragEvent, useState } from "react"
import FieldPicker from "./fieldpicker"
import { SectionRendererProps } from "./sectionrendererdefinition"

import { hooks, component, wire } from "@uesio/ui"
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

const FieldsSection: FC<SectionRendererProps> = (props) => {
	const { path, context, valueAPI } = props
	const uesio = hooks.useUesio(props)
	const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)
	const [showPopper, setShowPopper] = useState(false)

	const wireDef = valueAPI.get(path) as wire.RegularWireDefinition | undefined

	const selectedFields = Object.entries(wireDef?.fields || {}).map((el) =>
		prepareFieldForDisplay(el, path || "", "collection")
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
						<FieldPicker
							wireDef={wireDef}
							context={context}
							path={path || ""}
							valueAPI={valueAPI}
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
							valueAPI={valueAPI}
							togglePopper={() => setShowPopper(!showPopper)}
						/>
					</div>
				))}
			</div>
		</>
	)
}

export default FieldsSection
