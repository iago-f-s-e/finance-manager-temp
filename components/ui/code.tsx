import { cn } from "@/lib/utils"
import React from "react"

interface CodeProps extends React.HTMLAttributes<HTMLPreElement> {
  language?: string
}

export function Code({ language, className, children, ...props }: CodeProps) {
  return (
    <pre
      className={cn(
        "rounded-md bg-muted p-4 overflow-auto text-sm",
        className
      )}
      {...props}
    >
      <code className={language ? `language-${language}` : undefined}>{children}</code>
    </pre>
  )
}

