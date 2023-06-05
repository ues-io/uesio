package postgresio

import (
	"encoding/json"
	"errors"
	"fmt"
	"strconv"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/meta"
)

type DataScanner struct {
	Item       *meta.Item
	Field      *adapt.FieldMetadata
	References *adapt.ReferenceRegistry
}

func (ds *DataScanner) Scan(src interface{}) error {

	fieldMetadata := ds.Field
	if src == nil {
		return (*ds.Item).SetField(fieldMetadata.GetFullName(), src)
	}

	if fieldMetadata.Type == "MAP" || fieldMetadata.Type == "MULTISELECT" || fieldMetadata.Type == "STRUCT" {
		var mapdata map[string]interface{}
		err := json.Unmarshal([]byte(src.(string)), &mapdata)
		if err != nil {
			return errors.New(fmt.Sprintf("Postgresql %s field Unmarshal error: %s : %s", fieldMetadata.Type, fieldMetadata.GetFullName(), err.Error()))
		}
		return (*ds.Item).SetField(fieldMetadata.GetFullName(), mapdata)
	}
	if fieldMetadata.Type == "LIST" {
		var arraydata []interface{}
		err := json.Unmarshal([]byte(src.(string)), &arraydata)
		if err != nil {
			return errors.New("Postgresql LIST field Unmarshal error: " + fieldMetadata.GetFullName() + " : " + err.Error())
		}
		return (*ds.Item).SetField(fieldMetadata.GetFullName(), arraydata)
	}

	if fieldMetadata.Type == "NUMBER" {
		stringValue := src.(string)
		f, err := strconv.ParseFloat(stringValue, 64)
		if err != nil {
			firstChar := stringValue[0:1]
			lastChar := stringValue[len(stringValue)-1:]
			if firstChar == "\"" && lastChar == "\"" {
				numVal := stringValue[1 : len(stringValue)-1]
				fmt.Println("WARNING: converted string to int: " + numVal)
				return (*ds.Item).SetField(fieldMetadata.GetFullName(), numVal)
			}
			return errors.New("Postgresql number parse error: " + fieldMetadata.GetFullName() + " : " + err.Error())
		}
		return (*ds.Item).SetField(fieldMetadata.GetFullName(), f)
	}

	if adapt.IsReference(fieldMetadata.Type) {

		// Handle foreign key value
		reference, ok := (*ds.References)[fieldMetadata.ReferenceMetadata.Collection]
		if !ok {
			// We couldn't find a reference record here, so just put in the id
			refItem := &adapt.Item{}
			err := refItem.SetField(adapt.ID_FIELD, src)
			if err != nil {
				return err
			}
			return (*ds.Item).SetField(fieldMetadata.GetFullName(), refItem)
		}

		// If we didn't request any additional fields here, then we don't need to
		// do a query, just set the ID field of our reference object
		if len(reference.Fields) == 0 || (len(reference.Fields) == 1 && reference.Fields[0].ID == adapt.ID_FIELD) {
			refItem := &adapt.Item{}
			err := refItem.SetField(adapt.ID_FIELD, src)
			if err != nil {
				return err
			}
			return (*ds.Item).SetField(fieldMetadata.GetFullName(), refItem)
		}

		refKey, ok := src.(string)
		if !ok {
			return errors.New("Invalid reference key returned")
		}

		return reference.AddID(refKey, adapt.ReferenceLocator{
			Item:  *ds.Item,
			Field: fieldMetadata,
		})

	}

	return (*ds.Item).SetField(fieldMetadata.GetFullName(), src)
}
