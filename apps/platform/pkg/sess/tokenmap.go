package sess

type TokenMap map[string][]TokenValue

type TokenValue struct {
	Value  string
	Reason string
}

func (tm *TokenMap) Add(name string, value []TokenValue) {
	(*tm)[name] = value
}

func (tm *TokenMap) Has(name string) bool {
	_, ok := (*tm)[name]
	return ok
}

func (tm *TokenMap) Flatten() []string {
	flatTokens := []string{}
	for name, tokenvalues := range *tm {
		for _, tokenvalue := range tokenvalues {
			flatTokens = append(flatTokens, name+":"+tokenvalue.Value)
		}
	}
	return flatTokens
}
