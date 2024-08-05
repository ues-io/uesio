package meta

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestNewListenerBot(t *testing.T) {
	type args struct {
		namespace string
		name      string
	}
	tests := []struct {
		name string
		args args
		want *Bot
	}{
		{
			"creates a Listener Bot wrapper",
			args{
				namespace: "luigi/dev",
				name:      "add_numbers",
			},
			&Bot{
				BuiltIn: BuiltIn{},
				BundleableBase: BundleableBase{
					Namespace: "luigi/dev",
					Name:      "add_numbers",
				},
				CollectionRef: "",
				Type:          "LISTENER",
				Dialect:       "",
				Params:        nil,
				FileContents:  "",
			},
		},
	}
	for _, tt := range tests {
		t.Run("it should "+tt.name, func(t *testing.T) {
			assert.Equalf(t, tt.want, NewListenerBot(tt.args.namespace, tt.args.name), "NewListenerBot(%v, %v)", tt.args.namespace, tt.args.name)
		})
	}
}

func TestNewGeneratorBot(t *testing.T) {
	type args struct {
		namespace string
		name      string
	}
	tests := []struct {
		name string
		args args
		want *Bot
	}{
		{
			"creates a Generator Bot wrapper",
			args{
				namespace: "luigi/dev",
				name:      "generate_something",
			},
			&Bot{
				BuiltIn: BuiltIn{},
				BundleableBase: BundleableBase{
					Namespace: "luigi/dev",
					Name:      "generate_something",
				},
				CollectionRef: "",
				Type:          "GENERATOR",
				Dialect:       "",
				Params:        nil,
				FileContents:  "",
			},
		},
	}
	for _, tt := range tests {
		t.Run("it should "+tt.name, func(t *testing.T) {
			assert.Equalf(t, tt.want, NewGeneratorBot(tt.args.namespace, tt.args.name), "NewGeneratorBot(%v, %v)", tt.args.namespace, tt.args.name)
		})
	}
}

