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
import TailwindClassPicker from "../../utilities/tailwindclasspicker/tailwindclasspicker"

type Props = {
	componentType: metadata.MetadataKey
	componentPath: FullPath
}

const StyleDefaults = Object.freeze({
	titlebar: ["grid", "grid-cols-2", "grid-flow-col", "auto-cols-max"],
	focusedRegion: ["border", "border-[$Theme{color.primary}]"],
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
	const anchorEl = useRef<HTMLDivElement>(null)

	const tokensByRegion = (get(context, tokensPath) || {}) as Record<
		string,
		string[]
	>
	const styleRegions = getComponentDef(componentType)?.styleRegions || {
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
		setRegionTokens(
			contextRegionName,
			addTokenToList(token, tokensByRegion[contextRegionName])
		)
	}
	const [tailwindTokens, setTailwindTokens] = useState<string[][]>(
		[] as string[][]
	)

	useEffect(
		() => {
			// Fetch tailwind tokens
			const tailwindClassesUrl = platform.platform.getComponentPackURL(
				context,
				"uesio/builder",
				"main",
				undefined,
				"tailwind-classes.json"
			)
			platform.platform
				.memoizedGetJSON<string[][]>(context, tailwindClassesUrl, {
					// This will only change when the app is restarted, so no need to refetch every time,
					// reuse it if it's in memory cache
					refetch: false,
				})
				.then(setTailwindTokens)
		},
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[]
	)

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
					<div
						key={regionName}
						className={
							regionName === contextRegionName
								? classes.focusedRegion
								: ""
						}
					>
						<TitleBar
							title={regionName}
							variant="uesio/builder.propsubsection"
							className={classes.titlebar}
							context={context}
							actions={
								<Button
									variant="uesio/builder.panelactionbutton"
									context={context}
									label="add style token"
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
					parentSelector="#propertieswrapper"
					matchHeight
				>
					<PropertiesWrapper
						context={context}
						path={parseFullPath(path)}
						title={"Select a style token: " + contextRegionName}
						onUnselect={() => setShowPopper(false)}
					>
						<TailwindClassPicker
							id="style-token-picker"
							context={context}
							value=""
							setValue={(value: wire.FieldValue) => {
								addRegionToken(value as string)
								//setShowPopper(false)
							}}
							parsedTokens={tailwindTokens}
						/>
					</PropertiesWrapper>
				</Popper>
			)}
		</div>
	)
}

const escapeTokenForMerge = (token = "") =>
	token
		.trim()
		// Tailwind does not allow any whitespace, they must be replaced with underscores
		.replace(/\s/g, "_")

// Given a new style token and a list of existing tokens,
// adds the new token to the list after merging with any conflicting/duplicate tokens,
// using the same Tailwind class merging rules that are used at runtime.
export const addTokenToList = (
	newToken: string,
	existingTokens: string[] = []
): string[] =>
	styles
		.mergeClasses([
			...existingTokens.map(escapeTokenForMerge),
			escapeTokenForMerge(newToken),
		])
		.split(/\s/)

export default StylesProperty
