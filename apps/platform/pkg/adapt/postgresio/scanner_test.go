package postgresio

import (
	"fmt"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestScanner(t *testing.T) {

	type testCase struct {
		description  string
		scanner      ScanFunc
		input        interface{}
		expectOutput interface{}
		expectErr    error
	}

	var tests = []testCase{
		{
			"Number - Normal",
			ScanNumber,
			"8",
			float64(8),
			nil,
		},
		{
			"Number - Zero",
			ScanNumber,
			"0",
			float64(0),
			nil,
		},
		{
			"Number - Null",
			ScanNumber,
			"null",
			nil,
			nil,
		},
		{
			"Number - String",
			ScanNumber,
			"\"8\"",
			float64(8),
			nil,
		},
		{
			"Number - Empty String",
			ScanNumber,
			"\"\"",
			nil,
			nil,
		},
		{
			"List - Empty",
			ScanList,
			"[]",
			[]interface{}{},
			nil,
		},
		{
			"List - Strings",
			ScanList,
			"[\"foo\",\"bar\"]",
			[]interface{}{"foo", "bar"},
			nil,
		},
		{
			"List - Numbers",
			ScanList,
			"[1,2]",
			[]interface{}{float64(1), float64(2)},
			nil,
		},
		{
			"Map - Strings",
			ScanMap,
			"{\"foo\":\"bar\"}",
			map[string]interface{}{"foo": "bar"},
			nil,
		},
	}

	for _, tc := range tests {
		t.Run("it should "+tc.description, func(t *testing.T) {

			value, err := tc.scanner(tc.input)
			if tc.expectErr != nil {
				if tc.expectErr.Error() != err.Error() {
					t.Errorf("Expected failure %s but got %s", tc.expectErr.Error(), err.Error())
				}
			} else {
				if err != nil {
					t.Errorf("Unexpected error: %s", err.Error())
				}

				floatValue, ok := value.(*float64)
				if ok {
					fmt.Println(*floatValue)
				}

				assert.Equal(t, tc.expectOutput, value)

			}

		})
	}
}
