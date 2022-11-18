import { builder, component, hooks } from "@uesio/ui"

import PropListsList from "../../shared/proplistslist"
import BuildActionsArea from "../../shared/buildproparea/buildactionsarea"
import toPath from "lodash/toPath"

const PropNodeTag = component.getUtility("uesio/builder.propnodetag")
const ScrollPanel = component.getUtility("uesio/io.scrollpanel")
const IconButton = component.getUtility("uesio/io.iconbutton")
const TitleBar = component.getUtility("uesio/io.titlebar")

const ProplistsProp: builder.PropComponent<builder.PropListProp> = (props) => {
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
				uesio.builder.setSelectedNode(
					metadataType,
					metadataItem,
					selected ? component.path.getParentPath(path) : path
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
										variant="uesio/builder.buildtitle"
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
									type: "CUSTOM",
									label: "Add item",
									handler: (e) => {
										e.stopPropagation()
										valueAPI.add(path, {}, -1)
									},
									icon: "add",
								},
							]}
							propsDef={{ ...propsDef, type: "" }}
						/>
					}
					context={context}
				>
					<div
						onClick={(e) => e.stopPropagation()}
						style={{ maxHeight: "400px", overflow: "scroll" }}
					>
						<PropListsList
							items={items}
							context={context}
							path={path}
							propsDef={propsDef}
							valueAPI={valueAPI}
							descriptor={descriptor}
						/>
					</div>
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
