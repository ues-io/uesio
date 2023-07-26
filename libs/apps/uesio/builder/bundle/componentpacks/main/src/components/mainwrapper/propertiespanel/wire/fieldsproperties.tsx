import { definition, component, context, wire } from "@uesio/ui"
import { useState, useRef } from "react"
import { get, remove, set } from "../../../../api/defapi"
import { useSelectedPath } from "../../../../api/stateapi"
import BuildActionsArea from "../../../../helpers/buildactionsarea"
import FieldPropTag from "./fieldproptag"
import FieldPicker from "./fieldpicker"
import { FullPath } from "../../../../api/path"

const FieldsProperties: definition.UC = (props) => {
	const ScrollPanel = component.getUtility("uesio/io.scrollpanel")
	const Icon = component.getUtility("uesio/io.icon")
	const Button = component.getUtility("uesio/io.button")
	const Popper = component.getUtility("uesio/io.popper")
	const { context } = props
	const anchorEl = useRef<HTMLDivElement>(null)
	const [showPopper, setShowPopper] = useState(false)

	const selectedPath = useSelectedPath(context)
	const wirePath = selectedPath.trimToSize(2)
	const fieldsPath = wirePath.addLocal("fields")
	const onSelect = (ctx: context.Context, path: FullPath) =>
		set(ctx, path, {})
	const onUnselect = (ctx: context.Context, path: FullPath) =>
		remove(ctx, path)

	// TODO: Handle view only wires here too.
	const wireDef = get(context, wirePath) as wire.RegularWireDefinition

	return (
		<>
			{showPopper && anchorEl && (
				<Popper
					referenceEl={anchorEl.current}
					context={context}
					placement="right-start"
					autoPlacement={["right-start"]}
					offset={6}
					useFirstRelativeParent
					matchHeight
				>
					<FieldPicker
						context={context}
						baseCollectionKey={wireDef.collection}
						path={fieldsPath}
						onClose={() => setShowPopper(false)}
						onSelect={onSelect}
						onUnselect={onUnselect}
					/>
				</Popper>
			)}
			<ScrollPanel
				ref={anchorEl}
				variant="uesio/builder.mainsection"
				context={context}
				footer={
					<BuildActionsArea justify="space-around" context={context}>
						<Button
							context={context}
							variant="uesio/builder.panelactionbutton"
							icon={
								<Icon
									context={context}
									icon="add"
									variant="uesio/builder.actionicon"
								/>
							}
							label="Select Fields"
							onClick={() => {
								setShowPopper(true)
							}}
						/>
					</BuildActionsArea>
				}
			>
				{Object.keys(wireDef.fields || {}).map((fieldId) => (
					<FieldPropTag
						collectionKey={wireDef.collection}
						fieldId={fieldId}
						key={fieldId}
						path={fieldsPath.addLocal(fieldId)}
						selectedPath={selectedPath}
						fieldDef={wireDef.fields[fieldId]}
						context={context}
					/>
				))}
			</ScrollPanel>
		</>
	)
}

FieldsProperties.displayName = "FieldsProperties"

export default FieldsProperties
