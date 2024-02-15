package wire

import (
	"encoding/json"
	"errors"
	"slices"

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
	GroupBy            []LoadRequestField     `json:"groupby,omitempty" bot:"groupby"`
	Query              bool                   `json:"query"`
	Order              []LoadRequestOrder     `json:"order,omitempty" bot:"order"`
	BatchSize          int                    `json:"batchsize" bot:"batchsize"`
	BatchNumber        int                    `json:"batchnumber" bot:"batchnumber"`
	HasMoreBatches     bool                   `json:"more"`
	RequireWriteAccess bool                   `json:"requirewriteaccess"`
	Params             map[string]interface{} `json:"params,omitempty"`
	Preloaded          bool                   `json:"preloaded"`
	LoadAll            bool                   `json:"loadAll" bot:"loadAll"`
	DebugQueryString   string                 `json:"debugQueryString"`
	ViewOnly           bool                   `json:"viewOnly,omitempty"`
	Aggregate          bool                   `json:"aggregate,omitempty"`
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
	op.ViewOnly = meta.GetNodeValueAsBool(node, "viewOnly", false)
	op.Aggregate = meta.GetNodeValueAsBool(node, "aggregate", false)

	if op.Aggregate {
		groupby, err := unmarshalGroupBy(node)
		if err != nil {
			return err
		}
		op.GroupBy = groupby
	}
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
	SelectLists map[string]*SelectListMetadata `json:"selectlists,omitempty"`
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

type AggregationField struct {
	Metadata *FieldMetadata
	Function string
}

type FieldsResponse struct {
	LoadFields                 map[string]*FieldMetadata
	FormulaFields              map[string]*FieldMetadata
	AggregationFields          []AggregationField
	GroupByFields              []AggregationField
	ReferencedColletions       ReferenceRegistry
	ReferencedGroupCollections ReferenceGroupRegistry
}

func GetUniqueDBFieldNames(fieldsMap map[string]*FieldMetadata, getDBFieldName func(*FieldMetadata) string) ([]string, error) {
	if len(fieldsMap) == 0 {
		return nil, errors.New("No fields selected")
	}

	i := 0
	dbNames := make([]string, len(fieldsMap))
	for _, fieldMetadata := range fieldsMap {
		dbNames[i] = getDBFieldName(fieldMetadata)
		i++
	}
	slices.Sort(dbNames)
	return dbNames, nil
}

func GetFieldsResponse(op *LoadOp, collectionMetadata *CollectionMetadata, metadata *MetadataCache) (*FieldsResponse, error) {
	fieldIDMap := map[string]*FieldMetadata{}
	referencedCollections := ReferenceRegistry{}
	referencedGroupCollections := ReferenceGroupRegistry{}
	formulaFields := map[string]*FieldMetadata{}
	aggregateFields := []AggregationField{}
	groupByFields := []AggregationField{}
	for _, field := range op.Fields {
		if field.ViewOnlyMetadata != nil {
			continue
		}
		fieldMetadata, err := collectionMetadata.GetField(field.ID)
		if err != nil {
			return nil, err
		}

		if fieldMetadata.IsFormula {
			formulaFields[fieldMetadata.GetFullName()] = fieldMetadata
			continue
		}

		if op.Aggregate {
			aggregateFields = append(aggregateFields, AggregationField{
				Function: field.Function,
				Metadata: fieldMetadata,
			})
			continue
		}

		fieldIDMap[fieldMetadata.GetFullName()] = fieldMetadata

		if IsReference(fieldMetadata.Type) {

			referencedCollection := fieldMetadata.ReferenceMetadata.GetCollection()
			referencedCollectionMetadata, err := metadata.GetCollection(referencedCollection)
			if err != nil {
				continue
			}

			refReq := referencedCollections.Get(referencedCollection)
			refReq.Metadata = referencedCollectionMetadata

			refReq.AddRefField(fieldMetadata)

			if referencedCollectionMetadata.Integration != collectionMetadata.Integration {
				continue
			}
			refReq.AddFields(field.Fields)
		}

		if fieldMetadata.Type == "REFERENCEGROUP" {
			referencedCollection := fieldMetadata.ReferenceGroupMetadata.Collection
			referencedCollectionMetadata, err := metadata.GetCollection(referencedCollection)
			if err != nil {
				continue
			}
			refReq := referencedGroupCollections.Add(referencedCollection, fieldMetadata, referencedCollectionMetadata)
			if referencedCollectionMetadata.Integration != collectionMetadata.Integration {
				continue
			}
			refReq.AddFields(field.Fields)
		}

	}

	if op.Aggregate {
		for _, field := range op.GroupBy {
			if field.ViewOnlyMetadata != nil {
				continue
			}
			fieldMetadata, err := collectionMetadata.GetField(field.ID)
			if err != nil {
				return nil, err
			}

			groupByFields = append(groupByFields, AggregationField{
				Function: field.Function,
				Metadata: fieldMetadata,
			})

		}
	}
	return &FieldsResponse{
		LoadFields:                 fieldIDMap,
		FormulaFields:              formulaFields,
		ReferencedColletions:       referencedCollections,
		ReferencedGroupCollections: referencedGroupCollections,
		AggregationFields:          aggregateFields,
		GroupByFields:              groupByFields,
	}, nil
}
