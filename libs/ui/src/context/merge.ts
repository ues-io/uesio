import { getURLFromFullName, getUserFileURL } from "../hooks/fileapi"
import { PlainFieldValue, PlainWireRecord } from "../bands/wirerecord/types"
import { ID_FIELD, UPDATED_AT_FIELD } from "../collectionexports"
import { Context } from "./context"
import { getStaticAssetsPath } from "../hooks/platformapi"
import { UserState } from "../bands/user/types"
import get from "lodash/get"
import { SiteState } from "../bands/site"
import { wire } from ".."
import { getExternalState, makeComponentId } from "../hooks/componentapi"
import {
	isSearchCondition,
	isValueCondition,
} from "../bands/wire/conditions/conditions"
import {
	parseOneOrTwoPartExpression,
	parseThreePartExpression,
	parseTwoOrThreePartExpression,
	parseTwoPartExpression,
	parseWireExpression,
} from "./partsparse"

type MergeType =
	| "Error"
	| "Route"
	| "Record"
	| "Records"
	| "Param"
	| "Prop"
	| "Region"
	| "User"
	| "Time"
	| "Text"
	| "Date"
	| "If"
	| "Number"
	| "Currency"
	| "RecordMeta"
	| "Collection"
	| "Theme"
	| "File"
	| "UserFile"
	| "Site"
	| "Label"
	| "SelectList"
	| "Sum"
	| "StaticFile"
	| "SignalOutput"
	| "ComponentOutput"
	| "ComponentState"
	| "ConfigValue"
	| "ConditionValue"
	| "FieldMode"
	| "FeatureFlag"

type MergeHandler = (expression: string, context: Context) => wire.FieldValue
interface MergeOptions {
	// A list of allowed merge types to be resolved as part of the merge.
	// If specified, then ONLY these merge types will be resolved, and any
	// other merge types will be left untouched.
	types?: MergeType[]
}

export const InvalidSignalOutputMergeMsg =
	"Invalid SignalOutput merge - a stepId and propertyPath must be provided, e.g. $SignalOutput{stepId:propertyPath}"
export const InvalidIfMergeMsg =
	"Invalid If merge - a condition and iftrue must be provided, e.g. $If{[condition][iftrue][iffalse]}. iffalse is optional"
export const InvalidComponentOutputMsg =
	"Invalid ComponentOutput merge - a componentType and property must be provided, e.g. $ComponentOutput{[componentType][propertyPath]}"

