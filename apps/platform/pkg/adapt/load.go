package adapt

import (
	"encoding/json"
	"errors"

	"gopkg.in/yaml.v3"

	"github.com/thecloudmasters/uesio/pkg/meta"
)

type LoadOp struct {
	CollectionName     string                 `json:"collection" bot:"collection"`
	WireName           string                 `json:"name"`
	View               string                 `json:"view"`
	Collection         meta.Group             `json:"data"`
	Conditions         []LoadRequestCondition `json:"conditions" bot:"conditions"`
	Fields             []LoadRequestField     `json:"fields,omitempty" bot:"fields"`
	Query              bool                   `json:"query"`
	Order              []LoadRequestOrder     `json:"order,omitempty" bot:"order"`
	BatchSize          int                    `json:"batchsize" bot:"batchsize"`
	BatchNumber        int                    `json:"batchnumber" bot:"batchnumber"`
	HasMoreBatches     bool                   `json:"more"`
	RequireWriteAccess bool                   `json:"requirewriteaccess"`
	Params             map[string]string      `json:"params,omitempty"`
	Preloaded          bool                   `json:"preloaded"`
	LoadAll            bool                   `json:"loadAll" bot:"loadAll"`
	DebugQueryString   string                 `json:"debugQueryString"`
	// Internal only conveniences for LoadBots to be able to access prefetched metadata
	metadata              *MetadataCache
	integrationConnection *IntegrationConnection
}

type LoadOpWrapper LoadOp

func (op *LoadOp) GetBytes() ([]byte, error) {
	return json.Marshal(op)
}

func (op *LoadOp) GetKey() string {
	return op.View + ":" + op.WireName
}

func (op *LoadOp) UnmarshalJSON(data []byte) error {
	op.Collection = &CollectionWithMetadata{}
	return json.Unmarshal(data, (*LoadOpWrapper)(op))
}

func (op *LoadOp) UnmarshalYAML(node *yaml.Node) error {

	init, _ := meta.GetMapNode(node, "init")
	if init != nil {
		op.Query = meta.GetNodeValueAsBool(init, "query", false)
	}

	fields, err := unmarshalFields(node)
	if err != nil {
		return err
	}

	conditions, err := unmarshalConditions(node)
	if err != nil {
		return err
	}

	order, err := unmarshalOrder(node)
	if err != nil {
		return err
	}

	op.RequireWriteAccess = meta.GetNodeValueAsBool(node, "requirewriteaccess", false)
	op.Collection = &CollectionWithMetadata{}
	op.CollectionName = meta.GetNodeValueAsString(node, "collection")
	op.BatchSize = meta.GetNodeValueAsInt(node, "batchsize", 0)
	op.Fields = fields
	op.Conditions = conditions
	op.Order = order
	op.LoadAll = meta.GetNodeValueAsBool(node, "loadAll", false)
	return nil

}

func (op *LoadOp) GetIntegrationConnection() (*IntegrationConnection, error) {
	if op.integrationConnection != nil {
		return op.integrationConnection, nil
	}
	return nil, errors.New("integrationConnection not available on LoadOp")
}

func (op *LoadOp) GetCollectionMetadata() (*CollectionMetadata, error) {
	if op.metadata != nil {
		return op.metadata.GetCollection(op.CollectionName)
	} else {
		return nil, errors.New("no metadata available on LoadOp")
	}
}

func (op *LoadOp) AttachMetadataCache(response *MetadataCache) *LoadOp {
	op.metadata = response
	return op
}

func (op *LoadOp) AttachIntegrationConnection(integrationConnection *IntegrationConnection) *LoadOp {
	op.integrationConnection = integrationConnection
	return op
}

type LoadRequestBatch struct {
	Wires           []*LoadOp `json:"wires"`
	IncludeMetadata bool      `json:"includeMetadata"`
}

type LoadResponseBatch struct {
	Wires       []*LoadOp                      `json:"wires"`
	Collections map[string]*CollectionMetadata `json:"collections,omitempty"`
}

// TrimStructForSerialization removes properties which do not need to be returned to callers
// because the caller provided them and they will not have changed.
func (lr *LoadResponseBatch) TrimStructForSerialization() *LoadResponseBatch {
	for _, wire := range lr.Wires {
		// Need Conditions because the value / inactive properties may have changed
		wire.Order = nil
		wire.Fields = nil
		wire.Params = nil
	}
	return lr
}

var ID_FIELD = "uesio/core.id"
var UNIQUE_KEY_FIELD = "uesio/core.uniquekey"
var OWNER_FIELD = "uesio/core.owner"
var CREATED_BY_FIELD = "uesio/core.createdby"
var UPDATED_BY_FIELD = "uesio/core.updatedby"
var CREATED_AT_FIELD = "uesio/core.createdat"
var UPDATED_AT_FIELD = "uesio/core.updatedat"
var COLLECTION_FIELD = "uesio/core.collection"
