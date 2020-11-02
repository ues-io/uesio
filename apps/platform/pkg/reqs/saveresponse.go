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

//ToSaveRequest transforms a SaveResponse to SaveRequest
func (sr *SaveResponse) ToSaveRequest(Collection string) SaveRequest {

	var Sreqt SaveRequest
	Sreqt.Collection = Collection
	Sreqt.Wire = sr.Wire

	for i, chg := range sr.ChangeResults {
		var chreq ChangeRequest
		var m = make(map[string]ChangeRequest)
		chreq = chg.Data
		m[i] = chreq
		Sreqt.Changes = m
	}

	for i, dlt := range sr.DeleteResults {
		var delreq DeleteRequest
		var m = make(map[string]DeleteRequest)
		delreq = dlt.Data
		m[i] = delreq
		Sreqt.Deletes = m
	}

	return Sreqt
}
