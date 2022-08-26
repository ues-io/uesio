import { builder, context, hooks, wire, component, styles } from "@uesio/ui"
import React, { FC } from "react"
import PropNodeTag from "../buildpropitem/propnodetag"
import has from "lodash/has"
import { CSSTransition, TransitionGroup } from "react-transition-group"

import toPath from "lodash/toPath"
import useShadowOnScroll from "../hooks/useshadowonscroll"

const Tooltip = component.getUtility("uesio/io.tooltip")
const IconButton = component.getUtility("uesio/io.iconbutton")

type T = {
	valueAPI: builder.ValueAPI
	path: string
	context: context.Context
	wireDef: wire.WireDefinition | undefined
}
type Frame = { fieldId?: string; collection: string; path: string }
const useFields = (
	uesio: hooks.Uesio,
	wireDef: wire.WireDefinition | undefined,
	context: context.Context
): [string[], string, React.Dispatch<React.SetStateAction<string>>] => {
	const wireCollection =
		wireDef && "collection" in wireDef ? wireDef?.collection : ""

	const [collection, setCollection] = React.useState(wireCollection)

	const collectionFields = uesio.builder.useMetadataList(
		context,
		"FIELD",
		"",
		collection
	)
	const collectionFieldKeys = Object.keys(collectionFields || {})

	return [collectionFieldKeys, collection, setCollection]
}

const useRefStack = (
	startingCollection: string,
	onStackChange: (arg: Frame) => unknown,
	path: string
) => {
	const [stack, setStack] = React.useState<Frame[]>([
		{ collection: startingCollection, path: `${path}["fields"]` },
	])
	const currentFrame = stack[stack.length - 1]
	const addFrame = (frame: { collection: string; fieldId: string }) =>
		setStack([
			...stack,
			{
				...frame,
				path: currentFrame.path + `["${frame.fieldId}"]["fields"]`,
			},
		])
	const removeFrame = () => setStack(stack.slice(0, -1))
	const goToFrame = (i: number) => setStack(stack.slice(0, i + 1))

	React.useEffect(() => {
		onStackChange(currentFrame)
	}, [stack])
	return { stack, currentFrame, addFrame, removeFrame, goToFrame }
}

const useSearch = (items: string[] = []) => {
	const [searchTerm, setSearchTerm] = React.useState("")
	const result = items.filter((item) =>
		item.toLowerCase().includes(searchTerm.toLocaleLowerCase())
	)
	return { searchTerm, setSearchTerm, result }
}

