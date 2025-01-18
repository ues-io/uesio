import { Context } from "../context/context"
import { BaseDefinition } from "../definition/definition"
import { wire as wireApi } from "../api/api"
import { Wire, WireRecord } from "../wireexports"
import { DISPLAY_CONDITIONS } from "../componentexports"
import { metadata } from ".."

type RequireOnlyOne<T, Keys extends keyof T = keyof T> = Pick<
  T,
  Exclude<keyof T, Keys>
> &
  {
    [K in Keys]-?: Required<Pick<T, K>> &
      Partial<Record<Exclude<Keys, K>, undefined>>
  }[Keys]

type DisplayOperator = "EQUALS" | "NOT_EQUALS" | "IN" | "NOT_IN" | undefined

// If there is a record in context, only test against that record
// If there is no record in context, test against all records in the wire.

interface FieldValueConditionBase {
  type?: "fieldValue" | undefined
  wire?: string
  field: string
  operator?: DisplayOperator
  value?: string
  values?: string[]
}

interface HasWire {
  wire: string
}
interface HasOperator {
  operator: DisplayOperator
}

type FieldValueCondition = RequireOnlyOne<
  FieldValueConditionBase,
  "value" | "values"
>

type ParamIsSetCondition = {
  type: "paramIsSet"
  param: string
}

type MergeValue = {
  type: "mergeValue"
  operator: DisplayOperator
  sourceValue: string
  value: string
}

type ParamIsNotSetCondition = {
  type: "paramIsNotSet"
  param: string
}

type ParamValueConditionBase = {
  type: "paramValue"
  param: string
  operator: DisplayOperator
  value?: string
  values?: string[]
}

type ParamValueCondition = RequireOnlyOne<
  ParamValueConditionBase,
  "value" | "values"
>

type HasNoValueCondition = {
  type: "hasNoValue"
  value: unknown
  wire?: string
}

type RecordIsNewCondition = {
  type: "recordIsNew"
}

type RecordIsNotNewCondition = {
  type: "recordIsNotNew"
}

type RecordIsDeletedCondition = {
  type: "recordIsDeleted"
}

type RecordIsNotDeletedCondition = {
  type: "recordIsNotDeleted"
}

type RecordIsChangedCondition = {
  type: "recordIsChanged"
}

type RecordIsNotChangedCondition = {
  type: "recordIsNotChanged"
}

type RecordIsEditableCondition = {
  type: "recordIsEditable"
}

type RecordIsNotEditableCondition = {
  type: "recordIsNotEditable"
}

type RecordIsDeleteableCondition = {
  type: "recordIsDeleteable"
}

type RecordIsNotDeleteableCondition = {
  type: "recordIsNotDeleteable"
}

type HasValueCondition = {
  type: "hasValue"
  value: unknown
  wire?: string
}

type CollectionContextCondition = {
  type: "collectionContext"
  collection: string
}

type FeatureFlagCondition = {
  type: "featureFlag"
  name: string
}

type FieldModeCondition = {
  type: "fieldMode"
  mode: "READ" | "EDIT"
}

type WireHasNoChanges = {
  type: "wireHasNoChanges"
  wire: string
}
type WireHasChanges = {
  type: "wireHasChanges"
  wire: string
  fields?: string[]
}
type WireIsLoading = {
  type: "wireIsLoading"
  wire: string
}
type WireIsNotLoading = {
  type: "wireIsNotLoading"
  wire: string
}
type WireHasLoadedAllRecords = {
  type: "wireHasLoadedAllRecords"
  wire: string
}
type WireHasMoreRecordsToLoad = {
  type: "wireHasMoreRecordsToLoad"
  wire: string
}
type WireHasNoRecords = {
  type: "wireHasNoRecords"
  wire: string
}
type WireHasRecords = {
  type: "wireHasRecords"
  wire: string
}
type WireHasSearchCondition = {
  type: "wireHasSearchCondition"
  wire: string
}
type WireHasNoSearchCondition = {
  type: "wireHasNoSearchCondition"
  wire: string
}
type WireHasActiveConditions = {
  type: "wireHasActiveConditions"
  wire: string
}
type WireHasNoActiveConditions = {
  type: "wireHasNoActiveConditions"
  wire: string
}

