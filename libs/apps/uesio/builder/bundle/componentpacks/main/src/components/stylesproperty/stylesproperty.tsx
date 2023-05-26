import {
	component,
	definition,
	metadata,
	platform,
	styles,
	wire,
} from "@uesio/ui"
import { FullPath, parseFullPath } from "../../api/path"
import { get, set } from "../../api/defapi"
import { getComponentDef } from "../../api/stateapi"
import { useEffect, useRef, useState } from "react"
import PropertiesWrapper from "../mainwrapper/propertiespanel/propertieswrapper"

type Props = {
	componentType: metadata.MetadataKey
	componentPath: FullPath
}

const StyleDefaults = Object.freeze({
	titlebar: ["grid", "grid-cols-2", "grid-flow-col", "auto-cols-max"],
})

const StylesProperty: definition.UC<Props> = (props) => {
	const {
		context,
		path,
		definition: { componentPath, componentType },
	} = props
	const classes = styles.useStyleTokens(StyleDefaults, props)

	const TitleBar = component.getUtility("uesio/io.titlebar")
	const PillBox = component.getUtility("uesio/io.pillbox")
	const Button = component.getUtility("uesio/io.button")
	const tokensPath = componentPath.addLocal("uesio.styleTokens")
	const Popper = component.getUtility("uesio/io.popper")
	const ConstrainedInput = component.getUtility(
		"uesio/builder.constrainedinput"
	)
	const anchorEl = useRef<HTMLDivElement>(null)

	const tokensByRegion = (get(context, tokensPath) || {}) as Record<
		string,
		string[]
	>
	const styleRegions = getComponentDef(context, componentType)
		?.styleRegions || {
		root: {},
	}

	const setRegionTokens = (regionName: string, tokens: string[]) => {
		set(context, tokensPath, {
			...tokensByRegion,
			[regionName]: tokens,
		})
	}

	const [showPopper, setShowPopper] = useState(false)
	const [contextRegionName, setContextRegionName] = useState("")

	const addRegionToken = (token: string) => {
		const regionTokens =
			tokensByRegion[contextRegionName] || ([] as string[])
		setRegionTokens(contextRegionName, [
			...regionTokens.filter((t) => t !== token),
			token,
		])
	}
	const [tailwindTokens, setTailwindTokens] = useState<wire.SelectOption[]>(
		[] as wire.SelectOption[]
	)

	useEffect(() => {
		// Fetch tailwind tokens
		const tailwindClassesUrl = platform.platform.getComponentPackURL(
			context,
			"uesio/builder",
			"main",
			"tailwind-classes.json"
		)
		console.log("tailwind classes url", tailwindClassesUrl)
		platform.platform
			.memoizedGetJSON<string[]>(tailwindClassesUrl)
			.then((tokens) => {
				console.log("got tailwind tokens", tokens)
				setTailwindTokens(
					tokens.map((token) => ({
						label: token,
						value: token,
					}))
				)
			})
	}, [])

	return (
		<div ref={anchorEl}>
			{Object.keys(styleRegions).map((regionName) => {
				const regionTokens =
					tokensByRegion[regionName] || ([] as string[])
				const removeRegionToken = (deletedVal: string) => {
					setRegionTokens(
						regionName,
						regionTokens.filter((t) => t !== deletedVal)
					)
				}
				return (
					<div key={regionName}>
						<TitleBar
							title={regionName}
							variant="uesio/builder.propsubsection"
							className={classes.titlebar}
							context={context}
							actions={
								<Button
									variant="uesio/builder.panelactionbutton"
									context={context}
									label="+"
									icon="add style token"
									onClick={() => {
										setShowPopper(true)
										setContextRegionName(regionName)
									}}
								/>
							}
						/>
						<PillBox
							context={context}
							items={regionTokens}
							onDelete={removeRegionToken}
						/>
					</div>
				)
			})}
			{showPopper && anchorEl && (
				<Popper
					referenceEl={anchorEl.current}
					context={context}
					placement="right-start"
					autoPlacement={["right-start"]}
					offset={6}
					useFirstRelativeParent
					matchHeight
				>
					<PropertiesWrapper
						context={context}
						path={parseFullPath(path)}
						title={"Select a style token"}
						onUnselect={() => setShowPopper(false)}
					>
						<ConstrainedInput
							context={context}
							value=""
							setValue={(value: wire.FieldValue) => {
								addRegionToken(value as string)
								setShowPopper(false)
							}}
							label="Token Name"
							labelPosition="left"
							fieldComponentType="uesio/builder.autocompletefield"
							fieldComponentProps={{
								variant:
									"uesio/io.field:uesio/builder.propfield",
								options: tailwindTokens,
							}}
						/>
					</PropertiesWrapper>
				</Popper>
			)}
		</div>
	)
}

export default StylesProperty
