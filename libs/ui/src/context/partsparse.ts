/**
 * Parses an expression which is expected to have 2 parts, delimited with one of the following syntaxes:
 *  a. [part1][part2]
 *  b. part1:part2
 *
 * We support both because:
 * (a) is more safe, allowing you to have ":" in one of the parts, but is more verbose
 * (b) is more concise, but more fragile.
 *
 * @returns [part1, part2]
 * @throws InvalidExpressionError
 */

const InvalidExpressionError = "Invalid Expression"
const bracketedDelimiter = "]["
const colonDelimiter = ":"

const parseOneOrTwoPartExpression = (expression: string) => {
  let parts
  if (expression.includes(bracketedDelimiter)) {
    parts = expression.split(bracketedDelimiter)
  } else if (expression.includes(colonDelimiter)) {
    parts = expression.split(colonDelimiter)
  } else {
    parts = [expression]
  }
  if (!parts) {
    throw InvalidExpressionError
  }
  if (parts.length !== 2) {
    return parseOnePartExpression(expression)
  }

  return parseTwoPartExpression(expression)
}

const parseTwoOrThreePartExpression = (expression: string) => {
  let parts
  if (expression.includes(bracketedDelimiter)) {
    parts = expression.split(bracketedDelimiter)
  } else if (expression.includes(colonDelimiter)) {
    parts = expression.split(colonDelimiter)
  }
  if (!parts) {
    throw InvalidExpressionError
  }
  if (parts.length !== 3) {
    return parseTwoPartExpression(expression)
  }

  return parseThreePartExpression(expression)
}

const parseOnePartExpression = (expression: string) => {
  if (expression[0] === "[" && expression[expression.length - 1] === "]") {
    let trimmed

    try {
      trimmed = expression.substring(1, expression.length - 1)
    } catch {
      throw InvalidExpressionError
    }
    if (trimmed.includes("[") || trimmed.includes("]")) {
      throw InvalidExpressionError
    }
    return [trimmed]
  }
  if (expression.includes(colonDelimiter)) {
    throw InvalidExpressionError
  }
  if (expression.includes("[") || expression.includes("]")) {
    throw InvalidExpressionError
  }
  return [expression]
}

const parseTwoPartExpression = (expression: string) => {
  let parts
  let part1, part2
  if (expression.includes(bracketedDelimiter)) {
    parts = expression.split(bracketedDelimiter)
    if (parts.length !== 2) {
      throw InvalidExpressionError
    }
    ;[part1, part2] = parts
    if (part1[0] !== "[" || part2[part2.length - 1] !== "]") {
      throw InvalidExpressionError
    }
    try {
      parts = [part1.substring(1), part2.substring(0, part2.length - 1)]
    } catch {
      throw InvalidExpressionError
    }
  } else if (expression.includes(colonDelimiter)) {
    parts = expression.split(colonDelimiter)
  }
  if (!parts || parts.length !== 2) {
    throw InvalidExpressionError
  }
  return parts
}

const parseThreePartExpression = (expression: string) => {
  let parts
  let part1, part2, part3
  if (expression.includes(bracketedDelimiter)) {
    parts = expression.split(bracketedDelimiter)
    if (parts.length !== 3) {
      throw InvalidExpressionError
    }
    ;[part1, part2, part3] = parts
    if (part1[0] !== "[" || part3[part3.length - 1] !== "]") {
      throw InvalidExpressionError
    }
    try {
      parts = [part1.substring(1), part2, part3.substring(0, part3.length - 1)]
    } catch {
      throw InvalidExpressionError
    }
  } else if (expression.includes(colonDelimiter)) {
    parts = expression.split(colonDelimiter)
  }
  if (!parts || parts.length !== 3) {
    throw InvalidExpressionError
  }
  return parts
}

const parseWireExpression = (
  fullExpression: string,
): [string | undefined, string] => {
  const expressionParts = fullExpression.split(colonDelimiter)
  if (expressionParts.length === 1) {
    return [undefined, fullExpression]
  }
  return [expressionParts[0], expressionParts[1]]
}

const parseFileExpression = (
  fullExpression: string,
): [string, string | undefined] => {
  const expressionParts = fullExpression.split(colonDelimiter)
  if (expressionParts.length === 1) {
    return [fullExpression, undefined]
  }
  return [expressionParts[0], expressionParts[1]]
}

export {
  parseOnePartExpression,
  parseOneOrTwoPartExpression,
  parseTwoPartExpression,
  parseTwoOrThreePartExpression,
  parseThreePartExpression,
  parseWireExpression,
  parseFileExpression,
}