type HasConfigValue = {
  type: "hasConfigValue"
  configValue: metadata.MetadataKey
  operator: DisplayOperator
  value?: string
  values?: string[]
}

type HasProfile = {
  type: "hasProfile"
  profile: string
}

type HasNamedPermission = {
  type: "hasNamedPermission"
  permission: string
}

type Conjunction = "AND" | "OR"

type GroupCondition = {
  type: "group"
  conjunction: Conjunction
  conditions: DisplayCondition[]
}

type DisplayCondition =
  | GroupCondition
  | HasProfile
  | HasNamedPermission
  | WireHasChanges
  | WireHasNoChanges
  | HasNoValueCondition
  | HasValueCondition
  | FieldValueCondition
  | ParamIsSetCondition
  | ParamIsNotSetCondition
  | ParamValueCondition
  | CollectionContextCondition
  | FeatureFlagCondition
  | FieldModeCondition
  | RecordIsNewCondition
  | RecordIsNotNewCondition
  | RecordIsChangedCondition
  | RecordIsNotChangedCondition
  | RecordIsDeletedCondition
  | RecordIsNotDeletedCondition
  | RecordIsEditableCondition
  | RecordIsNotEditableCondition
  | RecordIsDeleteableCondition
  | RecordIsNotDeleteableCondition
  | WireIsLoading
  | WireIsNotLoading
  | WireHasNoRecords
  | WireHasRecords
  | WireHasSearchCondition
  | WireHasNoSearchCondition
  | WireHasActiveConditions
  | WireHasNoActiveConditions
  | WireHasLoadedAllRecords
  | WireHasMoreRecordsToLoad
  | MergeValue
  | HasConfigValue

type ItemContext<T> = {
  item: T
  context: Context
}

function compare(a: unknown, b: unknown, op: DisplayOperator) {
  if (
    op &&
    op.includes("EQUALS") &&
    a &&
    b &&
    Object.prototype.toString.call(a) + Object.prototype.toString.call(b) !==
      "[object String][object String]"
  )
    console.warn(
      "You're comparing objects in a display condition, this is probably an error",
    )

  switch (op) {
    case "NOT_EQUALS":
      return a !== b
    case "IN":
    case "NOT_IN":
      if (Array.isArray(a)) {
        return a.includes(b) === (op === "IN")
      }
      return false
    default:
      return a === b
  }
}

// a list of types for which a wire property is required
// and a wire must exist in order to evaluate the condition,
// otherwise the condition's value will be false.
const typesRequiringWire = [
  "wireHasChanges",
  "wireHasNoChanges",
  "wireIsLoading",
  "wireIsNotLoading",
  "wireHasNoRecords",
  "wireHasRecords",
  "wireHasSearchCondition",
  "wireHasNoSearchCondition",
  "wireHasActiveConditions",
  "wireHasNoActiveConditions",
  "wireHasLoadedAllRecords",
  "wireHasMoreRecordsToLoad",
]

const isConditionRequiringWireProperty = (condition: DisplayCondition) =>
  typesRequiringWire.includes(condition.type || "fieldValue")

export const wireHasActiveConditions = (wire: Wire) => {
  if (!wire.getConditions()?.length) return false
  return wire.getConditions().some((condition) => condition.inactive !== true)
}

export const wireHasNoActiveConditions = (wire: Wire) =>
  !wireHasActiveConditions(wire)

export const wireHasChanges = (wire: Wire, changedFields?: string[]) => {
  if (changedFields && changedFields?.length > 0) {
    const changes = wire.getChanges()
    if (!changes || !changes.length) return false
    return changes.some((change) =>
      changedFields.some((fieldId) => fieldId in change.source),
    )
  }
  return wire.hasChanged()
}

