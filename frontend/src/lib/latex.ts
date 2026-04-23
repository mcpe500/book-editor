import katex from 'katex'

export function renderLatexMath(latex: string, displayMode = false): string {
  try {
    return katex.renderToString(latex.trim(), {
      throwOnError: false,
      displayMode,
    })
  } catch (error) {
    return `<span class="text-red-500">${latex}</span>`
  }
}

export function isValidLatex(latex: string): boolean {
  try {
    katex.renderToString(latex.trim(), { throwOnError: true, displayMode: false })
    return true
  } catch {
    return false
  }
}

export function insertMathBlock(content: string, cursorPos: number, latex: string): string {
  const before = content.slice(0, cursorPos)
  const after = content.slice(cursorPos)
  return `${before}$$$${latex}$$ ${after}`
}

export function insertMathInline(content: string, cursorPos: number, latex: string): string {
  const before = content.slice(0, cursorPos)
  const after = content.slice(cursorPos)
  return `${before}$${latex}$ ${after}`
}