func TestIsParamRelevant(t *testing.T) {
	type args struct {
		param       IBotParam
		paramValues map[string]interface{}
	}
	tests := []struct {
		name string
		args args
		want bool
	}{
		{
			"should always process params with no conditions",
			args{
				param: BotParam{
					Name: "foo",
				},
			},
			true,
		},
		{
			"Condition Type = hasValue, value provided",
			args{
				param: BotParam{
					Name: "foo",
					Conditions: []BotParamCondition{
						{
							Type:  "hasValue",
							Param: "foo",
						},
					},
				},
				paramValues: map[string]interface{}{
					"foo": "bar",
				},
			},
			true,
		},
		{
			"Condition Type = hasValue, value NOT provided",
			args{
				param: BotParam{
					Name: "foo",
					Conditions: []BotParamCondition{
						{
							Type:  "hasValue",
							Param: "foo",
						},
					},
				},
				paramValues: map[string]interface{}{},
			},
			false,
		},
		{
			"Condition Type = hasNoValue, value provided",
			args{
				param: BotParam{
					Name: "foo",
					Conditions: []BotParamCondition{
						{
							Type:  "hasNoValue",
							Param: "foo",
						},
					},
				},
				paramValues: map[string]interface{}{
					"foo": "bar",
				},
			},
			false,
		},
		{
			"Condition Type = hasNoValue, value NOT provided",
			args{
				param: BotParam{
					Name: "foo",
					Conditions: []BotParamCondition{
						{
							Type:  "hasNoValue",
							Param: "foo",
						},
					},
				},
				paramValues: map[string]interface{}{},
			},
			true,
		},
		{
			"Condition Type = fieldValue, value match",
			args{
				param: BotParam{
					Name: "foo",
					Conditions: []BotParamCondition{
						{
							Type:  "fieldValue",
							Param: "foo",
							Value: "bar",
						},
					},
				},
				paramValues: map[string]interface{}{
					"foo": "bar",
				},
			},
			true,
		},
		{
			"Condition Type = fieldValue, value does not match",
			args{
				param: BotParam{
					Name: "foo",
					Conditions: []BotParamCondition{
						{
							Type:  "fieldValue",
							Param: "foo",
							Value: "asdfasdf",
						},
					},
				},
				paramValues: map[string]interface{}{
					"foo": "bar",
				},
			},
			false,
		},
		{
			"Condition Type = fieldValue, value not provided",
			args{
				param: BotParam{
					Name: "foo",
					Conditions: []BotParamCondition{
						{
							Type:  "fieldValue",
							Param: "foo",
							Value: "asdfasdf",
						},
					},
				},
				paramValues: map[string]interface{}{},
			},
			false,
		},
		{
			"Condition Type not specified, value match",
			args{
				param: BotParam{
					Name: "foo",
					Conditions: []BotParamCondition{
						{
							Param: "foo",
							Value: "bar",
						},
					},
				},
				paramValues: map[string]interface{}{
					"foo": "bar",
				},
			},
			true,
		},
		{
			"Condition Type not specified, value does not match",
			args{
				param: BotParam{
					Name: "foo",
					Conditions: []BotParamCondition{
						{
							Param: "foo",
							Value: "asdfasdf",
						},
					},
				},
				paramValues: map[string]interface{}{
					"foo": "bar",
				},
			},
			false,
		},
		{
			"Condition Type not specified, value not provided",
			args{
				param: BotParam{
					Name: "foo",
					Conditions: []BotParamCondition{
						{
							Param: "foo",
							Value: "asdfasdf",
						},
					},
				},
				paramValues: map[string]interface{}{},
			},
			false,
		},
		{
			"operator NOT_EQUALS, value match",
			args{
				param: BotParam{
					Name: "foo",
					Conditions: []BotParamCondition{
						{
							Param:    "foo",
							Value:    "bar",
							Operator: "NOT_EQUALS",
						},
					},
				},
				paramValues: map[string]interface{}{
					"foo": "bar",
				},
			},
			false,
		},
		{
			"operator NOT_EQUALS, value does NOT match",
			args{
				param: BotParam{
					Name: "foo",
					Conditions: []BotParamCondition{
						{
							Param:    "foo",
							Value:    "bar",
							Operator: "NOT_EQUALS",
						},
					},
				},
				paramValues: map[string]interface{}{
					"foo": "booo",
				},
			},
			true,
		},
		{
			"operator NOT_IN, none of values match",
			args{
				param: BotParam{
					Name: "foo",
					Conditions: []BotParamCondition{
						{
							Param:    "foo",
							Values:   []interface{}{"bar", "baz"},
							Operator: "NOT_IN",
						},
					},
				},
				paramValues: map[string]interface{}{
					"foo": "jjjjjjj",
				},
			},
			true,
		},
		{
			"operator NOT_IN, one of values matches",
			args{
				param: BotParam{
					Name: "foo",
					Conditions: []BotParamCondition{
						{
							Param:    "foo",
							Values:   []interface{}{"bar", "baz"},
							Operator: "NOT_IN",
						},
					},
				},
				paramValues: map[string]interface{}{
					"foo": "baz",
				},
			},
			false,
		},
		{
			"operator IN, none of values match",
			args{
				param: BotParam{
					Name: "foo",
					Conditions: []BotParamCondition{
						{
							Param:    "foo",
							Values:   []interface{}{"bar", "baz"},
							Operator: "IN",
						},
					},
				},
				paramValues: map[string]interface{}{
					"foo": "jjjjjjj",
				},
			},
			false,
		},
		{
			"operator IN, one of values matches",
			args{
				param: BotParam{
					Name: "foo",
					Conditions: []BotParamCondition{
						{
							Param:    "foo",
							Values:   []interface{}{"bar", "baz"},
							Operator: "IN",
						},
					},
				},
				paramValues: map[string]interface{}{
					"foo": "baz",
				},
			},
			true,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			assert.Equalf(t, tt.want, IsParamRelevant(tt.args.param, tt.args.paramValues), "IsParamRelevant(%v, %v)", tt.args.param, tt.args.paramValues)
		})
	}
}