function should(condition: DisplayCondition, context: Context): boolean {
  if (!condition) return true
  const { type } = condition
  const { wire: wireName } = condition as HasWire
  const { operator } = condition as HasOperator
  let wire = null
  if (wireName) {
    wire = context.getWire(wireName) as Wire
    if (!wire && isConditionRequiringWireProperty(condition)) return false
  } else if (isConditionRequiringWireProperty(condition)) {
    return false
  }

  if (type === "collectionContext") {
    const collection = context.getWire()?.getCollection()
    return collection?.getFullName() === condition.collection
  }

  if (type === "group") {
    const { conjunction = "AND", conditions = [] } = condition
    return conditions[
      conjunction === "OR" && conditions?.length ? "some" : "every"
    ]((c) => should(c, context))
  }

  if (type === "paramIsSet") return !!context.getParam(condition.param)

  if (type === "paramIsNotSet") return !context.getParam(condition.param)

  if (type === "fieldMode") return condition.mode === context.getFieldMode()

  if (type === "featureFlag")
    return !!context.getFeatureFlag(condition.name)?.value

  if (type === "recordIsNew") return !!context.getRecord(wireName)?.isNew()

  if (type === "recordIsNotNew") return !context.getRecord(wireName)?.isNew()

  if (type === "recordIsChanged")
    return !!context.getRecord(wireName)?.isChanged()

  if (type === "recordIsNotChanged")
    return !context.getRecord(wireName)?.isChanged()

  if (type === "recordIsDeleted")
    return !!context.getRecord(wireName)?.isDeleted()

  if (type === "recordIsNotDeleted")
    return !context.getRecord(wireName)?.isDeleted()

  if (type === "recordIsEditable")
    return !!context.getRecord(wireName)?.isEditable()

  if (type === "recordIsNotEditable")
    return !context.getRecord(wireName)?.isEditable()

  if (type === "recordIsDeleteable")
    return !!context.getRecord(wireName)?.isDeleteable()

  if (type === "recordIsNotDeleteable")
    return !context.getRecord(wireName)?.isDeleteable()

  if (type === "hasProfile")
    return context.getUser()?.profile === condition.profile

  if (type === "hasNamedPermission")
    return (
      context.getUser()?.namedPermissions?.includes(condition.permission) ||
      false
    )

  if (type === "wireHasChanges") {
    return wireHasChanges(wire as Wire, condition.fields)
  }
  if (type === "wireHasNoChanges") {
    return !wire?.getChanges().length && !wire?.getDeletes().length
  }
  if (type === "wireHasNoActiveConditions") {
    return wireHasNoActiveConditions(wire as Wire)
  }
  if (type === "wireHasActiveConditions") {
    return wireHasActiveConditions(wire as Wire)
  }
  if (type === "wireIsLoading" || type === "wireIsNotLoading") {
    const isLoading = !!wire?.isLoading()
    return type === "wireIsNotLoading" ? !isLoading : isLoading
  }

  if (type === "wireHasRecords" || type === "wireHasNoRecords") {
    const hasRecords = !!wire?.getData().length
    return type === "wireHasNoRecords" ? !hasRecords : hasRecords
  }

  if (
    type === "wireHasSearchCondition" ||
    type === "wireHasNoSearchCondition"
  ) {
    const hasSearchCondition = !!wire
      ?.getConditions()
      .some((condition) => condition.type === "SEARCH")
    return type === "wireHasNoSearchCondition"
      ? !hasSearchCondition
      : hasSearchCondition
  }

  if (
    type === "wireHasLoadedAllRecords" ||
    type === "wireHasMoreRecordsToLoad"
  ) {
    const hasAllRecords = !!wire?.hasAllRecords()
    return type === "wireHasMoreRecordsToLoad" ? !hasAllRecords : hasAllRecords
  }

  const canHaveMultipleValues =
    !type ||
    type === "fieldValue" ||
    type === "paramValue" ||
    type === "hasConfigValue"

  const compareToValue =
    typeof condition.value === "string"
      ? context.merge(condition.value as string)
      : (condition.value ?? (canHaveMultipleValues ? condition.values : ""))

  if (type === "hasNoValue") return !compareToValue
  if (type === "hasValue") return !!compareToValue
  if (type === "hasConfigValue")
    return compare(
      compareToValue,
      context.getConfigValue(condition.configValue)?.value,
      operator,
    )
  if (type === "paramValue")
    return compare(compareToValue, context.getParam(condition.param), operator)
  if (type === "mergeValue")
    return compare(
      compareToValue,
      context.merge(condition.sourceValue),
      operator,
    )

  if (!type || type === "fieldValue") {
    const record = context.getRecord(wireName)
    const comparator = (r: WireRecord) =>
      compare(
        compareToValue,
        condition.field ? (r.getFieldValue(condition.field) ?? "") : "",
        operator,
      )
    if (record) return comparator(record)

    // If we have no record in context, test against all records in the wire.
    if (!wire) return operator === "NOT_EQUALS"
    const records = wire.getData()

    // If there are no records, not_equal applies
    if (!records.length && operator) return operator.includes("NOT")

    // When we check for false condition, we want to check every record.
    const arrayMethod = operator?.includes("NOT") ? "every" : "some"

    return records[arrayMethod](comparator)
  }

  console.warn(`Unknown display condition type: ${type}`)
  return true
}

