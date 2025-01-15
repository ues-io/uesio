# Developer Documentation 📚

The how and why of creating software at The Cloud Masters. The propose of this repo is to develop a common understanding of the tools and process we use.

### Evolving Document

This documentation is not meant to be static. Our tools and processes will change and this documentation will change with it. The process for changing this document is a Pull Request.

### Agile Manifesto

- **Individuals and interactions** over processes and tools
- **Working software** over comprehensive documentation
- **Customer collaboration** over contract negotiation
- **Responding to change** over following a plan

Principles https://agilemanifesto.org/principles.html

# Recommended Tools ⚒️

Developers at TCM can setup their development environment however they choose. Below are tools that are recommended and understood by the team.

## Text Editor - VSCode

https://code.visualstudio.com/

### Recommended Extensions

- EditorConfig for VS Code
- ESLint
- Go
- gotemplate-syntax
- Prettier - Code formatter
- YAML

## Terminal Emulator - iTerm2

https://www.iterm2.com/

## Shell - Oh My Zsh

https://ohmyz.sh/

### Recommended Extensions

- autoenv https://github.com/zpm-zsh/autoenv <-- Use this repo
- git
- wd (Great for quickly moving between projects)

## Git Client - Github Desktop

https://desktop.github.com/

## Local DNS - Dnsmasq

```
brew install dnsmasq
```

## OSX Package Manager - Homebrew

https://brew.sh/

# Source Control

All TCM code should be in a repo in TheCloudMasters Github organization.

https://github.com/thecloudmasters

## Change Process

The git commands below are just an example workflow. Many of the steps below can be completed using a Git Client (such as GitHub Desktop).

1. Check out the master branch and pull latest

```bash
git checkout master
```

```bash
git pull
```

2. Create a feature branch (the name should be descriptive and [kebab case](https://en.wikipedia.org/wiki/Letter_case#Special_case_styles))

```bash
git checkout -b my-feature-branch
```

3. Make changes and then commit to your branch

```bash
git add -A
```

```bash
git commit -m "Such Commit Message. Wow."
```

```bash
git push origin
```

4. In GitHub, create a Pull Request and add a reviewer. Add yourself as the Assignee.

5. Once the PR has been approved and any requested changes have been made, the PR may be merged, using "Squash and Merge".

## Tips for Submitting PRs

- Verify that any automated tests pass before creating a PR and adding a reviewer. Submitting failing PRs is just a waste of time for the reviewer.
- The smaller the PR, the better (in most cases). Reviewers will most likely spend more time on your PR if it is small and concise.
- For large, complicated PRs, split the work into smaller commits with good descriptions to aid the reviewer's understanding.

## Tips for Reviewing PRs

- **TONE**: Avoid accusing or embarassing.  
  Bad: "You keep repeating yourself. You did this the wrong way."  
  Good: "It would be better if _we_ separated this out into its own function."  
  Bad: "Why did you write these calls in series, this will be way too slow."  
  Good: "I think this function may perform better if we did these calls in parallel."
- **STYLE**: Style discussions are not part of the review process. Style should be completely decided by linter and formatter rules. (eslint, prettier, gofmt)
- **SPECIFICITY**: Use specific statements instead of general ones.  
  Bad: "This code is messy"  
  Good: "Let's move this function to its own class file and rename it so the name better reflects its behavior"
- **RIGOR**: Read and understand all changes before approving. Feel free to discuss the PR with the submitter outside of the PR, but add any conclusions or action items you came to the PR itself. In most cases, changes should be checked out by the reviewer and manually tested in their local environment.

# Developing with NodeJS and TypeScript

https://nodejs.org/en/

### Installation Notes

nvm is a great way to manage multiple versions of nodejs at the same time.

## npm - Node Package Manager

https://www.npmjs.com/

## Typescript

https://www.typescriptlang.org/

> 🤔RATIONALE: Strict Types may be a bit more work upfront, but are worth it in maintaining large codebases and for easy refactoring.

## React

> 🤔RATIONALE: A popular, well-maintained library for declaratively describling components.

https://reactjs.org/

### JSX

https://reactjs.org/docs/introducing-jsx.html

When possible use JSX to define react components.

### Hooks

https://reactjs.org/docs/hooks-intro.html

## Redux

https://redux.js.org/

## Prettier

https://prettier.io/

> 🤔RATIONALE: Treats code as an AST. No more nitpicking about style in Code Reviews.

Projects should have the following configuration for Prettier.

```yaml
# .prettierrc.yaml
tabWidth: 4
semi: false
useTabs: true
overrides:
    - files: "*.yaml"
      options:
          tabWidth: 2
```

# Developing with Go

https://golang.org/

## Modules

Use Modules, they are required

## Formatting

Code should be formatted according to the gofmt tool.

https://blog.golang.org/using-go-modules
