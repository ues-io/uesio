import { builder, context, hooks, component } from "@uesio/ui"
import React, { FC } from "react"
import PropNodeTag from "../buildpropitem/propnodetag"
const IconButton = component.getUtility("uesio/io.iconbutton")

type T = {
	scrollBoxRef: any
	results?: string[]
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
	return { currentFrame, addFrame, removeFrame }
}

const FieldPicker: FC<T> = (props) => {
	const {
		results,
		collectionKey,
		scrollBoxRef,
		fieldsDef,
		valueAPI,
		path,
		context,
	} = props
	const uesio = hooks.useUesio(props)
	const { currentFrame, addFrame, removeFrame } = usePathStack(
		collectionKey,
		({ collection }) => props.setCollection(collection),
		path
	)

	const collection = uesio.collection.useCollection(context, collectionKey)
	return (
		<div
			ref={scrollBoxRef}
			style={{ maxHeight: "400px", overflow: "scroll" }}
		>
			<p>{collectionKey}</p>
			<button onClick={() => removeFrame()}>Back</button>
			{collectionKey &&
				results &&
				results.map((fieldId, index) => {
					const referencedCollection = collection
						?.getField(fieldId)
						?.getReferenceMetadata()?.collection
					const fieldDef = fieldsDef?.[fieldId]
					const selected = fieldDef !== undefined
					const onClick = () => {
						const setPath = currentFrame.path + `["${fieldId}"]`
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
											collection: referencedCollection,
										})
									}
								/>
							)}
						</PropNodeTag>
					)
				})}
		</div>
	)
}

export default FieldPicker
