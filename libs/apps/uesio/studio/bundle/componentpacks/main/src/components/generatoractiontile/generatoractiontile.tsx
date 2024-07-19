import { useState } from "react"
import { definition, component, hooks, metadata } from "@uesio/ui"
import { GeneratorDialog } from "../generatorbutton/generatorbutton"

type GeneratorActionTileDefinition = {
	generator: metadata.MetadataKey
	label: string
	description: string
	tileVariant?: metadata.MetadataKey
	hotkey?: string
}

const GeneratorActionTile: definition.UC<GeneratorActionTileDefinition> = (
	props
) => {
	const Tile = component.getUtility("uesio/io.tile")
	const Text = component.getUtility("uesio/io.text")

	const { context, definition } = props
	const {
		tileVariant = "uesio/io.action",
		hotkey,
		generator,
		label,
		description,
	} = definition

	const workspaceContext = context.getWorkspace()
	if (!workspaceContext) throw new Error("No Workspace Context Provided")

	const [open, setOpen] = useState<boolean>(false)
	const onClick = () => setOpen(true)
	hooks.useHotKeyCallback(hotkey, onClick, true, [open])

	return (
		<>
			<Tile context={context} variant={tileVariant} onClick={onClick}>
				<div>
					<Text
						context={context}
						element="div"
						variant="uesio/io.smalltitle"
						text={label}
					/>
					{description && (
						<Text
							context={context}
							element="div"
							variant="uesio/io.smallcontent"
							text={description}
						/>
					)}
				</div>
			</Tile>
			{open && (
				<GeneratorDialog
					setOpen={setOpen}
					generator={generator}
					context={context}
				/>
			)}
		</>
	)
}

export default GeneratorActionTile
