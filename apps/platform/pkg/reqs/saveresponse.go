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
