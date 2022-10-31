package datasource

type ParamsAPI struct {
	params map[string]interface{}
}

func (p *ParamsAPI) Get(paramName string) interface{} {
	return p.params[paramName]
}
