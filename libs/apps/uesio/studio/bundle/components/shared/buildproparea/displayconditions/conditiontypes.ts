type IParamIsSet = {
	type: "paramIsSet"
	param: string
}
type IParamIsValue = {
	type: "paramIsValue"
	param: string
	value: string
}
type IFieldIsValue = {
	type: "fieldIsValue"
	field: string
	value: string
}

export type Condition = IParamIsSet | IParamIsValue | IFieldIsValue

export default Condition
