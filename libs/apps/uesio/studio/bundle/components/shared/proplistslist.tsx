import React, { FC } from "react"
import PropNodeTag from "./buildpropitem/propnodetag"
import { builder, context, hooks, component, styles } from "@uesio/ui"
import PropList from "./buildproparea/proplist"
import { CSSTransition, TransitionGroup } from "react-transition-group"
import useListScroll from "../shared/hooks/uselistscroll"
const ScrollPanel = component.getUtility("uesio/io.scrollpanel")
const IconButton = component.getUtility("uesio/io.iconbutton")
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
	console.log({ res })
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

	const classes = styles.useStyles(
		{
			item: {
				"&-enter": {
					opacity: "0.01",
					transform: "translate(0. -5px)",
				},

				"&-enter-active": {
					opacity: 1,
					transform: "translate(0, 0)",
					transition: "all 300ms ease-in",
				},

				"&-exit": {
					opacity: 1,
					transform: "translate(0, 0)",
				},

				"&-exit-active": {
					opacity: "0.01",
					transform: "translate(0, 5px)",
					transition: "all 300ms ease-in",
				},
			},
		},
		props
	)

	const [metadataType, metadataItem, selectedPath] =
		uesio.builder.useSelectedNode()
	const itemsRef = useListScroll(items.length)
	return (
		<TransitionGroup className="items-section__list">
			{items.map((item, i) => (
				<CSSTransition key={i} timeout={500} classNames={classes.item}>
					<div
						key={i}
						ref={(el) => (itemsRef.current[i] = el)}
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
																context={
																	context
																}
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
												onClick={(e) =>
													e.stopPropagation()
												}
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
										{mergeTemplate(
											nameTemplate || "",
											path + `[${i}]`,
											valueAPI
										) || nameFallback}
									</span>
								)}
							</PropNodeTag>
						</div>
					</div>
				</CSSTransition>
			))}
		</TransitionGroup>
	)
}

export default PropListsList
