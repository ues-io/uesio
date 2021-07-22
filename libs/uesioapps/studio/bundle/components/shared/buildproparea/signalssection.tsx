import { FunctionComponent } from "react"
import { SectionRendererProps } from "./sectionrendererdefinition"
import ExpandPanel from "../expandpanel"
import PropNodeTag from "../buildpropitem/propnodetag"
import { hooks, definition, signal } from "@uesio/ui"
import PropertiesPane from "../propertiespane"

const SignalsSection: FunctionComponent<SectionRendererProps> = (props) => {
	const { section, path, context, valueAPI } = props
	const uesio = hooks.useUesio(props)
	const theme = uesio.getTheme()
	const primaryColor = theme.definition.palette.primary
	const [metadataType, metadataItem, selectedNode] =
		uesio.builder.useSelectedNode()

	const componentDef = valueAPI.get(path || "") as
		| definition.DefinitionMap
		| undefined

	const signalsDef = componentDef?.signals as
		| definition.Definition[]
		| undefined

	return (
		<ExpandPanel
			context={context}
			defaultExpanded={true}
			title={section.title}
			action="add_box"
			actionColor={primaryColor}
			actionOnClick={() =>
				valueAPI.add(`${path}["signals"]`, {
					signal: "NEW_SIGNAL",
				})
			}
		>
			{signalsDef?.map((signal: signal.SignalDefinition, index) => {
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
							uesio.builder.setSelectedNode(
								metadataType,
								metadataItem,
								signalPath
							)
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
									properties:
										uesio.builder.getSignalProperties(
											signal
										),
								}}
								valueAPI={valueAPI}
							/>
						}
					</PropNodeTag>
				)
			})}
		</ExpandPanel>
	)
}

export default SignalsSection
