package postgresio

import (
	"encoding/json"
	"errors"
	"strconv"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/meta"
)

var scanMap = pgtype.NewMap()

type JSONNumber float64

func (num *JSONNumber) UnmarshalJSON(b []byte) error {
	if b[0] != '"' {
		return json.Unmarshal(b, (*float64)(num))
	}
	var s string
	if err := json.Unmarshal(b, &s); err != nil {
		return err
	}

	if s == "" {
		return nil
	}

	val, err := strconv.ParseFloat(s, 64)
	if err != nil {
		return err
	}
	*num = JSONNumber(val)
	return nil
}

func init() {
	var arraydata []interface{}
	scanMap.RegisterDefaultPgType(&arraydata, "json")
	var mapdata map[string]interface{}
	scanMap.RegisterDefaultPgType(&mapdata, "json")
	var numberdata JSONNumber
	scanMap.RegisterDefaultPgType(&numberdata, "json")
}

type ScanFunc func(src interface{}) (interface{}, error)

type DataScanner struct {
	ScannerFunc ScanFunc
	Item        *meta.Item
	Field       *adapt.FieldMetadata
}

func NewDataScanner(scanFunc ScanFunc, item *meta.Item, field *adapt.FieldMetadata) *DataScanner {
	return &DataScanner{ScannerFunc: scanFunc, Item: item, Field: field}
}

func (s *DataScanner) Scan(src interface{}) error {
	if src == nil {
		return (*s.Item).SetField(s.Field.GetFullName(), src)
	}
	value, err := s.ScannerFunc(src)
	if err != nil {
		return err
	}
	return (*s.Item).SetField(s.Field.GetFullName(), value)
}

func ScanJSON(dest, src interface{}) error {
	scanner := scanMap.SQLScanner(dest)
	err := scanner.Scan(src)
	if err != nil {
		return err
	}
	return nil
}

func ScanList(src interface{}) (interface{}, error) {
	var listdata []interface{}
	return &listdata, ScanJSON(&listdata, src)
}

func ScanMap(src interface{}) (interface{}, error) {
	var mapdata map[string]interface{}
	return &mapdata, ScanJSON(&mapdata, src)
}

func ScanNumber(src interface{}) (interface{}, error) {
	var numberdata JSONNumber
	err := ScanJSON(&numberdata, src)
	if err != nil {
		return nil, err
	}
	floatdata := float64(numberdata)
	return &floatdata, nil
}

func ScanReference(src interface{}) (interface{}, error) {
	refItem := &adapt.Item{}
	err := refItem.SetField(adapt.ID_FIELD, src)
	if err != nil {
		return nil, err
	}
	return refItem, nil
}

func ScanDefault(src interface{}) (interface{}, error) {
	return src, nil
}

func getScanners(item *meta.Item, rows pgx.Rows, fieldMap adapt.FieldsMap, referencedCollections *adapt.ReferenceRegistry) []interface{} {
	cols := rows.FieldDescriptions()
	scanners := make([]interface{}, len(cols))
	for i, col := range cols {
		scanners[i] = getScanner(item, fieldMap[string(col.Name)], referencedCollections)
	}
	return scanners
}

func getScanner(item *meta.Item, fieldMetadata *adapt.FieldMetadata, referencedCollections *adapt.ReferenceRegistry) interface{} {
	if adapt.IsReference(fieldMetadata.Type) {
		// Handle foreign key value
		reference, ok := (*referencedCollections)[fieldMetadata.ReferenceMetadata.Collection]
		if !ok {
			// We couldn't find a reference record here, so just put in the id
			return NewDataScanner(ScanReference, item, fieldMetadata)
		}
		// If we didn't request any additional fields here, then we don't need to
		// do a query, just set the ID field of our reference object
		if len(reference.Fields) == 0 || (len(reference.Fields) == 1 && reference.Fields[0].ID == adapt.ID_FIELD) {
			return NewDataScanner(ScanReference, item, fieldMetadata)
		}
		return &ReferenceScanner{
			Item:      item,
			Field:     fieldMetadata,
			Reference: reference,
		}
	}
	switch fieldMetadata.Type {
	case "LIST":
		return NewDataScanner(ScanList, item, fieldMetadata)
	case "MAP", "MULTISELECT", "STRUCT":
		return NewDataScanner(ScanMap, item, fieldMetadata)
	case "NUMBER":
		return NewDataScanner(ScanNumber, item, fieldMetadata)
	default:
		return NewDataScanner(ScanDefault, item, fieldMetadata)
	}
}

type ReferenceScanner struct {
	Item      *meta.Item
	Field     *adapt.FieldMetadata
	Reference *adapt.ReferenceRequest
}

func (rs *ReferenceScanner) Scan(src interface{}) error {

	fieldMetadata := rs.Field
	if src == nil {
		return (*rs.Item).SetField(fieldMetadata.GetFullName(), src)
	}

	refKey, ok := src.(string)
	if !ok {
		return errors.New("Invalid reference key returned")
	}

	return rs.Reference.AddID(refKey, adapt.ReferenceLocator{
		Item:  *rs.Item,
		Field: fieldMetadata,
	})

}