func TestBotCollectionPathFilter(t *testing.T) {
	bc := BotCollection{}
	type args struct {
		path           string
		conditions     BundleConditions
		definitionOnly bool
	}
	tests := []struct {
		name string
		args args
		want bool
	}{
		{
			"empty path- no match",
			args{
				path:       "",
				conditions: BundleConditions{},
			},
			false,
		},
		{
			"type condition provided, does not match",
			args{
				path: "listener/luigi/foo/bar/bot.yaml",
				conditions: BundleConditions{
					"uesio/studio.type": "GENERATOR",
				},
			},
			false,
		},
		{
			"type condition provided, matches",
			args{
				path: "listener/add_numbers/bot.yaml",
				conditions: BundleConditions{
					"uesio/studio.type": "LISTENER",
				},
			},
			true,
		},
		{
			"multi-value type condition provided, matches",
			args{
				path: "listener/add_numbers/bot.yaml",
				conditions: BundleConditions{
					"uesio/studio.type": []interface{}{
						"LISTENER",
						"GENERATOR",
					},
				},
			},
			true,
		},
		{
			"multi-value type condition provided, no match",
			args{
				path: "listener/add_numbers/bot.yaml",
				conditions: BundleConditions{
					"uesio/studio.type": []string{
						"BEFORESAVE",
						"GENERATOR",
					},
				},
			},
			false,
		},
		{
			"type condition provided, matches, non-definition file",
			args{
				path: "listener/add_numbers/bot.ts",
				conditions: BundleConditions{
					"uesio/studio.type": "LISTENER",
				},
			},
			true,
		},
		{
			"type condition provided, matches, non-definition file, definitionOnly requested",
			args{
				path: "listener/add_numbers/bot.ts",
				conditions: BundleConditions{
					"uesio/studio.type": "LISTENER",
				},
				definitionOnly: true,
			},
			false,
		},
		{
			"type condition provided, matches, definition file, definitionOnly requested",
			args{
				path: "listener/add_numbers/bot.yaml",
				conditions: BundleConditions{
					"uesio/studio.type": "LISTENER",
				},
				definitionOnly: true,
			},
			true,
		},
		{
			"no collection condition value in BundleConditions - should match",
			args{
				path: "beforesave/uesio/foo/bar/before_save_bar/bot.yaml",
				conditions: BundleConditions{
					"uesio/studio.type": "BEFORESAVE",
				},
			},
			true,
		},
		{
			"bad condition value in BundleConditions - don't count as match",
			args{
				path: "beforesave/uesio/foo/bar/before_save_bar/bot.yaml",
				conditions: BundleConditions{
					"uesio/studio.type":       "BEFORESAVE",
					"uesio/studio.collection": -1234,
				},
			},
			false,
		},
		{
			"single-value collection condition value in BundleConditions - matches",
			args{
				path: "beforesave/uesio/foo/bar/before_save_bar/bot.yaml",
				conditions: BundleConditions{
					"uesio/studio.type":       "BEFORESAVE",
					"uesio/studio.collection": "uesio/foo.bar",
				},
			},
			true,
		},
		{
			"single-value collection condition value in BundleConditions - does not match",
			args{
				path: "beforesave/uesio/foo/bar/before_save_bar/bot.yaml",
				conditions: BundleConditions{
					"uesio/studio.type":       "BEFORESAVE",
					"uesio/studio.collection": "luigi/foo.bar",
				},
			},
			false,
		},
		{
			"multi-value collection condition value in BundleConditions - matches",
			args{
				path: "beforesave/uesio/foo/bar/before_save_bar/bot.yaml",
				conditions: BundleConditions{
					"uesio/studio.type": "BEFORESAVE",
					"uesio/studio.collection": []string{
						"uesio/crm.account",
						"uesio/foo.bar",
					},
				},
			},
			true,
		},
		{
			"multi-value collection condition value in BundleConditions - does not match",
			args{
				path: "aftersave/uesio/foo/bar/after_save_bar/bot.yaml",
				conditions: BundleConditions{
					"uesio/studio.type": "AFTERSAVE",
					"uesio/studio.collection": []string{
						"uesio/crm.account",
						"uesio/crm.contact",
					},
				},
			},
			false,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			assert.Equalf(t, tt.want, bc.FilterPath(tt.args.path, tt.args.conditions, tt.args.definitionOnly), "BotCollection.FilterPath(%v, %v, %v)", tt.args.path, tt.args.conditions, tt.args.definitionOnly)
		})
	}
}

