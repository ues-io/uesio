import { FC, DragEvent, useState, useEffect } from "react"
import FieldPicker from "./fieldpicker"
import { SectionRendererProps } from "./sectionrendererdefinition"

import { hooks, component, wire } from "@uesio/ui"

const FieldPropTag = component.getUtility("uesio/builder.fieldproptag")

const TitleBar = component.getUtility("uesio/io.titlebar")
const ScrollPanel = component.getUtility("uesio/io.scrollpanel")
const IconButton = component.getUtility("uesio/io.iconbutton")
const Popper = component.getUtility("uesio/io.popper")
const Button = component.getUtility("uesio/io.button")
const Icon = component.getUtility("uesio/io.icon")

const FieldsSection: FC<SectionRendererProps> = (props) => {
	const { path, context, valueAPI } = props
	const uesio = hooks.useUesio(props)
	const [anchorEl, setAnchorEl] = useState<HTMLDivElement | null>(null)
	const [showPopper, setShowPopper] = useState(false)

	const wireDef = valueAPI.get(path) as wire.RegularWireDefinition | undefined

	if (!wireDef) return null

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

	useEffect(() => {
		anchorEl?.querySelector(".selected")?.scrollIntoView({
			block: "end",
			behavior: "smooth",
		})
	}, [wireDef.fields])

	return (
		<>
			{showPopper && anchorEl && (
				<Popper
					referenceEl={anchorEl}
					context={context}
					placement="right-start"
					useFirstRelativeParent
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
										onClick={() => {
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
			<div
				onDragStart={onDragStart}
				onDragEnd={onDragEnd}
				ref={setAnchorEl}
			>
				{Object.keys(wireDef.fields || {}).map((fieldId) => (
					<FieldPropTag
						collectionKey={wireDef.collection}
						fieldId={fieldId}
						path={`${path}["fields"]["${fieldId}"]`}
						key={fieldId}
						fieldDef={wireDef.fields[fieldId]}
						context={context}
						valueAPI={valueAPI}
					/>
				))}
			</div>
		</>
	)
}

export default FieldsSection
