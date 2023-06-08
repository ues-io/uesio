package yptr

import (
	"errors"
	"fmt"
	"strconv"
	"strings"

	"github.com/go-openapi/jsonpointer"
	yaml "gopkg.in/yaml.v3"
)

var (
	// ErrTooManyResults means a pointer matches too many results (usually more than one expected result).
	ErrTooManyResults = fmt.Errorf("too many results")
	// ErrNotFound a pointer failed to find a match.
	ErrNotFound = fmt.Errorf("not found")
)

// FindAll finds any locations in the json/yaml tree pointed by root that match the extended
// JSONPointer passed in ptr.
func FindAll(root *yaml.Node, ptr string) ([]*yaml.Node, error) {
	return findAll(root, ptr, false)
}

// FindAllStrict finds all locations in the json/yaml tree pointed by root that match the extended
// JSONPointer passed in ptr. Any sequence or mapping nodes encountered as part of traversal
// must match the expected path, otherwise ErrNotFound will be returned with no results.
func FindAllStrict(root *yaml.Node, ptr string) ([]*yaml.Node, error) {
	return findAll(root, ptr, true)
}

func findAll(root *yaml.Node, ptr string, matchRequired bool) ([]*yaml.Node, error) {
	if ptr == "" {
		return nil, fmt.Errorf("invalid empty pointer")
	}

	// TODO: remove dependency on jsonpointer since we only use it to split and unescape the pointer, which is trivial and well defined by the spec.
	p, err := jsonpointer.New(ptr)
	if err != nil {
		return nil, err
	}
	toks := p.DecodedTokens()

	res, err := find(root, toks, matchRequired)
	if err != nil {
		return nil, fmt.Errorf("%q: %w", ptr, err)
	}
	return res, nil
}

// Find is like FindAll but returns ErrTooManyResults if multiple matches are located.
func Find(root *yaml.Node, ptr string) (*yaml.Node, error) {
	res, err := findAll(root, ptr, true)
	if err != nil {
		return nil, err
	}
	if len(res) > 1 {
		return nil, fmt.Errorf("got %d matches: %w", len(res), ErrTooManyResults)
	}
	if len(res) == 0 {
		return nil, fmt.Errorf("bad state while finding %q: res is empty but error is: %v", ptr, err)
	}
	return res[0], nil
}

// find recursively matches a token against a yaml node
// If matchRequired is true, then ErrNotFound will be returned if any node does not contain the expected path,
// otherwise all matches will be returned.
func find(root *yaml.Node, toks []string, matchRequired bool) ([]*yaml.Node, error) {
	next, err := match(root, toks[0], matchRequired)
	if err != nil {
		return nil, err
	}
	if len(toks) == 1 {
		return next, nil
	}

	res := make([]*yaml.Node, 0)
	for _, n := range next {
		f, err := find(n, toks[1:], matchRequired)
		if err != nil {
			if matchRequired && errors.Is(err, ErrNotFound) {
				return res, err
			}
		}
		if f != nil && len(f) > 0 {
			res = append(res, f...)
		}
	}
	return res, nil
}

// match matches a JSONPointer token against a yaml Node.
//
// If root is a map, it performs a field lookup using tok as field name,
// and if found it will return a singleton slice containing the value contained
// in that field.
//
// If root is an array and tok is a number i, it will return the ith element of that array.
// If tok is ~{...}, it will parse the {...} object as a JSON object
// and use it to filter the array using a treeSubsetPred.
// If tok is ~[key=value] it will use keyValuePred to filter the array.
func match(root *yaml.Node, tok string, matchRequired bool) ([]*yaml.Node, error) {
	c := root.Content
	switch root.Kind {
	case yaml.MappingNode:
		if l := len(c); l%2 != 0 {
			return nil, fmt.Errorf("yaml.Node invariant broken, found %d map content", l)
		}

		for i := 0; i < len(c); i += 2 {
			key, value := c[i], c[i+1]
			if tok == key.Value {
				return []*yaml.Node{value}, nil
			}
		}
	case yaml.SequenceNode:
		switch {
		case strings.HasPrefix(tok, "~{"): // subtree match: ~{"name":"app"}
			var mtree yaml.Node
			if err := yaml.Unmarshal([]byte(tok[1:]), &mtree); err != nil {
				return nil, err
			}
			return filter(c, treeSubsetPred(&mtree))
		default:
			i, err := strconv.Atoi(tok)
			if err != nil {
				return nil, err
			}
			if i < 0 || i >= len(c) {
				return nil, fmt.Errorf("out of bounds")
			}
			return c[i : i+1], nil
		}
	case yaml.DocumentNode:
		// skip document nodes.
		return match(c[0], tok, matchRequired)
	default:
		return nil, fmt.Errorf("unhandled node type: %v (%v)", root.Kind, root.Tag)
	}
	if matchRequired {
		return nil, fmt.Errorf("%q: %w", tok, ErrNotFound)
	}
	return nil, nil
}

type nodePredicate func(*yaml.Node) bool

// filter applies a nodePredicate to each input node and returns only those for which the predicate
// function returns true.
func filter(nodes []*yaml.Node, pred nodePredicate) ([]*yaml.Node, error) {
	var res []*yaml.Node
	for _, n := range nodes {
		if pred(n) {
			res = append(res, n)
		}
	}
	return res, nil
}

// A treeSubsetPred is a node predicate that returns true if tree a is a subset of tree b.
func treeSubsetPred(a *yaml.Node) nodePredicate {
	return func(b *yaml.Node) bool {
		return isTreeSubset(a, b)
	}
}
