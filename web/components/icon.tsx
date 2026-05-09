'use client'
import {
  Layers,
  MessagesSquare,
  Brain,
  HelpCircle,
  Command,
  Activity,
  GitCompare,
  Bug,
  Bot,
  BookMarked,
  Cpu,
  ShieldCheck,
  Code2,
  Sparkles,
  type LucideIcon,
} from 'lucide-react'

const MAP: Record<string, LucideIcon> = {
  Layers,
  MessagesSquare,
  Brain,
  HelpCircle,
  Command,
  Activity,
  GitCompare,
  Bug,
  Bot,
  BookMarked,
  Cpu,
  ShieldCheck,
  Code2,
  Sparkles,
}

export function Icon({ name, className, size }: { name: string; className?: string; size?: number }) {
  const C = MAP[name] ?? Sparkles
  return <C className={className} size={size} />
}
