package datasource

// ParamsAPI type
type ParamsAPI struct {
	params map[string]interface{}
}

// Get function
func (p *ParamsAPI) Get(paramName string) interface{} {
	return p.params[paramName]
}
