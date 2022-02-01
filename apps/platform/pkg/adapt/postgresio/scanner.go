package postgresio

import (
	"encoding/json"
	"errors"
	"strconv"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/meta/loadable"
)

type DataScanner struct {
	Item       *loadable.Item
	Field      *adapt.FieldMetadata
	References *adapt.ReferenceRegistry
	Index      *int
}

func (ds *DataScanner) Scan(src interface{}) error {

	fieldMetadata := ds.Field
	if src == nil {
		return (*ds.Item).SetField(fieldMetadata.GetFullName(), src)
	}

	if fieldMetadata.Type == "MAP" || fieldMetadata.Type == "MULTISELECT" {
		var mapdata map[string]interface{}
		err := json.Unmarshal(src.([]byte), &mapdata)
		if err != nil {
			return errors.New("Postgresql map Unmarshal error: " + fieldMetadata.GetFullName() + " : " + err.Error())
		}
		return (*ds.Item).SetField(fieldMetadata.GetFullName(), mapdata)
	}
	if fieldMetadata.Type == "LIST" {
		var arraydata []interface{}
		err := json.Unmarshal(src.([]byte), &arraydata)
		if err != nil {
			return errors.New("Postgresql map Unmarshal error: " + fieldMetadata.GetFullName() + " : " + err.Error())
		}
		return (*ds.Item).SetField(fieldMetadata.GetFullName(), arraydata)
	}

	if fieldMetadata.Type == "NUMBER" || fieldMetadata.Type == "AUTONUMBER" {
		f, err := strconv.ParseFloat(string(src.([]byte)), 64)
		if err != nil {
			return errors.New("Postgresql number parse error: " + fieldMetadata.GetFullName())
		}
		return (*ds.Item).SetField(fieldMetadata.GetFullName(), f)
	}

	if adapt.IsReference(fieldMetadata.Type) {

		// Handle foreign key value
		reference, ok := (*ds.References)[fieldMetadata.ReferenceMetadata.Collection]
		if !ok {
			// We couldn't find a reference record here, so just put in the id
			refItem := adapt.Item{}
			err := refItem.SetField("uesio.id", src)
			if err != nil {
				return err
			}
			return (*ds.Item).SetField(fieldMetadata.GetFullName(), refItem)
		}

		// If we didn't request any additional fields here, then we don't need to
		// do a query, just set the ID field of our reference object
		if len(reference.Fields) == 0 || (len(reference.Fields) == 1 && reference.Fields[0].ID == "uesio.id") {
			refItem := adapt.Item{}
			err := refItem.SetField(reference.Metadata.IDField, src)
			if err != nil {
				return err
			}
			return (*ds.Item).SetField(fieldMetadata.GetFullName(), refItem)
		}

		reference.AddID(src, adapt.ReferenceLocator{
			RecordIndex: *ds.Index,
			Field:       fieldMetadata,
		})

		return nil
	}

	return (*ds.Item).SetField(fieldMetadata.GetFullName(), src)
}
