package jsdialect

import (
	"encoding/json"
	"maps"
)

type ParamsAPI struct {
	// TODO: This field should not be bot-accessible, users should have to use GetAll()
	Params map[string]any `bot:"params"`
}

func (p *ParamsAPI) MarshalJSON() ([]byte, error) {
	return json.Marshal(p.Params)
}

func (p *ParamsAPI) Get(paramName string) any {
	return p.Params[paramName]
}

func (p *ParamsAPI) GetAll() map[string]any {
	// Return a copy of the map so that the bot can't modify the original
	paramsCopy := make(map[string]any)
	maps.Copy(paramsCopy, p.Params)
	return paramsCopy
}
