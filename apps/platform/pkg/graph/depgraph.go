package graph

import (
	"errors"

	"maps"

	"github.com/thecloudmasters/uesio/pkg/goutils"
)

type NodeSet[T comparable] map[T]bool

func (ns NodeSet[T]) Clone() NodeSet[T] {
	out := make(NodeSet[T], len(ns))
	maps.Copy(out, ns)
	return out
}

type DepMap[T comparable] map[T]NodeSet[T]

func (dm DepMap[T]) Clone() DepMap[T] {
	out := make(DepMap[T], len(dm))
	for k, v := range dm {
		out[k] = v.Clone()
	}
	return out
}

// Remove removes the given node completely from this dependency map
func (dm DepMap[T]) Remove(dependent, node T) {
	nodes := dm[dependent]
	if len(nodes) == 1 {
		// The only element in the nodeset must be `node`, so we
		// can delete the entry entirely.
		delete(dm, dependent)
	} else {
		// Otherwise, remove the single node from the nodeset.
		delete(nodes, node)
	}
}

// DepGraph is a directed acyclic graph (DAG) implementation geared toward defining dependencies
// Use NewDepGraph constructor to instantiate.
type DepGraph[T comparable] struct {
	nodes NodeSet[T]
	// tracks dependencies from the child -> parent
	dependencies DepMap[T]
	// tracks dependencies from parent -> child
	dependents DepMap[T]
}

func NewDepGraph[T comparable]() *DepGraph[T] {
	return &DepGraph[T]{
		nodes:        NodeSet[T]{},
		dependencies: DepMap[T]{},
		dependents:   DepMap[T]{},
	}
}

func (dg *DepGraph[T]) Clone() *DepGraph[T] {
	return &DepGraph[T]{
		nodes:        dg.nodes.Clone(),
		dependencies: dg.dependencies.Clone(),
		dependents:   dg.dependents.Clone(),
	}
}

func (dg *DepGraph[T]) AddNode(node T) *DepGraph[T] {
	if _, isPresent := dg.nodes[node]; !isPresent {
		dg.nodes[node] = true
	}
	return dg
}

func (dg *DepGraph[T]) AddNodeDependency(child T, parent T) error {
	// Prevent circular / self-referential dependencies from being added on insertion,
	// to allow for safe, fast graph traversal
	if child == parent {
		return errors.New("self-referential dependencies not allowed")
	}
	if dg.DependsOn(parent, child) {
		return errors.New("circular dependencies not allowed")
	}
	// Add edges.
	dg.addNodeToDepMap(dg.dependencies, child, parent)
	dg.addNodeToDepMap(dg.dependents, parent, child)
	return nil
}

func (dg *DepGraph[T]) addNodeToDepMap(depMap DepMap[T], sourceNode, targetNode T) {
	if currentSet, exists := depMap[sourceNode]; !exists {
		depMap[sourceNode] = NodeSet[T]{
			targetNode: true,
		}
	} else {
		currentSet[targetNode] = true
	}
}

// DependsOn returns true if checkNode has a direct or transitive dependency on againstNode
func (dg *DepGraph[T]) DependsOn(checkNode, againstNode T) bool {
	deps := dg.Dependencies(checkNode)
	_, ok := deps[againstNode]
	return ok
}

// DirectDependencies returns a slice of all direct dependencies of checkNode
func (dg *DepGraph[T]) DirectDependencies(checkNode T) []T {
	// Make sure we actually have this node in the graph
	if _, ok := dg.nodes[checkNode]; !ok {
		return nil
	}
	return goutils.MapKeys[T](dg.dependencies[checkNode])
}

// HasDependencies returns true if this node depends on at least one other node
func (dg *DepGraph[T]) HasDependencies(checkNode T) bool {
	// Make sure we actually have this node in the graph
	if _, ok := dg.nodes[checkNode]; !ok {
		return false
	}
	if _, hasDeps := dg.dependencies[checkNode]; hasDeps {
		return true
	}
	return false
}

// Dependencies returns a NodeSet containing all direct and transitive dependencies of checkNode
func (dg *DepGraph[T]) Dependencies(checkNode T) NodeSet[T] {
	// Make sure we actually have this node in the graph
	if _, ok := dg.nodes[checkNode]; !ok {
		return nil
	}
	allDeps := make(NodeSet[T])
	// Iteratively iterate through the graph
	searchSlice := []T{checkNode}
	for len(searchSlice) > 0 {
		// List of new nodes from this layer of the dependency graph. This is
		// assigned to `searchNext` at the end of the outer "discovery" loop.
		var discoveredDeps []T
		for _, node := range searchSlice {
			// Get the dependencies OF this node
			nodeDeps := dg.dependencies[node]
			if len(nodeDeps) == 0 {
				continue
			}
			for nextNode := range nodeDeps {
				// If we have not seen the node before, add it to the output as well
				// as the list of nodes to traverse in the next iteration.
				if _, ok := allDeps[nextNode]; !ok {
					allDeps[nextNode] = true
					discoveredDeps = append(discoveredDeps, nextNode)
				}
			}
		}
		searchSlice = discoveredDeps
	}
	return allDeps
}

// Leaves returns a slice of nodes with no dependencies
func (dg *DepGraph[T]) Leaves() []T {
	var leaves []T
	for node := range dg.nodes {
		if _, hasDeps := dg.dependencies[node]; !hasDeps {
			leaves = append(leaves, node)
		}
	}
	return leaves
}

// Remove removes a single node from the dependency graph
func (dg *DepGraph[T]) Remove(node T) {
	// Remove edges from things that depend on `node`.
	for dependent := range dg.dependents[node] {
		dg.dependencies.Remove(dependent, node)
	}
	delete(dg.dependents, node)

	// Remove all edges from node to the things it depends on.
	for dependency := range dg.dependencies[node] {
		dg.dependents.Remove(dependency, node)
	}
	delete(dg.dependencies, node)

	// Finally, remove the node itself.
	delete(dg.nodes, node)
}

// TopologicalSort returns an array of each dependency layer,
// starting with leaf nodes and moving outwards
func (dg *DepGraph[T]) TopologicalSort() [][]T {
	var layers [][]T
	// Copy the graph so that we can mutate as part of traversal
	shrinkingGraph := dg.Clone()
	for {
		leaves := shrinkingGraph.Leaves()
		if len(leaves) == 0 {
			break
		}
		layers = append(layers, leaves)
		for _, leafNode := range leaves {
			shrinkingGraph.Remove(leafNode)
		}
	}
	return layers
}
