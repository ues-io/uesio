package featureflagstore

import (
	"github.com/thecloudmasters/uesio/pkg/meta"
	"testing"
)

func TestValidateValue(t *testing.T) {
	tests := []struct {
		name    string
		ff      *meta.FeatureFlag
		value   any
		isValid bool
		wantErr string
	}{
		{
			"nil value provided",
			&meta.FeatureFlag{},
			nil,
			false,
			"no value provided",
		},
		{
			"NUMBER: not a float64 type, should reject",
			&meta.FeatureFlag{
				Type: "NUMBER",
			},
			"fffasdfa",
			false,
			"value must be a number",
		},
		{
			"NUMBER: no min/max, should allow any number",
			&meta.FeatureFlag{
				Type: "NUMBER",
			},
			float64(44),
			true,
			"",
		},
		{
			"NUMBER: no min/max, should allow 0",
			&meta.FeatureFlag{
				Type: "NUMBER",
			},
			float64(0),
			true,
			"",
		},
		{
			"NUMBER: min/max defined, number on lower bound",
			&meta.FeatureFlag{
				Type: "NUMBER",
				Min:  0,
				Max:  100,
			},
			float64(0),
			true,
			"",
		},
		{
			"NUMBER: min/max defined, number on upper bound",
			&meta.FeatureFlag{
				Type: "NUMBER",
				Min:  0,
				Max:  100,
			},
			float64(100),
			true,
			"",
		},
		{
			"NUMBER: min/max defined, number in range",
			&meta.FeatureFlag{
				Type: "NUMBER",
				Min:  0,
				Max:  100,
			},
			float64(10),
			true,
			"",
		},
		{
			"NUMBER: min/max defined, number too low",
			&meta.FeatureFlag{
				Type: "NUMBER",
				Min:  0,
				Max:  100,
			},
			float64(-1),
			false,
			"value must be greater than 0",
		},
		{
			"NUMBER: min/max defined, number too high",
			&meta.FeatureFlag{
				Type: "NUMBER",
				Min:  0,
				Max:  100,
			},
			float64(101),
			false,
			"value must be less than 100",
		},
		{
			"CHECKBOX: non boolean value",
			&meta.FeatureFlag{
				Type: "CHECKBOX",
			},
			"pizza",
			false,
			"invalid value, must be either true or false",
		},
		{
			"CHECKBOX: valid boolean value - true",
			&meta.FeatureFlag{
				Type: "CHECKBOX",
			},
			true,
			true,
			"",
		},
		{
			"CHECKBOX: valid boolean value - false",
			&meta.FeatureFlag{
				Type: "CHECKBOX",
			},
			false,
			true,
			"",
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			isValidActual, err := ValidateValue(tt.ff, tt.value)
			if tt.isValid != isValidActual {
				t.Errorf("ValidateValue() expected to be valid, but wasn't %s", tt.name)
				return
			}
			if tt.wantErr != "" && err.Error() != tt.wantErr {
				t.Errorf("ValidateValue() expected error = %s, actual error %s", tt.wantErr, err.Error())
				return
			}
		})
	}
}
