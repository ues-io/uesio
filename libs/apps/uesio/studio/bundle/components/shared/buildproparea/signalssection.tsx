import { FunctionComponent } from "react"
import { SectionRendererProps } from "./sectionrendererdefinition"
import PropNodeTag from "../buildpropitem/propnodetag"
import { hooks, definition, signal, component } from "@uesio/ui"
import PropertiesPane from "../propertiespane"

const TitleBar = component.registry.getUtility("uesio/io.titlebar")
const Button = component.registry.getUtility("uesio/io.button")
const Icon = component.registry.getUtility("uesio/io.icon")

const SignalsSection: FunctionComponent<SectionRendererProps> = (props) => {
	const { path, context, valueAPI } = props
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

	const signalsPath = `${path}["signals"]`

	return (
		<>
			<TitleBar
				variant="studio.propsubsection"
				title={""}
				context={context}
				actions={
					<Button
						context={context}
						variant="studio.actionbutton"
						icon={
							<Icon
								context={context}
								icon="add"
								variant="studio.actionicon"
							/>
						}
						label="New Signal"
						onClick={() => {
							valueAPI.add(signalsPath, {
								signal: "NEW_SIGNAL",
							})
						}}
					/>
				}
			/>
			{signalsDef?.map((signal: signal.SignalDefinition, index) => {
				const signalPath = `${signalsPath}["${index}"]`
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
						popChildren
					>
						{
							<PropertiesPane
								path={signalPath}
								index={0}
								context={context}
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
		</>
	)
}

export default SignalsSection
