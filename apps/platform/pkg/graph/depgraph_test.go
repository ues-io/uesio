package graph

import (
	"errors"
	"sort"
	"testing"

	"github.com/stretchr/testify/assert"
)

var justLeaves, oneLevel, multiLevel *DepGraph[string]

func init() {
	justLeaves = NewDepGraph[string]().
		AddNode("water").
		AddNode("soil")
	oneLevel = NewDepGraph[string]().
		AddNode("water").
		AddNode("soil").
		AddNode("grain")
	oneLevel.AddNodeDependency("grain", "water") // grain needs water
	oneLevel.AddNodeDependency("grain", "soil")  // grain needs soil

	multiLevel = NewDepGraph[string]().
		AddNode("water").
		AddNode("soil").
		AddNode("grain").
		AddNode("flour").
		AddNode("chickens").
		AddNode("eggs").
		AddNode("cake")
	multiLevel.AddNodeDependency("cake", "eggs")      // cake needs eggs
	multiLevel.AddNodeDependency("cake", "flour")     // cake needs flour
	multiLevel.AddNodeDependency("eggs", "chickens")  // eggs need chickens
	multiLevel.AddNodeDependency("flour", "grain")    // flour needs grain
	multiLevel.AddNodeDependency("chickens", "grain") // chickens need grain
	multiLevel.AddNodeDependency("grain", "soil")     // grain needs soil
	multiLevel.AddNodeDependency("grain", "water")    // grain needs water
	multiLevel.AddNodeDependency("chickens", "water") // chickens need water
}

func TestDepGraph_TopologicalSort(t *testing.T) {
	type testCase[T comparable] struct {
		name   string
		dg     *DepGraph[T]
		expect [][]T
	}

	tests := []testCase[string]{
		{
			"no dependencies, just leaves",
			justLeaves,
			[][]string{
				{
					"water", "soil",
				},
			},
		},
		{
			"single level of dependencies",
			oneLevel,
			[][]string{
				{
					"water", "soil",
				},
				{
					"grain",
				},
			},
		},
		{
			"multiple levels of dependencies",
			multiLevel,
			[][]string{
				{
					"water", "soil",
				},
				{
					"grain",
				},
				{
					"flour", "chickens",
				},
				{
					"eggs",
				},
				{
					"cake",
				},
			},
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			actual := tt.dg.TopologicalSort()
			assert.Equal(t, len(actual), len(tt.expect))
			for i, v := range tt.expect {
				sort.Strings(actual[i])
				sort.Strings(v)
				assert.Equal(t, actual[i], v)
			}
		})
	}
}

func TestDepGraph_AddNodeDependency_Errors(t *testing.T) {
	type testCase[T comparable] struct {
		name        string
		baseGraph   *DepGraph[T]
		newChild    string
		newParent   string
		expectError error
	}
	tests := []testCase[string]{
		{
			"prevent self-reference",
			justLeaves,
			"water",
			"water",
			errors.New("self-referential dependencies not allowed"),
		},
		{
			"single level of dependencies - prevent circular dependencies",
			oneLevel,
			"water", "grain",
			errors.New("circular dependencies not allowed"),
		},
		{
			"multiple level of dependencies - prevent circular dependencies",
			multiLevel,
			"water", "cake",
			errors.New("circular dependencies not allowed"),
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			assert.Equal(t, tt.expectError, tt.baseGraph.Clone().AddNodeDependency(tt.newChild, tt.newParent))
		})
	}
}
