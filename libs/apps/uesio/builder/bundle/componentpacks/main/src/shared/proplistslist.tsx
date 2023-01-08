import React, { FC } from "react"
import { builder, context, hooks, component, styles } from "@uesio/ui"
import { CSSTransition, TransitionGroup } from "react-transition-group"
import useListScroll from "./hooks/uselistscroll"
const PropList = component.getUtility("uesio/builder.proplist")
const ScrollPanel = component.getUtility("uesio/io.scrollpanel")
const IconButton = component.getUtility("uesio/io.iconbutton")
const IOExpandPanel = component.getUtility("uesio/io.expandpanel")
const PropNodeTag = component.getUtility("uesio/builder.propnodetag")
import BuildActionsArea from "../helpers/buildactionsarea"

const TitleBar = component.getUtility("uesio/io.titlebar")
type T = {
	items: unknown[]
	context: context.Context
	path: string
	propsDef: builder.BuildPropertiesDefinition
	valueAPI: builder.ValueAPI
	expandType?: "popper"
	descriptor: {
		properties: builder.PropDescriptor[]
		nameTemplate?: string
		nameFallback?: string
	}
}

// TODO: Write test
export const mergeTemplate = (
	template: string,
	basePath: string,
	valueAPI: builder.ValueAPI
) => {
	const res = template.replace(
		/\${(\w*)}/g,
		(expression, key: string) =>
			valueAPI.get(basePath + `[${key}]`) as string
	)

	return res === "undefined" || res === "null" ? null : res
}

const PropListsList: FC<T> = (props) => {
	const {
		items,
		context,
		expandType,
		path = "",
		descriptor: { properties, nameTemplate, nameFallback },
		valueAPI,
		propsDef,
	} = props
	const uesio = hooks.useUesio(props)

	const transition = "opacity 150ms ease-in, transform 300ms ease-in-out"
	const transformStart = "translate(-5px, 0)"
	const transformEnd = "translate(0, 0)"
	const classes = styles.useStyles(
		{
			item: {
				"&-enter": {
					opacity: "0.01",
					transform: transformStart,
				},

				"&-enter-active": {
					opacity: 1,
					transform: transformEnd,
					transition,
				},

				"&-exit": {
					opacity: 1,
					transform: transformEnd,
				},

				"&-exit-active": {
					opacity: "0.01",
					transform: transformStart,
					transition,
				},
			},
		},
		props
	)

	const [metadataType, metadataItem, selectedPath] =
		uesio.builder.useSelectedNode()
	const itemsRef = useListScroll(items.length)
	return (
		<div>
			<TransitionGroup className="items-section__list">
				{items.map((item, i) => {
					const selected = selectedPath === path + `["${i}"]`
					return (
						<CSSTransition
							key={path + i}
							timeout={300}
							classNames={classes.item}
						>
							<div
								key={i}
								ref={(el) => (itemsRef.current[i] = el)}
								style={{
									display: "flex",
									alignItems: "center",
								}}
								onClick={(e: React.MouseEvent<HTMLElement>) =>
									e.stopPropagation()
								}
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
										onClick={() =>
											uesio.builder.setSelectedNode(
												metadataType,
												metadataItem,
												path + `[${i}]`
											)
										}
										selected={selected}
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
																		variant="uesio/builder.buildtitle"
																		context={
																			context
																		}
																		icon="close"
																		onClick={(
																			e: MouseEvent
																		) => {
																			e.stopPropagation()
																			uesio.builder.unSelectNode()
																		}}
																	/>
																)
															}
															context={context}
														/>
													}
													context={context}
												>
													<div
														onClick={(e) =>
															e.stopPropagation()
														}
														style={{
															maxHeight: "400px",
															overflow: "scroll",
														}}
													>
														<PropList
															path={
																path + `[${i}]`
															}
															propsDef={propsDef}
															properties={
																properties
															}
															context={context}
															valueAPI={valueAPI}
														/>
													</div>
												</ScrollPanel>
											)
										}
									>
										<div>
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
													{mergeTemplate(
														nameTemplate || "",
														path + `[${i}]`,
														valueAPI
													) || nameFallback}
												</span>
											)}
										</div>

										<IOExpandPanel
											context={context}
											expanded={selected}
										>
											<BuildActionsArea
												context={context}
												// path={path + `[${i}]`}
												// valueAPI={valueAPI}
												// actions={[
												// 	{
												// 		type: "MOVE",
												// 	},
												// 	{
												// 		type: "DELETE",
												// 	},
												// ]}
											/>
										</IOExpandPanel>
									</PropNodeTag>
								</div>
							</div>
						</CSSTransition>
					)
				})}
			</TransitionGroup>
		</div>
	)
}

export default PropListsList
