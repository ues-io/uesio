import { builder, context, hooks, component, styles } from "@uesio/ui"
import React, { FC } from "react"
import PropNodeTag from "../buildpropitem/propnodetag"
import { CSSTransition } from "react-transition-group"

const IconButton = component.getUtility("uesio/io.iconbutton")
import has from "lodash/has"
import toPath from "lodash/toPath"
import useShadowOnScroll from "../hooks/useshadowonscroll"

type T = {
	fieldKeys: string[]
	collectionKey: string
	fieldsDef: any
	valueAPI: builder.ValueAPI
	path: string
	context: context.Context
	setCollection: React.Dispatch<React.SetStateAction<string>>
}

type Frame = { fieldId?: string; collection: string; path: string }

const usePathStack = (
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

	React.useEffect(() => {
		console.log({ stack })
		onStackChange(currentFrame)
	}, [stack])
	return { stack, currentFrame, addFrame, removeFrame }
}

const useSearch = (items: string[] = []) => {
	const [searchTerm, setSearchTerm] = React.useState("")
	const result = items.filter((item) =>
		item.toLowerCase().includes(searchTerm.toLocaleLowerCase())
	)
	return { searchTerm, setSearchTerm, result }
}

const FieldPicker: FC<T> = (props) => {
	const { collectionKey, fieldsDef, valueAPI, path, context, fieldKeys } =
		props
	const [scrollBoxRef, scrolledStyles] = useShadowOnScroll([])

	const uesio = hooks.useUesio(props)
	const { stack, currentFrame, addFrame, removeFrame } = usePathStack(
		collectionKey,
		({ collection }) => props.setCollection(collection),
		path
	)
	const isFieldSelected = (path: string) => {
		const pathArray = toPath(path).slice(3)
		return !!has(fieldsDef, pathArray)
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
				<p>{collectionKey}</p>
				{stack.length > 1 && (
					<button onClick={() => removeFrame()}>Back</button>
				)}

				<div key={collectionKey}>
					{collectionKey &&
						result.map((fieldId, index) => {
							const referencedCollection = collection
								?.getField(fieldId)
								?.getReferenceMetadata()?.collection
							// const fieldDef = fieldsDef?.[fieldId]
							const setPath = currentFrame.path + `["${fieldId}"]`
							const selected = isFieldSelected(setPath)
							const onClick = () => {
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
									<div
										style={{
											display: "flex",
											justifyContent: "space-betweem",
										}}
									/>
									<span>{fieldId}</span>
									{referencedCollection && (
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
									)}
								</PropNodeTag>
							)
						})}
				</div>
			</div>
		</div>
	)
}

export default FieldPicker