const handlers: Record<MergeType, MergeHandler> = {
	Record: (fullExpression, context) => {
		const [wirename, expression] = parseWireExpression(fullExpression)
		const record = context.getRecord(wirename)
		return record?.getFieldValue(expression) ?? ""
	},
	Records: (fullExpression, context) => {
		const [wirename, expression] = parseWireExpression(fullExpression)
		const records = context.getWire(wirename)?.getData()
		return (
			records?.map(
				(r) => r.getFieldValue<wire.PlainFieldValue>(expression) ?? ""
			) || ([] as wire.PlainFieldValue[])
		)
	},
	Sum: (fullExpression, context) => {
		const [wirename, expression] = parseWireExpression(fullExpression)
		const wire = context.getWire(wirename)
		let total = 0
		wire?.getData().forEach((record) => {
			total += (record.getFieldValue(expression) as number) || 0
		})
		return total
	},
	Param: (expression, context) => context.getParam(expression) ?? "",
	ConditionValue: (fullExpression, context) => {
		const [wirename, expression] = parseWireExpression(fullExpression)
		const wire = context.getWire(wirename)
		const condition = wire?.getCondition(expression)
		if (!condition) return ""
		if (!isValueCondition(condition) && !isSearchCondition(condition))
			return ""
		if (!condition.value) return ""
		return context.merge(condition.value)
	},
	SignalOutput: (expression, context) => {
		// Expression MUST have 2+ parts, e.g. $SignalOutput{[stepId][propertyPath]}
		let parts
		try {
			parts = parseOneOrTwoPartExpression(expression)
		} catch (e) {
			throw InvalidSignalOutputMergeMsg
		}
		const [stepId, propertyPath] = parts
		const signalOutputData = context.getSignalOutputData(stepId)
		if (!signalOutputData) {
			throw `Could not find signal output for step: ${stepId}`
		}
		if (!propertyPath) {
			return signalOutputData
		}
		return get(signalOutputData, propertyPath)
	},
	ComponentOutput: (expression, context) => {
		// Expression MUST have 2+ parts, e.g. $ComponentOutput{[componentType][property]}
		let parts
		try {
			parts = parseTwoPartExpression(expression)
		} catch (e) {
			throw InvalidComponentOutputMsg
		}
		const [componentType, propertyPath] = parts
		const frame = context.getComponentData(componentType)
		if (!frame) {
			throw (
				"Could not find component output data for component: " +
				componentType
			)
		}
		return get(frame.data, propertyPath) as string
	},
	ComponentState: (expression, context) => {
		// Expression MUST have 3 parts, e.g. $ComponentOutput{[componentType][componentId][property]}
		let parts
		try {
			parts = parseThreePartExpression(expression)
		} catch (e) {
			throw InvalidComponentOutputMsg
		}
		const [componentType, componentId, propertyPath] = parts
		const state = getExternalState(
			makeComponentId(context, componentType, componentId, true)
		)
		return get(state, propertyPath.split("->")) as string
	},
	User: (expression, context) => {
		const user = context.getUser()
		if (!user) return ""
		if (expression === "initials") {
			return user.firstname
				? user.firstname.charAt(0) + user.lastname.charAt(0)
				: user.username.charAt(0)
		}
		if (expression === "picture") {
			if (!user.picture) return ""
			// Remove the workspace context here
			const useContext = context.getWorkspace() ? new Context() : context
			return getUserFileURL(
				useContext,
				user.picture.id,
				"" + user.picture.updatedat
			)
		}
		return user[expression as keyof Omit<UserState, "picture">] ?? ""
	},
	Time: (expression, context) => {
		const value = context.getRecord()?.getDateValue(expression)
		if (!value) return ""
		return `${value.toLocaleDateString()} ${value.toLocaleTimeString()}`
	},
	Date: (expression, context) => {
		const value = context.getRecord()?.getDateValue(expression)
		if (!value) return ""
		return value.toLocaleDateString(undefined, { timeZone: "UTC" })
	},
	Number: (expression, context) => {
		const value = context.getRecord()?.getFieldValue(expression) as number
		const decimals = 2
		return Intl.NumberFormat(undefined, {
			minimumFractionDigits: decimals,
			maximumFractionDigits: decimals,
		}).format(value)
	},
	Currency: (expression, context) => {
		const value = context.getRecord()?.getFieldValue(expression) as number
		const decimals = 2
		return Intl.NumberFormat(undefined, {
			minimumFractionDigits: decimals,
			maximumFractionDigits: decimals,
			style: "currency",
			currency: "USD",
		}).format(value)
	},
	Text: (expression) => expression,
	If: (expression, context) => {
		let parts
		try {
			parts = parseTwoOrThreePartExpression(expression)
		} catch (e) {
			throw InvalidIfMergeMsg
		}
		return context.merge(parts[0])
			? context.merge(parts[1])
			: context.merge(parts[2])
	},
	FeatureFlag: (expression, context) =>
		context.getFeatureFlag(expression)?.value,
	Route: (expression, context) => {
		if (expression !== "path" && expression !== "title") return ""
		return context.getRoute()?.[expression] ?? ""
	},
	RecordMeta: (expression, context) => {
		const record = context.getRecord()
		if (expression === "id") {
			return record?.getId() || ""
		}
		if (expression === "uniqueKey") {
			return record?.getUniqueKey() ?? ""
		}
		if (expression === "name") {
			return record?.getNameFieldValue() ?? ""
		}
		if (expression === "index") {
			return context.getRecordDataIndex() || 0
		}
		if (expression === "isNew") {
			return record?.isNew() || false
		}
		if (expression === "isDeleted") {
			return record?.isDeleted() || false
		}
		return ""
	},
	Collection: (fullExpression, context) => {
		const [wirename, expression] = parseWireExpression(fullExpression)
		const collection = context.getWireCollection(wirename)
		if (expression === "id") {
			return collection?.getFullName() || ""
		}
		if (expression === "label") {
			return collection?.getLabel() || ""
		}
		if (expression === "pluralLabel") {
			return collection?.getPluralLabel() || ""
		}
		return ""
	},
	Theme: (expression, context) => {
		const [scope, value] = expression.split(".")
		const theme = context.getTheme()
		if (scope === "color") {
			return theme.definition.palette[value]
		}
		return ""
	},
	SelectList: (expression, context) => {
		const fieldMetadata = context.getWireCollection()?.getField(expression)
		const options = fieldMetadata?.getSelectOptions({
			addBlankOption: false,
			context,
		})
		const value = context.getRecord()?.getFieldValue(expression)
		const label = options?.find((el) => el.value === value)?.label || ""
		return context.getLabel(label) || ""
	},
	ConfigValue: (expression, context) =>
		context.getConfigValue(expression) || "",
	File: (expression, context) => getURLFromFullName(context, expression),
	UserFile: (expression, context) => {
		const [wireName, fieldName] = parseWireExpression(expression)
		const file = context
			.getRecord(wireName)
			?.getFieldValue<PlainWireRecord>(fieldName)
		if (!file) return ""
		const fileId = file[ID_FIELD] as string
		if (!fileId) return ""
		const fileVersion = file[UPDATED_AT_FIELD] as string
		return getUserFileURL(context, fileId, fileVersion)
	},
	Site: (expression, context) => {
		const site = context.getSite()
		if (expression === "url") {
			return `https://${site?.subdomain ? site.subdomain + "." : ""}${
				site?.domain
			}`
		}
		if (expression === "dependencies") return ""
		return site?.[expression as keyof Omit<SiteState, "dependencies">] || ""
	},
	StaticFile: (expression) => getStaticAssetsPath() + "/static" + expression,
	Label: (expression, context) => {
		const label = context.getLabel(expression)
		if (!label) return expression
		return label || "missing label value"
	},
	Error: (_, context) => {
		const errors = context.getCurrentErrors()
		if (!errors?.length) return ""
		return errors[0]
	},
	Prop: (expression, context) =>
		// Technically the result doesn't have to be a string,
		// but until we improve merge typing to allow for non-string values,
		// we'll pretend the prop will always be a string
		(context.getProp(expression) as string) ?? "",
	Region: (expression, context) => {
		const styleTokens = context.getProp("uesio.styleTokens") as Record<
			string,
			PlainFieldValue[]
		>
		return styleTokens?.[expression] || []
	},
	FieldMode: (expression, context) => context.getFieldMode(),
}

export { handlers }
export type { MergeType, MergeHandler, MergeOptions }
