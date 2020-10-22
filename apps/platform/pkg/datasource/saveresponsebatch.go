package datasource

import (
	"github.com/thecloudmasters/uesio/pkg/reqs"
)

// SaveResponseBatch struct
type SaveResponseBatch struct {
	Wires []reqs.SaveResponse `json:"wires"`
}
