package datasource

import (
	"github.com/thecloudmasters/uesio/pkg/reqs"
)

// LoadRequestBatch struct
type LoadRequestBatch struct {
	Wires []reqs.LoadRequest `json:"wires"`
}