const FieldPicker: FC<T> = (props) => {
	const { valueAPI, path, context, wireDef } = props
	const [scrollBoxRef, scrolledStyles] = useShadowOnScroll([])
	const [frameHoverIndex, setFrameHoverIndex] = React.useState<number>(-1)
	const transition = "opacity 150ms ease-in, transform 300ms ease-in-out"
	const transformStart = "translate(-5px, 0)"
	const transformEnd = "translate(0, 0)"
	const classes = styles.useStyles(
		{
			breadcrumbs: {
				maxWidth: "100%",
				overflow: "scroll",
				"&::-webkit-scrollbar": {
					display: "none",
				},
				"&:hover": {
					".shorten": {
						maxWidth: "150px",

						".label": {
							opacity: "1",
						},
						".dots": {
							opacity: "0",
						},
					},
				},
			},
			crumb: {
				display: "inline-block",
				fontSize: "0.8em",
				position: "relative",
				padding: "4px 6px",
				border: `1px solid #ddd`,
				borderRadius: "4px",
				borderTopLeftRadius: "2px",
				borderBottomLeftRadius: "2px",
				cursor: "pointer",
				backgroundColor: "#fff",
				"&:hover": {
					borderColor: "#343434",
				},
			},
			crumbLabel: {
				texOverflow: "ellipsis",
				display: "inline-block",
				overflow: "hidden",
				verticalAlign: "bottom",
				transition: "all 0.3s ease",
				cursor: "pointer",
				"&.shorten": {
					maxWidth: "10px",
					".label": {
						opacity: "0",
					},
					".dots": {
						position: "absolute",
					},
					".label, .dots": {
						transition: "all 0.15s ease",
					},
				},
			},
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
	const uesio = hooks.useUesio(props)
	const [fieldKeys, collectionKey, setCollection] = useFields(
		uesio,
		wireDef,
		context
	)

	const { stack, currentFrame, addFrame, goToFrame } = useRefStack(
		collectionKey,
		({ collection }) => setCollection(collection),
		path
	)
	const isFieldSelected = (path: string) => {
		const pathArray = toPath(path).slice(3)
		return !!has(wireDef?.fields, pathArray)
	}
	const { searchTerm, setSearchTerm, result } = useSearch(fieldKeys)

	const collection = uesio.collection.useCollection(context, collectionKey)
	return (
		<div>
			<div
				style={{
					padding: "8px",
					position: "relative",
					zIndex: 1,
					...scrolledStyles,
				}}
			>
				{/* Breadcrumbs */}
				{stack.length > 1 && (
					<Tooltip
						text={`collection: ${stack[frameHoverIndex]?.collection}, field: ${stack[frameHoverIndex]?.fieldId}`}
						context={context}
						placement={"auto"}
					>
						<div
							style={{
								paddingBottom: "8px ",
								whiteSpace: "nowrap",
								overflow: "scroll",
							}}
						>
							<TransitionGroup className={classes.breadcrumbs}>
								{stack.map((frame, i) => {
									const isFirst = i === 0
									const isLast = stack.length === i + 1
									return (
										<CSSTransition
											key={frame.collection + i}
											timeout={300}
											classNames={classes.item}
										>
											<div
												role="button"
												onClick={() =>
													isLast ? null : goToFrame(i)
												}
												onMouseOver={() =>
													setFrameHoverIndex(i)
												}
												onMouseLeave={() =>
													setFrameHoverIndex(-1)
												}
												className={classes.crumb}
												style={{
													color: isLast
														? "#000"
														: "#888",
													zIndex: stack.length - i,
													marginLeft: !isFirst
														? "-6px"
														: "auto",
													paddingLeft: !isFirst
														? "10px"
														: "auto",
												}}
											>
												{isFirst || isLast ? (
													<span>
														{frame.collection}
													</span>
												) : (
													<span
														className={styles.cx(
															classes.crumbLabel,
															!isFirst &&
																!isLast &&
																"shorten"
														)}
													>
														<span className="dots">
															...
														</span>
														<span className="label">
															{frame.collection}
														</span>
													</span>
												)}
											</div>
										</CSSTransition>
									)
								})}
							</TransitionGroup>
						</div>
					</Tooltip>
				)}
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
					onChange={(e) => setSearchTerm(e.target.value)}
					type="search"
					placeholder="Search..."
				/>
			</div>

			<div
				ref={scrollBoxRef}
				style={{ maxHeight: "400px", overflow: "scroll" }}
			>
				<div key={collectionKey}>
					{!result.length && (
						<p
							style={{
								textAlign: "center",
								fontSize: "0.8em",
								color: "#888",
							}}
						>
							No fields found
						</p>
					)}
					{/* Field items */}
					{collectionKey &&
						result.map((fieldId, index) => {
							const referencedCollection = collection
								?.getField(fieldId)
								?.getReferenceMetadata()?.collection
							const setPath = currentFrame.path + `["${fieldId}"]`
							const selected = isFieldSelected(setPath)

							return (
								<PropNodeTag
									draggable={`${collectionKey}:${fieldId}`}
									key={index}
									onClick={() => {
										selected
											? valueAPI.remove(setPath)
											: valueAPI.set(setPath, null)
									}}
									selected={selected}
									context={context}
								>
									<div
										style={{
											display: "flex",
											justifyContent: "space-between",
										}}
									>
										<span>{fieldId}</span>
										{referencedCollection && (
											<span
												style={{
													transform: "rotate(-90deg)",
												}}
											>
												<IconButton
													context={context}
													icon="expand_more"
													onClick={() =>
														addFrame({
															fieldId,
															collection:
																referencedCollection,
														})
													}
												/>
											</span>
										)}
									</div>
								</PropNodeTag>
							)
						})}
				</div>
			</div>
		</div>
	)
}

export default FieldPicker
