import type { Book } from '../../types'
import Header from './Header'

interface AppShellProps {
  children: React.ReactNode
  book: Book
}

export default function AppShell({ children, book }: AppShellProps) {
  return (
    <div className="h-screen flex flex-col bg-white dark:bg-slate-900">
      <Header book={book} />
      <main className="flex-1 min-h-0">{children}</main>
    </div>
  )
}