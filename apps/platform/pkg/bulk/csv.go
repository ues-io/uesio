package bulk

import (
	"encoding/csv"
	"errors"
	"io"

	"github.com/dimchansky/utfbom"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

type CSVOptions struct {
	Comma rune
}

func processCSV(body io.ReadCloser, spec *meta.JobSpec, metadata *wire.MetadataCache, session *sess.Session, options *CSVOptions) ([]datasource.SaveRequest, error) {

	r := csv.NewReader(utfbom.SkipOnly(body))
	r.LazyQuotes = true
	if options != nil {
		r.Comma = options.Comma
	}
	changes := wire.Collection{}

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

	getValue := func(data any, mapping *meta.FieldMapping, index int) string {
		record := data.([]string)
		return record[index]
	}

	columnIndexes := map[string]int{}

	// If no spec was provided, create a barebones spec based on columnNames
	autoCreateMappings := spec.Mappings == nil
	if autoCreateMappings {
		spec.Mappings = map[string]meta.FieldMapping{}
	}

	for index, columnName := range headerRow {
		if autoCreateMappings {
			fieldMetadata, err := collectionMetadata.GetField(columnName)
			if err != nil {
				continue
			}
			spec.Mappings[fieldMetadata.GetFullName()] = meta.FieldMapping{
				ColumnName: columnName,
			}
		}
		columnIndexes[columnName] = index
	}

	for fieldName := range spec.Mappings {
		mapping := spec.Mappings[fieldName]

		var valueGetter valueFunc
		index := 0

		fieldMetadata, err := collectionMetadata.GetField(fieldName)
		if err != nil {
			return nil, err
		}

		if mapping.Type == "" || mapping.Type == "IMPORT" {
			if mapping.ColumnName == "" {
				mapping.ColumnName = fieldName
			}
			colIndex, ok := columnIndexes[mapping.ColumnName]
			if !ok {
				return nil, errors.New("Invalid Column Name for Import: " + mapping.ColumnName)
			}
			index = colIndex
			valueGetter = getValue
		} else if mapping.Type == "VALUE" {
			if mapping.Value == "" {
				return nil, errors.New("No Value Provided for mapping: " + fieldName)
			}
			valueGetter = func(data any, mapping *meta.FieldMapping, index int) string {
				return mapping.Value
			}
		}

		var loader func(index int, mapping *meta.FieldMapping, fieldMetadata *wire.FieldMetadata, getValue valueFunc) loaderFunc

		switch fieldMetadata.Type {
		case "CHECKBOX":
			loader = getBooleanLoader
		case "NUMBER":
			loader = getNumberLoader
		case "REFERENCE", "USER":
			loader = getReferenceLoader
		case "DATE":
			loader = getDateLoader
		case "TIMESTAMP":
			loader = getTimestampLoader
		case "MULTISELECT":
			loader = getMultiSelectLoader
		case "MAP":
			loader = getMapLoader
		case "LIST":
			loader = getListLoader
		case "STRUCT":
			loader = getStructLoader
		default:
			loader = getTextLoader
		}
		loaderFuncs = append(loaderFuncs, loader(index, &mapping, fieldMetadata, valueGetter))
	}

	for {
		record, err := r.Read()
		if err == io.EOF {
			break
		}
		if err != nil {
			return nil, err
		}

		changeRequest := wire.Item{}

		for _, loaderFunc := range loaderFuncs {
			err := loaderFunc(changeRequest, record)
			if err != nil {
				return nil, err
			}
		}

		changes = append(changes, &changeRequest)

	}

	return []datasource.SaveRequest{
		{
			Collection: spec.Collection,
			Wire:       "bulkupload",
			Changes:    &changes,
			Options: &wire.SaveOptions{
				Upsert: true,
			},
		},
	}, nil
}
