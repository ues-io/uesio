package adapt

// LoadRequest struct
type LoadRequest struct {
	Collection string                 `json:"collection"`
	Wire       string                 `json:"wire"`
	Type       string                 `json:"type"`
	Fields     []LoadRequestField     `json:"fields"`
	Conditions []LoadRequestCondition `json:"conditions"`
	Order      []LoadRequestOrder     `json:"order"`
	Limit      int                    `json:"limit"`
	Offset     int                    `json:"offset"`
}

// GetCollection function
func (lr *LoadRequest) GetCollection() string {
	return lr.Collection
}

// GetWire function
func (lr *LoadRequest) GetWire() string {
	return lr.Wire
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

// LoadRequestOrder struct
type LoadRequestOrder struct {
	Field string `json:"field"`
	Desc  bool   `json:"desc"`
}
