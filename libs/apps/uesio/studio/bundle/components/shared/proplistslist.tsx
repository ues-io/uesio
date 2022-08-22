import React, { FC } from "react"
import PropNodeTag from "./buildpropitem/propnodetag"
import { builder, context, hooks, component } from "@uesio/ui"
import PropList from "./buildproparea/proplist"
const ScrollPanel = component.getUtility("uesio/io.scrollpanel")
const IconButton = component.getUtility("uesio/io.iconbutton")
const TitleBar = component.getUtility("uesio/io.titlebar")
type T = {
	items: unknown[]
	context: context.Context
	path: string
	propsDef: builder.BuildPropertiesDefinition
	properties: builder.PropDescriptor[]
	valueAPI: builder.ValueAPI
	expandType?: "popper"
}

const PropListsList: FC<T> = (props) => {
	const { items, context, expandType, path, properties, valueAPI, propsDef } =
		props
	const uesio = hooks.useUesio(props)

	const [metadataType, metadataItem, selectedPath] =
		uesio.builder.useSelectedNode()

	return (
		<>
			{items.map((item, i) => (
				<div
					key={i}
					style={{
						display: "flex",
						alignItems: "center",
					}}
					onClick={(e: React.MouseEvent<HTMLElement>) => {
						console.log("stopping here")
						e.stopPropagation()
					}}
				>
					<div
						style={{
							padding: "0 3px 0 6px",
							opacity: 0.6,
							fontSize: "0.6em",
						}}
					>
						<span>{i + 1}</span>
					</div>
					<div style={{ flex: 1 }}>
						<PropNodeTag
							key={i}
							context={context}
							onClick={(e: MouseEvent) => {
								e.stopPropagation()
								console.log("click!")
								uesio.builder.setSelectedNode(
									metadataType,
									metadataItem,
									path + `[${i}]`
								)
							}}
							selected={selectedPath === path + `["${i}"]`}
							popperChildren={
								expandType === "popper" && (
									<ScrollPanel
										header={
											<TitleBar
												title={"label"}
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
										context={context}
									>
										<div
											onClick={(e) => e.stopPropagation()}
											style={{
												maxHeight: "400px",
												overflow: "scroll",
											}}
										>
											<PropList
												path={path + `[${i}]`}
												propsDef={propsDef}
												properties={properties}
												context={context}
												valueAPI={valueAPI}
											/>
										</div>
									</ScrollPanel>
								)
							}
						>
							{expandType !== "popper" ? (
								<PropList
									path={path + `[${i}]`}
									propsDef={propsDef}
									properties={properties}
									context={context}
									valueAPI={valueAPI}
								/>
							) : (
								<span>
									{valueAPI.get(
										path +
											`[${i}]` +
											`["${properties[0].name}"]`
									)}
								</span>
							)}
						</PropNodeTag>
					</div>
				</div>
			))}
		</>
	)
}

export default PropListsList
