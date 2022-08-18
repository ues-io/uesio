package bulk

import (
	"encoding/csv"
	"errors"
	"io"

	"github.com/dimchansky/utfbom"
	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

type CSVOptions struct {
	Comma rune
}

func processCSV(body io.ReadCloser, spec *meta.JobSpec, metadata *adapt.MetadataCache, session *sess.Session, options *CSVOptions) ([]datasource.SaveRequest, error) {

	r := csv.NewReader(utfbom.SkipOnly(body))
	r.LazyQuotes = true
	if options != nil {
		r.Comma = options.Comma
	}
	changes := adapt.Collection{}

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
			valueGetter = func(data interface{}, mapping *meta.FieldMapping, index int) string {
				return mapping.Value
			}
		}

		if fieldMetadata.Type == "CHECKBOX" {
			loaderFuncs = append(loaderFuncs, getBooleanLoader(index, &mapping, fieldMetadata, valueGetter))
		} else if fieldMetadata.Type == "NUMBER" {
			loaderFuncs = append(loaderFuncs, getNumberLoader(index, &mapping, fieldMetadata, valueGetter))
		} else if fieldMetadata.Type == "REFERENCE" {
			loaderFuncs = append(loaderFuncs, getReferenceLoader(index, &mapping, fieldMetadata, valueGetter))
		} else {
			loaderFuncs = append(loaderFuncs, getTextLoader(index, &mapping, fieldMetadata, valueGetter))
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

		changes = append(changes, &changeRequest)

	}

	return []datasource.SaveRequest{
		{
			Collection: spec.Collection,
			Wire:       "bulkupload",
			Changes:    &changes,
			Options: &adapt.SaveOptions{
				Upsert: true,
			},
		},
	}, nil
}
