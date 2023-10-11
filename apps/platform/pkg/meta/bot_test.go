package meta

import (
	"github.com/stretchr/testify/assert"
	"testing"
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
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			assert.Equalf(t, tt.want, IsParamRelevant(tt.args.param, tt.args.paramValues), "IsParamRelevant(%v, %v)", tt.args.param, tt.args.paramValues)
		})
	}
}
