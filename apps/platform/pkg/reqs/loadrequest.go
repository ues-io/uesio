package reqs

import "errors"

// LoadRequest struct
type LoadRequest struct {
	Collection string                 `json:"collection"`
	Wire       string                 `json:"wire"`
	Type       string                 `json:"type"`
	Fields     []LoadRequestField     `json:"fields"`
	Conditions []LoadRequestCondition `json:"conditions"`
}

// GetCollection function
func (lr *LoadRequest) GetCollection() string {
	return lr.Collection
}

// GetWire function
func (lr *LoadRequest) GetWire() string {
	return lr.Wire
}

// GetRequestByWireName function
func GetRequestByWireName(requests []LoadRequest, wireName string) (*LoadRequest, error) {
	// Look through the previous wires to find the one to look up on.
	for _, wire := range requests {
		if wire.Wire == wireName {
			return &wire, nil
		}
	}
	return nil, errors.New("Could not find lookup wire")
}

// LoadRequestField struct
type LoadRequestField struct {
	ID     string             `json:"id"`
	Fields []LoadRequestField `json:"fields"`
}

// LoadRequestCondition struct
type LoadRequestCondition struct {
	Field       string      `json:"field"`
	Value       interface{} `json:"value"`
	ValueSource string      `json:"valueSource"`
	Type        string      `json:"type"`
	Operator    string      `json:"operator"`
	LookupWire  string      `json:"lookupWire"`
	LookupField string      `json:"lookupField"`
}
