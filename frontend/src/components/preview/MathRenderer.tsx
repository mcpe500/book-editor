import { renderLatexMath } from '../../lib/latex'

interface MathRendererProps {
  latex: string
  displayMode?: boolean
}

export default function MathRenderer({ latex, displayMode = false }: MathRendererProps) {
  return (
    <span
      dangerouslySetInnerHTML={{
        __html: renderLatexMath(latex, displayMode),
      }}
    />
  )
}