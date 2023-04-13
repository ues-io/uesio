package jsdialect

type ParamsAPI struct {
	Params map[string]interface{} `bot:"params"`
}

func (p *ParamsAPI) Get(paramName string) interface{} {
	return p.Params[paramName]
}