func TestBot_ValidateParams(t *testing.T) {
	tests := []struct {
		name            string
		params          BotParams
		input           map[string]interface{}
		wantErr         string
		bundleLoader    BundleLoader
		inputAssertions func(t *testing.T, input map[string]interface{})
	}{
		{
			name: "should enforce required fields",
			params: []BotParam{
				{
					Name:     "foo",
					Required: true,
				},
			},
			input:   map[string]interface{}{},
			wantErr: "missing required param: foo",
		},
		{
			name: "should validate number fields",
			params: []BotParam{
				{
					Name:     "foo",
					Required: true,
					Type:     "NUMBER",
				},
			},
			input: map[string]interface{}{
				"foo": "abcdef",
			},
			wantErr: "could not convert param to number: foo",
		},
		{
			name: "should coerce valid number fields in the input",
			params: []BotParam{
				{
					Name:     "foo",
					Required: true,
					Type:     "NUMBER",
				},
				{
					Name:     "bar",
					Required: true,
					Type:     "NUMBER",
				},
			},
			input: map[string]interface{}{
				"foo": 1.34,
				"bar": "7.89",
			},
			wantErr: "",
			inputAssertions: func(t *testing.T, input map[string]interface{}) {
				assert.Equalf(t, 1.34, input["foo"], "expected value for foo")
				assert.Equalf(t, 7.89, input["bar"], "expected value for bar")
			},
		},
		{
			name: "should validate CHECKBOX fields",
			params: []BotParam{
				{
					Name:     "foo",
					Required: true,
					Type:     "CHECKBOX",
				},
			},
			input: map[string]interface{}{
				"foo": "blah",
			},
			wantErr: "param value must either be 'true' or 'false': foo",
		},
		{
			name: "should validate CHECKBOX fields (valid case)",
			params: []BotParam{
				{
					Name:     "foo",
					Required: true,
					Type:     "CHECKBOX",
				},
				{
					Name:     "bar",
					Required: true,
					Type:     "CHECKBOX",
				},
			},
			input: map[string]interface{}{
				"foo": "true",
				"bar": "false",
				"goo": true,
				"hoo": false,
			},
			wantErr: "",
		},
		{
			name: "should error if SELECT param has no SelectList defined",
			params: []BotParam{
				{
					Name:     "foo",
					Required: true,
					Type:     "SELECT",
				},
			},
			input: map[string]interface{}{
				"foo": "blah",
			},
			wantErr: "no Select List provided for SELECT parameter: foo",
		},
		{
			name: "should validate SELECT params (invalid case)",
			params: []BotParam{
				{
					Name:       "foo",
					Required:   true,
					Type:       "SELECT",
					SelectList: "luigi/some.selectlist",
				},
			},
			input: map[string]interface{}{
				"foo": "alpha",
			},
			wantErr: "invalid value for param: foo",
			bundleLoader: func(item BundleableItem) error {
				selectList := item.(*SelectList)
				selectList.Options = []SelectListOption{
					{
						Value: "one",
					},
					{
						Value: "two",
					},
				}
				return nil
			},
		},
		{
			name: "should validate SELECT params (valid case)",
			params: []BotParam{
				{
					Name:       "foo",
					Required:   true,
					Type:       "SELECT",
					SelectList: "luigi/some.selectlist",
				},
			},
			input: map[string]interface{}{
				"foo": "two",
			},
			wantErr: "",
			bundleLoader: func(item BundleableItem) error {
				selectList := item.(*SelectList)
				selectList.Options = []SelectListOption{
					{
						Value: "one",
					},
					{
						Value: "two",
					},
				}
				return nil
			},
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			b := &Bot{
				Params: tt.params,
			}
			err := b.ValidateParams(tt.input, tt.bundleLoader)
			if tt.wantErr != "" {
				if err == nil {
					assert.Fail(t, "expected error "+tt.wantErr, tt.name)
				} else {
					assert.Equalf(t, tt.wantErr, err.Error(), tt.name)
				}
			} else {
				if err != nil {
					assert.Fail(t, "no error expected, but got: "+err.Error(), tt.name)
				}
			}
			if tt.inputAssertions != nil {
				tt.inputAssertions(t, tt.input)
			}
		})
	}
}
