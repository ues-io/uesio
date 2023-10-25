package jsdialect

import "encoding/json"

type ParamsAPI struct {
	// TODO: This field should not be bot-accessible, users should have to use GetAll()
	Params map[string]interface{} `bot:"params"`
}

func (p *ParamsAPI) MarshalJSON() ([]byte, error) {
	return json.Marshal(p.Params)
}

func (p *ParamsAPI) Get(paramName string) interface{} {
	return p.Params[paramName]
}

func (p *ParamsAPI) GetAll() map[string]interface{} {
	// Return a copy of the map so that the bot can't modify the original
	paramsCopy := make(map[string]interface{})
	for k, v := range p.Params {
		paramsCopy[k] = v
	}
	return paramsCopy
}
