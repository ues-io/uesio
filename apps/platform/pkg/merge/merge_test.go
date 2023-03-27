package merge

import (
	"errors"
	"github.com/stretchr/testify/assert"
	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"reflect"
	"regexp"
	"testing"
)

func Test_extractRegexParams(t *testing.T) {
	tests := []struct {
		name          string
		compiledRegex *regexp.Regexp
		template      string
		wantParamsMap map[string]string
	}{
		{
			"empty template",
			RecordMergeRegex,
			"",
			map[string]string{},
		},
		{
			"no matches for the given regex",
			RecordMergeRegex,
			"$Param{foo}",
			map[string]string{},
		},
		{
			"happy path",
			RecordMergeRegex,
			"$Record{blah:uesio/studio.name}",
			map[string]string{
				"wireName":  "blah",
				"fieldName": "uesio/studio.name",
			},
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if gotParamsMap := extractRegexParams(tt.compiledRegex, tt.template); !reflect.DeepEqual(gotParamsMap, tt.wantParamsMap) {
				t.Errorf("extractRegexParams() = %v, want %v", gotParamsMap, tt.wantParamsMap)
			}
		})
	}
}

func Test_serverMergeFuncs(t *testing.T) {

	validItem := adapt.Item{}
	validItem.SetField("uesio/studio.name", "happy")

	tests := []struct {
		name     string
		funcName string
		data     ServerMergeData
		template string
		want     interface{}
		wantErr  error
	}{
		// $Param merges
		{
			"Param: missing param",
			"Param",
			ServerMergeData{
				ParamValues: map[string]string{},
			},
			"foo",
			"",
			errors.New("missing param foo"),
		},
		{
			"Param: valid param",
			"Param",
			ServerMergeData{
				ParamValues: map[string]string{
					"foo": "bar",
				},
			},
			"foo",
			"bar",
			nil,
		},
		// $User merges
		{
			"User: valid user field",
			"User",
			ServerMergeData{
				Session: sess.New(&meta.User{
					FirstName: "Luigi",
					LastName:  "Vampa",
				}, &meta.Site{
					Name: "acme",
				}),
			},
			"firstname",
			"Luigi",
			nil,
		},
		{
			"User: invalid field",
			"User",
			ServerMergeData{
				Session: sess.New(&meta.User{
					FirstName: "Luigi",
					LastName:  "Vampa",
				}, &meta.Site{
					Name: "acme",
				}),
			},
			"foo",
			nil,
			nil,
		},
		// $Site merges
		{
			"Site: valid site field",
			"Site",
			ServerMergeData{
				Session: sess.New(&meta.User{
					FirstName: "Luigi",
					LastName:  "Vampa",
				}, &meta.Site{
					Title: "Acme Inc",
				}),
			},
			"title",
			"Acme Inc",
			nil,
		},
		{
			"Site: invalid field",
			"Site",
			ServerMergeData{
				Session: sess.New(&meta.User{
					FirstName: "Luigi",
					LastName:  "Vampa",
				}, &meta.Site{
					Name: "acme",
				}),
			},
			"foo",
			nil,
			nil,
		},
		// $Record merges
		{
			"Record: no wireName provided",
			"Record",
			ServerMergeData{
				WireData: map[string]meta.Group{},
			},
			"",
			"",
			errors.New("$Record{} merge missing wireName"),
		},
		{
			"Record: no wire available",
			"Record",
			ServerMergeData{
				WireData: map[string]meta.Group{},
			},
			"collection:uesio/studio.name",
			"",
			errors.New("$Record{} merge referenced wire collection, which was not loaded"),
		},
		{
			"Record: no wire data records available",
			"Record",
			ServerMergeData{
				WireData: map[string]meta.Group{
					"collection": &adapt.Collection{},
				},
			},
			"collection:uesio/studio.name",
			"",
			nil,
		},
		{
			"Record: could not get record merge field",
			"Record",
			ServerMergeData{
				WireData: map[string]meta.Group{
					"collection": &adapt.Collection{
						&adapt.Item{},
					},
				},
			},
			"collection:uesio/studio.name",
			"",
			nil,
		},
		{
			"Record: valid merge",
			"Record",
			ServerMergeData{
				WireData: map[string]meta.Group{
					"collection": &adapt.Collection{
						&validItem,
					},
				},
			},
			"collection:uesio/studio.name",
			"happy",
			nil,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			funcValue := ServerMergeFuncs[tt.funcName].(func(data ServerMergeData, m string) (interface{}, error))
			actual, actualErr := funcValue(tt.data, tt.template)
			if tt.wantErr != nil {
				assert.Equal(t, tt.wantErr, actualErr)
			} else {
				assert.Equal(t, tt.want, actual)
			}
		})
	}
}
