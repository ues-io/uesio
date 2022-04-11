type IParamIsSet = {
	type: "paramIsSet"
	param: string
}
type IParamValue = {
	type: "paramValue"
	param: string
	value: string
}
type IFieldValue = {
	type: "fieldValue"
	field: string
	value: string
}

export type Condition = IParamIsSet | IParamValue | IFieldValue

export default Condition
