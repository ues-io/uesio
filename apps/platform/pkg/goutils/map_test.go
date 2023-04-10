package goutils

import (
	"reflect"
	"sort"
	"testing"
)

func TestMapKeys(t *testing.T) {
	type args[K comparable, V any] struct {
		inputMap map[K]V
	}
	type testCase[K comparable, V any] struct {
		name string
		args args[K, V]
		want []K
	}
	tests := []testCase[string, bool]{
		{
			"it should return all keys of the given map",
			args[string, bool]{
				inputMap: map[string]bool{
					"baz": true,
					"foo": true,
					"bar": false,
				},
			},
			[]string{"bar", "baz", "foo"},
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := MapKeys(tt.args.inputMap)
			sort.Strings(got)
			if !reflect.DeepEqual(got, tt.want) {
				t.Errorf("MapKeys() = %v, want %v", got, tt.want)
			}
		})
	}
}
