package reqs

import "errors"

// LoadResponse struct
type LoadResponse struct {
	Wire       string                   `json:"wire"`
	Collection string                   `json:"collection"`
	Data       []map[string]interface{} `json:"data"`
}

// GetResponseByWireName function
func GetResponseByWireName(responses []LoadResponse, wireName string) (*LoadResponse, error) {
	// Look through the previous wires to find the one to look up on.
	for _, wire := range responses {
		if wire.Wire == wireName {
			return &wire, nil
		}
	}
	return nil, errors.New("Could not find lookup wire")
}
