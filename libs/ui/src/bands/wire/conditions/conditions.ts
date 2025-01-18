import { MetadataKey } from "../../../metadata/types"
import { PlainFieldValue } from "../../wirerecord/types"

const PARAM = "PARAM"
type LOOKUP = "LOOKUP"
const VALUE = "VALUE"
const SEARCH = "SEARCH"
const GROUP = "GROUP"
type SUBQUERY = "SUBQUERY"

type Conjunction = "AND" | "OR"

type ConditionOperators =
  | "EQ"
  | "NOT_EQ"
  | "GT"
  | "LT"
  | "GTE"
  | "LTE"
  | "IN"
  | "NOT_IN"
  | "IS_BLANK"
  | "IS_NOT_BLANK"
  | "HAS_ANY"
  | "HAS_ALL"
  | "CONTAINS"
  | "BETWEEN"
  | "STARTS_WITH"

type WireConditionState =
  | ParamConditionState
  | LookupConditionState
  | ValueConditionState
  | SearchConditionState
  | GroupConditionState
  | SubqueryConditionState

type NoValueBehavior = "DEFAULT" | "DEACTIVATE" | "NOQUERY" | undefined

type ConditionBase = {
  id?: string
  operator?: ConditionOperators
  inactive?: boolean
  noValueBehavior?: NoValueBehavior
}

type GroupConditionState = ConditionBase & {
  type: typeof GROUP
  conjunction: Conjunction
  conditions: WireConditionState[]
  valueSource?: undefined
}

type SubqueryConditionState = ConditionBase & {
  type: SUBQUERY
  conditions?: WireConditionState[]
  field: string
  valueSource?: undefined
  subcollection: MetadataKey
  subfield: MetadataKey
}

type SearchConditionState = ConditionBase & {
  type: typeof SEARCH
  value: string
  valueSource?: undefined
  fields?: string[]
}

type ParamConditionState = ConditionBase & {
  type?: undefined
  field: string
  valueSource: typeof PARAM
  param?: string
  params?: string[]
}

type LookupConditionState = ConditionBase & {
  type?: undefined
  field: string
  valueSource: LOOKUP
  lookupWire: string
  lookupField: string
}

type ValueConditionState = ConditionBase & {
  type?: undefined
  field: string
  valueSource: typeof VALUE | undefined
  value?: PlainFieldValue
  values?: PlainFieldValue[]
  start?: PlainFieldValue
  end?: PlainFieldValue
  inclusiveStart?: boolean
  inclusiveEnd?: boolean
}

const isValueCondition = (
  condition: WireConditionState | undefined,
): condition is ValueConditionState =>
  !!condition &&
  !condition.type &&
  (condition.valueSource === VALUE || !condition.valueSource)

const isParamCondition = (
  condition: WireConditionState | undefined,
): condition is ParamConditionState =>
  !!condition && !condition.type && condition.valueSource === PARAM

const isGroupCondition = (
  condition: WireConditionState | undefined,
): condition is ValueConditionState => condition?.type === GROUP

const isSearchCondition = (
  condition: WireConditionState | undefined,
): condition is ValueConditionState => condition?.type === SEARCH

export {
  isValueCondition,
  isGroupCondition,
  isParamCondition,
  isSearchCondition,
}

export type {
  ConditionOperators,
  WireConditionState,
  LookupConditionState,
  ParamConditionState,
  ValueConditionState,
  SearchConditionState,
  SubqueryConditionState,
  NoValueBehavior,
}
