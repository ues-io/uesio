package adapt

import (
	"encoding/json"
	"errors"
	"sort"

	"github.com/thecloudmasters/uesio/pkg/meta"
	"gopkg.in/yaml.v3"
)

type LoadOp struct {
	CollectionName     string                 `json:"collection"`
	WireName           string                 `json:"name"`
	View               string                 `json:"view"`
	Collection         meta.Group             `json:"data"`
	Conditions         []LoadRequestCondition `json:"conditions"`
	Fields             []LoadRequestField     `json:"fields"`
	Query              bool                   `json:"query"`
	Order              []LoadRequestOrder     `json:"order"`
	BatchSize          int                    `json:"batchsize"`
	BatchNumber        int                    `json:"batchnumber"`
	HasMoreBatches     bool                   `json:"more"`
	RequireWriteAccess bool                   `json:"requirewriteaccess"`
	Params             map[string]string      `json:"params"`
	Preloaded          bool                   `json:"preloaded"`
	LoadAll            bool                   `json:"loadAll"`
	DebugQueryString   string                 `json:"debugQueryString"`
	// Internal only conveniences for LoadBots to be able to access metadata
	metadata    *MetadataCache
	integration *meta.Integration
}

type LoadOpWrapper LoadOp

func (op *LoadOp) GetBytes() ([]byte, error) {
	bytes, err := json.Marshal(op)
	if err != nil {
		return nil, err
	}
	return bytes, nil
}

func (op *LoadOp) GetKey() string {
	return op.View + ":" + op.WireName
}

func (op *LoadOp) UnmarshalJSON(data []byte) error {
	op.Collection = &Collection{}
	op.HasMoreBatches = true
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
	op.Collection = &Collection{}
	op.CollectionName = meta.GetNodeValueAsString(node, "collection")
	op.BatchSize = meta.GetNodeValueAsInt(node, "batchsize", 0)
	op.Fields = fields
	op.Conditions = conditions
	op.Order = order
	op.LoadAll = meta.GetNodeValueAsBool(node, "loadAll", false)
	return nil

}

func (op *LoadOp) GetIntegration() (*meta.Integration, error) {
	if op.integration != nil {
		return op.integration, nil
	}
	return nil, errors.New("integration not available on LoadOp")
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

func (op *LoadOp) AttachIntegration(integration *meta.Integration) *LoadOp {
	op.integration = integration
	return op
}

type LoadRequestBatch struct {
	Wires []*LoadOp `json:"wires"`
}

type LoadResponseBatch struct {
	Wires       []*LoadOp                      `json:"wires"`
	Collections map[string]*CollectionMetadata `json:"collections"`
}

type FieldsMap map[string]*FieldMetadata

func (fm *FieldsMap) GetKeys() []string {
	fieldIDIndex := 0
	fieldIDs := make([]string, len(*fm))
	for k := range *fm {
		fieldIDs[fieldIDIndex] = k
		fieldIDIndex++
	}
	return fieldIDs
}

var ID_FIELD = "uesio/core.id"
var UNIQUE_KEY_FIELD = "uesio/core.uniquekey"
var OWNER_FIELD = "uesio/core.owner"
var CREATED_BY_FIELD = "uesio/core.createdby"
var UPDATED_BY_FIELD = "uesio/core.updatedby"
var CREATED_AT_FIELD = "uesio/core.createdat"
var UPDATED_AT_FIELD = "uesio/core.updatedat"
var DYNAMIC_COLLECTION_FIELD = "uesio/core.dynamiccollection"

func (fm *FieldsMap) GetUniqueDBFieldNames(getDBFieldName func(*FieldMetadata) string) ([]string, error) {
	if len(*fm) == 0 {
		return nil, errors.New("No fields selected")
	}
	dbNamesMap := map[string]bool{}
	for _, fieldMetadata := range *fm {
		dbFieldName := getDBFieldName(fieldMetadata)
		dbNamesMap[dbFieldName] = true
	}
	i := 0
	dbNames := make([]string, len(dbNamesMap))
	for k := range dbNamesMap {
		dbNames[i] = k
		i++
	}
	sort.Strings(dbNames)
	return dbNames, nil
}

func (fm *FieldsMap) AddField(fieldMetadata *FieldMetadata) error {
	(*fm)[fieldMetadata.GetFullName()] = fieldMetadata
	return nil
}

func GetFieldsMap(fields []LoadRequestField, collectionMetadata *CollectionMetadata, metadata *MetadataCache) (FieldsMap, ReferenceRegistry, ReferenceGroupRegistry, map[string]*FieldMetadata, error) {
	fieldIDMap := FieldsMap{}
	referencedCollections := ReferenceRegistry{}
	referencedGroupCollections := ReferenceGroupRegistry{}
	formulaFields := map[string]*FieldMetadata{}
	for _, field := range fields {
		fieldMetadata, err := collectionMetadata.GetField(field.ID)
		if err != nil {
			return nil, nil, nil, nil, err
		}

		if fieldMetadata.IsFormula {
			formulaFields[fieldMetadata.GetFullName()] = fieldMetadata
			continue
		}

		err = fieldIDMap.AddField(fieldMetadata)
		if err != nil {
			return nil, nil, nil, nil, err
		}

		if IsReference(fieldMetadata.Type) {
			referencedCollection := fieldMetadata.ReferenceMetadata.Collection

			referencedCollectionMetadata, err := metadata.GetCollection(referencedCollection)
			if err != nil {
				continue
			}

			refReq := referencedCollections.Get(referencedCollection)
			refReq.Metadata = referencedCollectionMetadata

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
	return fieldIDMap, referencedCollections, referencedGroupCollections, formulaFields, nil
}
