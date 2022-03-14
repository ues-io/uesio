package datasource

import (
	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/meta/loadable"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func reduceItem(changes, oldData loadable.Item, isNew bool) loadable.Item {

	if isNew {
		return changes
	}

	mergeData := oldData
	changes.Loop(func(s string, i interface{}) error {

		i, err := changes.GetField(s)
		if err != nil {
			return err
		}
		mergeData.SetField(s, i)
		return nil
	})

	return mergeData
}

func populateFormulaField(field *adapt.FieldMetadata) validationFunc {
	return func(change adapt.ChangeItem, isNew bool) error {

		formulaOptions := field.FormulaOptions
		if formulaOptions == nil {
			return nil
		}
		formula := formulaOptions.Formula
		if formula == "" {
			return nil
		}

		mergeData := reduceItem(change.FieldChanges, change.OldValues, isNew)

		value, err := adapt.UesioLanguage.Evaluate(formula, mergeData)
		if err != nil {
			return NewSaveError(change.RecordKey, field.GetFullName(), err.Error())
		}

		err = change.FieldChanges.SetField(field.GetFullName(), value)
		if err != nil {
			return NewSaveError(change.RecordKey, field.GetFullName(), err.Error())
		}

		return nil

	}
}

func getFormulaFunction(collectionMetadata *adapt.CollectionMetadata, session *sess.Session) validationFunc {

	populations := []validationFunc{}
	for _, field := range collectionMetadata.Fields {
		if field.IsFromula {
			populations = append(populations, populateFormulaField(field))
		}
	}

	return func(change adapt.ChangeItem, isNew bool) error {
		for _, population := range populations {
			err := population(change, isNew)
			if err != nil {
				return err
			}
		}
		return nil
	}
}

func EvalFormulaFields(op *adapt.SaveOp, collectionMetadata *adapt.CollectionMetadata, connection adapt.Connection, session *sess.Session) error {

	fieldPopulations := getFormulaFunction(collectionMetadata, session)

	if op.Inserts != nil {
		for i := range *op.Inserts {
			err := fieldPopulations((*op.Inserts)[i], true)
			if err != nil {
				return err
			}
		}
	}

	if op.Updates != nil {
		for i := range *op.Updates {
			err := fieldPopulations((*op.Updates)[i], false)
			if err != nil {
				return err
			}
		}
	}

	return nil
}
