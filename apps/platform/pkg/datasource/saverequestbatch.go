package datasource

import (
	"github.com/thecloudmasters/uesio/pkg/reqs"
)

// SaveRequestBatch struct
type SaveRequestBatch struct {
	Wires []reqs.SaveRequest `json:"wires"`
}
