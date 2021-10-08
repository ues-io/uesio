package bulk

import (
	"encoding/csv"
	"io"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

type CSVOptions struct {
	Comma rune
}

func processCSV(body io.ReadCloser, spec *meta.JobSpec, metadata *adapt.MetadataCache, session *sess.Session, options *CSVOptions) ([]datasource.SaveRequest, error) {

	r := csv.NewReader(body)
	if options != nil {
		r.Comma = options.Comma
	}
	changes := adapt.Collection{}
	lookups := []adapt.Lookup{}

	// Handle the header row
	headerRow, err := r.Read()
	if err != nil {
		return nil, err
	}

	collectionMetadata, err := metadata.GetCollection(spec.Collection)
	if err != nil {
		return nil, err
	}

	loaderFuncs := []loaderFunc{}

	getValue := func(data interface{}, mapping *meta.FieldMapping, index int) string {
		record := data.([]string)
		return record[index]
	}

	for index, columnName := range headerRow {
		// First check to see if there is a mapping defined for this column
		mapping, ok := spec.Mappings[columnName]
		if !ok {
			// If a mapping wasn't provided for a field, check to see if it is an exact match
			_, err := collectionMetadata.GetField(columnName)
			if err != nil {
				// Skip this column
				continue
			}
			mapping = meta.FieldMapping{
				FieldName: columnName,
			}
		}

		fieldMetadata, err := collectionMetadata.GetField(mapping.FieldName)
		if err != nil {
			return nil, err
		}

		if fieldMetadata.Type == "CHECKBOX" {
			loaderFuncs = append(loaderFuncs, getBooleanLoader(index, &mapping, fieldMetadata, getValue))
		} else if fieldMetadata.Type == "REFERENCE" {
			if mapping.MatchField != "" {
				lookups = append(lookups, adapt.Lookup{
					RefField:      mapping.FieldName,
					MatchField:    mapping.MatchField,
					MatchTemplate: "${" + mapping.MatchField + "}",
				})
			}
			refCollectionMetadata, err := metadata.GetCollection(fieldMetadata.ReferencedCollection)
			if err != nil {
				return nil, err
			}

			if mapping.MatchField == "" {
				mapping.MatchField = refCollectionMetadata.NameField
			}

			loaderFuncs = append(loaderFuncs, getReferenceLoader(index, &mapping, fieldMetadata, getValue))
		} else {
			loaderFuncs = append(loaderFuncs, getTextLoader(index, &mapping, fieldMetadata, getValue))
		}

	}

	for {
		record, err := r.Read()
		if err == io.EOF {
			break
		}
		if err != nil {
			return nil, err
		}

		changeRequest := adapt.Item{}

		for _, loaderFunc := range loaderFuncs {
			loaderFunc(changeRequest, record)
		}

		changes = append(changes, changeRequest)

	}

	return []datasource.SaveRequest{
		{
			Collection: spec.Collection,
			Wire:       "bulkupload",
			Changes:    &changes,
			Options: &adapt.SaveOptions{
				Upsert: &adapt.UpsertOptions{
					MatchField:    spec.UpsertKey,
					MatchTemplate: "${" + spec.UpsertKey + "}",
				},
				Lookups: lookups,
			},
		},
	}, nil
}
