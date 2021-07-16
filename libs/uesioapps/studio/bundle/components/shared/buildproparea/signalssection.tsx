import { FC } from "react"
import { SectionRendererProps } from "./sectionrendererdefinition"
import ExpandPanel from "../expandpanel"
import PropNodeTag from "../buildpropitem/propnodetag"
import { hooks, definition, signal } from "@uesio/ui"
import PropertiesPane from "../propertiespane"

interface T extends SectionRendererProps {
	variantSignals: signal.SignalDefinition[]
	addSignalToVariant: (signal: signal.SignalDefinition) => void
}

const SignalsSection: FC<T> = (props) => {
	const {
		section,
		definition: def,
		path,
		context,
		variantSignals,
		addSignalToVariant,
	} = props
	const uesio = hooks.useUesio(props)
	const theme = uesio.getTheme()
	const primaryColor = theme.definition.palette.primary
	const selectedNode = uesio.builder.useSelectedNode()
	const signalsDef = def?.signals as definition.Definition[] | undefined
	const isVariant = true
	const signals = variantSignals || signalsDef

	//
	const addSignal = (signal: any) => {
		console.log("adding")
		const addToView = uesio.view.addDefinition(`${path}["signals"]`, {
			signal: "NEW_SIGNAL",
		})

		const addToVariant = addSignalToVariant(signal)
		isVariant ? addToVariant : addToView
	}

	return (
		<ExpandPanel
			context={context}
			defaultExpanded={true}
			title={section.title}
			action="add_box"
			actionColor={primaryColor}
			actionOnClick={(): void => addSignal("signally")}
		>
			{signals.map((signal: signal.SignalDefinition, index) => {
				const signalPath = `${path}["signals"]["${index}"]`
				const selected = selectedNode.startsWith(signalPath)
				return (
					<PropNodeTag
						title={signal?.signal}
						icon="router"
						selected={selected}
						iconColor={primaryColor}
						key={index}
						onClick={(): void =>
							uesio.builder.setSelectedNode(signalPath)
						}
						context={context}
					>
						{
							<PropertiesPane
								path={signalPath}
								index={0}
								context={context}
								definition={signal}
								propsDef={{
									title: "Signal",
									sections: [],
									defaultDefinition: () => ({}),
									properties: uesio.builder.getSignalProperties(
										signal
									),
								}}
							/>
						}
					</PropNodeTag>
				)
			})}
		</ExpandPanel>
	)
}

export default SignalsSection
