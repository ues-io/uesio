import { definition, api, platform, metadata } from "@uesio/ui"
import ConfigFeatureFlagsCheckboxItem from "./configfeatureflagscheckboxitem"
import ConfigFeatureFlagsNumberItem from "./configfeatureflagsnumberitem"

type Props = {
	user: string
	type: "ORG" | "USER"
}

const flagSort = (
	a: platform.FeatureFlagResponse,
	b: platform.FeatureFlagResponse
) => a.name.localeCompare(b.name)

const isCheckboxFlag = (
	flag: platform.FeatureFlagResponse
): flag is platform.CheckboxFeatureFlag => flag.type === "CHECKBOX"
const isNumberFlag = (
	flag: platform.FeatureFlagResponse
): flag is platform.NumberFeatureFlag => flag.type === "NUMBER"

const ConfigFeatureFlags: definition.UC<Props> = (props) => {
	const { context, definition } = props
	const user = definition?.user ? context.mergeString(definition?.user) : ""

	const handleSet = async (key: string, value: boolean | number) => {
		try {
			await api.featureflag.set(context, key, value, user)
		} catch (err) {
			api.notification.addError(err as Error, context)
		}
	}

	const [values] = api.featureflag.useFeatureFlags(context, user)
	// Do an initial pass to filter based on user type
	const flags = values?.filter((flag: platform.FeatureFlagResponse) =>
		definition?.type === "ORG" ? !!flag.validForOrgs : true
	)
	// Further filter based on the flag type
	const checkboxFlags = flags?.filter(isCheckboxFlag)
	const numberFlags = flags?.filter(isNumberFlag)
	checkboxFlags?.sort(flagSort)
	numberFlags?.sort(flagSort)

	return (
		<>
			{checkboxFlags?.map((response, i) => {
				const key = metadata.getKey(response)
				const value = response.value as boolean
				return (
					<ConfigFeatureFlagsCheckboxItem
						key={`${key}.${i}`}
						title={key}
						value={value}
						context={context}
						handleSet={handleSet}
					/>
				)
			})}
			{numberFlags?.map((response, i) => {
				const key = metadata.getKey(response)
				const value = response.value as number
				return (
					<ConfigFeatureFlagsNumberItem
						key={`${key}.${i}`}
						title={key}
						value={value}
						context={context}
						handleSet={handleSet}
						min={response.min}
						max={response.max}
					/>
				)
			})}
		</>
	)
}

export default ConfigFeatureFlags
