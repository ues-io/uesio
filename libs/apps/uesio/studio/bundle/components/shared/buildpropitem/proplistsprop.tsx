import { FC } from "react"
import { builder, component, hooks } from "@uesio/ui"
import PropList from "../buildproparea/proplist"
import PropNodeTag from "../buildpropitem/propnodetag"
import BuildActionsArea from "../buildproparea/buildactionsarea"
import toPath from "lodash/toPath"
const ScrollPanel = component.getUtility("uesio/io.scrollpanel")
const IconButton = component.getUtility("uesio/io.iconbutton")
const TitleBar = component.getUtility("uesio/io.titlebar")

const ProplistsProp: FC<builder.PropRendererProps> = (props) => {
	const { valueAPI, path = "", propsDef, context } = props
	const descriptor = props.descriptor as builder.PropListProp

	const items = (valueAPI.get(path) as unknown[]) || []
	const uesio = hooks.useUesio(props)
	const [metadataType, metadataItem, selectedPath] =
		uesio.builder.useSelectedNode()
	const selected = selectedPath.startsWith(path)
	const selectedItem = !isNaN(parseFloat(toPath(selectedPath).pop() || ""))
		? selectedPath
		: null

	return (
		<PropNodeTag
			context={context}
			onClick={() =>
				selected
					? uesio.builder.unSelectNode()
					: uesio.builder.setSelectedNode(
							metadataType,
							metadataItem,
							path
					  )
			}
			selected={selected}
			popperChildren={
				<ScrollPanel
					header={
						<TitleBar
							title={descriptor.label}
							variant="uesio/io.primary"
							actions={
								props.path && (
									<IconButton
										variant="uesio/studio.buildtitle"
										context={context}
										icon="close"
										onClick={() =>
											uesio.builder.unSelectNode()
										}
									/>
								)
							}
							context={context}
						/>
					}
					footer={
						<BuildActionsArea
							path={selectedItem || ""}
							context={context}
							valueAPI={valueAPI}
							actions={[
								{
									type: "MOVE",
								},
								{
									type: "CUSTOM",
									label: "Add item",
									handler: () => valueAPI.add(path, {}),
									icon: "add",
								},
								...(selectedItem
									? [
											{
												type: "CUSTOM",
												label: "Remove",
												disabled:
													!selected || !selectedItem,
												handler: () =>
													valueAPI.remove(
														selectedPath
													),
												icon: "delete",
											} as builder.ActionDescriptor,
									  ]
									: []),
							]}
							propsDef={{ ...propsDef, type: "" }}
						/>
					}
					// footer={
					// 	<>
					// 		<button onClick={() => valueAPI.add(path, {})}>
					// 			add
					// 		</button>
					// 		<button
					// 			onClick={() => {
					// 				valueAPI.remove(selectedPath)
					// 			}}
					// 		>
					// 			Remove
					// 		</button>
					// 	</>
					// }
					context={context}
				>
					{items.map((item, i) => (
						<PropNodeTag
							key={i}
							context={context}
							onClick={() =>
								uesio.builder.setSelectedNode(
									metadataType,
									metadataItem,
									path + `[${i}]`
								)
							}
							selected={selectedPath === path + `["${i}"]`}
						>
							<PropList
								key={i}
								path={path + `[${i}]`}
								propsDef={propsDef}
								properties={descriptor.properties}
								context={context}
								valueAPI={valueAPI}
							/>
						</PropNodeTag>
					))}
				</ScrollPanel>
			}
		>
			<div
				style={{
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
				}}
			>
				<span>{descriptor.label}</span>
				<div style={{ display: "flex" }}>
					<span>
						{items.length} item{items.length !== 1 && "s"}
					</span>
					<div
						style={{
							display: "inline-block",

							transform: selected
								? "rotate(90deg)"
								: "rotate(270deg)",

							transition: "all 0.3s ease-in-out",

							overflow: "hidden",
						}}
					>
						<IconButton
							context={context}
							icon="expand_more"
							onClick={() => uesio.builder.unSelectNode()}
						/>
					</div>
				</div>
			</div>
		</PropNodeTag>
	)
}

export default ProplistsProp
