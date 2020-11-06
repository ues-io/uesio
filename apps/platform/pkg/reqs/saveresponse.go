package reqs

// SaveResponse struct
type SaveResponse struct {
	Wire          string                  `json:"wire"`
	Error         string                  `json:"error"`
	ChangeResults map[string]ChangeResult `json:"changeResults"`
	DeleteResults map[string]ChangeResult `json:"deleteResults"`
}

// ChangeResult struct
type ChangeResult struct {
	Data  map[string]interface{} `json:"data"`
	Error string                 `json:"error"`
}

// NewChangeResult create a new change result struct and copies the change request data in
func NewChangeResult(change ChangeRequest) ChangeResult {
	changeCopy := map[string]interface{}{}
	for k, v := range change {
		changeCopy[k] = v
	}
	return ChangeResult{
		Data: changeCopy,
	}
}