const shouldAll = (
  conditions: DisplayCondition[] | undefined,
  context: Context,
) => {
  if (!conditions?.length) return true
  return conditions.every((condition) => should(condition, context))
}

const extractWireIdsFromConditions = (
  conditions: DisplayCondition[],
  uniqueWires: Set<string>,
) => {
  conditions.forEach((condition) => {
    if ("wire" in condition && condition.wire) {
      uniqueWires.add(condition.wire)
    } else if (
      condition.type === "group" &&
      condition.conditions instanceof Array
    ) {
      extractWireIdsFromConditions(condition.conditions, uniqueWires)
    }
  })
}

// Create a list of all of the wires that we're going to care about
export const getWiresForConditions = (
  conditions: DisplayCondition[] | undefined,
  context: Context | undefined,
  uniqueWires = new Set<string>(),
) => {
  if (!conditions) return []
  const contextWire = context?.getWireId()
  if (contextWire) uniqueWires.add(contextWire)
  extractWireIdsFromConditions(conditions, uniqueWires)
  return Array.from(uniqueWires.values())
}

const useShouldFilter = <T extends BaseDefinition>(
  items: T[] | undefined = [],
  context: Context,
) => {
  const conditionsList = items.flatMap((item) => {
    const conditions = item[DISPLAY_CONDITIONS]
    return conditions ? [conditions] : []
  })

  wireApi.useWires(
    getWiresForConditions(
      conditionsList?.flatMap((c) => c),
      context,
    ),
    context,
  )

  return items?.filter((item) => shouldAll(item[DISPLAY_CONDITIONS], context))
}

const useContextFilter = <T>(
  items: T[],
  conditions: DisplayCondition[] | undefined,
  contextFunc: (item: T, context: Context) => Context,
  context: Context,
): ItemContext<T>[] => {
  wireApi.useWires(getWiresForConditions(conditions, context), context)
  return items.flatMap((item) => {
    const newContext = contextFunc(item, context)
    return shouldAll(conditions, newContext)
      ? [
          {
            item,
            context: newContext,
          },
        ]
      : []
  })
}

const useShould = (
  conditions: DisplayCondition[] | undefined,
  context: Context,
) => {
  wireApi.useWires(getWiresForConditions(conditions, context), context)
  return shouldAll(conditions, context)
}

function shouldHaveClass(
  context: Context,
  className: string,
  definition?: BaseDefinition,
) {
  const classesLogic = definition?.["uesio.classes"] as
    | Record<string, DisplayCondition[]>
    | undefined
  const classLogic = classesLogic?.[className]
  if (!classLogic?.length) return false

  return shouldAll(classLogic, context)
}

export {
  useShould,
  should,
  shouldAll,
  useShouldFilter,
  useContextFilter,
  shouldHaveClass,
}

export type { DisplayCondition, DisplayOperator, ItemContext }
