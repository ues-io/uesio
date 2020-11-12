package datasource

// ParamsAPI type
type ParamsAPI struct {
	params map[string]string
}

// Get function
func (p *ParamsAPI) Get(paramName string) string {
	return p.params[paramName]
}
