import { FunctionComponent } from "react"
import { hooks, component } from "@uesio/ui"
import { DeckProps, DeckDefinition } from "./deckdefinition"
import Deck from "./deck"

const DeckBuilder: FunctionComponent<DeckProps> = (props) => {
	const uesio = hooks.useUesio(props)
	const definition = uesio.view.useDefinition(props.path) as DeckDefinition
	const buildView = uesio.builder.useView()
	const isExpanded = buildView === "expandedview"
	const { path, context } = props

	return (
		<>
			{isExpanded && (
				<div
					style={{
						border: "1px dashed #ccc",
						minHeight: "40px",
						margin: "8px",
						backgroundColor: "#f5f5f5",
					}}
				>
					<component.Slot
						definition={definition}
						listName="components"
						path={path}
						accepts={["uesio.standalone"]}
						context={context.addFrame({ noMerge: true })}
					/>
				</div>
			)}
			<Deck {...props} definition={definition} />
		</>
	)
}

export default DeckBuilder
