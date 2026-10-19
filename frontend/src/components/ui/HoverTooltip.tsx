import {
  cloneElement,
  isValidElement,
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent,
  type ReactElement,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import { IconInfo } from './Icons'

export interface HoverTooltipProps {
  title?: ReactNode
  content: ReactNode
  children: ReactElement
  width?: number
  placement?: 'auto' | 'top' | 'bottom'
}

export default function HoverTooltip({
  title,
  content,
  children,
  width = 300,
  placement = 'auto',
}: HoverTooltipProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [pos, setPos] = useState<{
    top: number
    left: number
    arrowLeft: number
    place: 'top' | 'bottom'
  }>({
    top: 0,
    left: 0,
    arrowLeft: 20,
    place: 'bottom',
  })

  const targetRef = useRef<HTMLElement | null>(null)
  const tooltipRef = useRef<HTMLDivElement | null>(null)

  const updatePosition = useCallback(() => {
    const el = targetRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const tooltipWidth = width
    const tooltipHeight = tooltipRef.current?.offsetHeight || 110

    let chosenPlace = placement
    if (chosenPlace === 'auto') {
      const spaceBelow = window.innerHeight - rect.bottom
      const spaceAbove = rect.top
      chosenPlace = spaceBelow >= tooltipHeight + 16 || spaceBelow >= spaceAbove ? 'bottom' : 'top'
    }

    const top =
      chosenPlace === 'bottom'
        ? rect.bottom + 8
        : Math.max(8, rect.top - tooltipHeight - 8)

    const centerX = rect.left + rect.width / 2
    const left = Math.max(
      12,
      Math.min(centerX - tooltipWidth / 2, window.innerWidth - tooltipWidth - 12),
    )
    const arrowLeft = Math.max(16, Math.min(centerX - left, tooltipWidth - 16))

    setPos({
      top,
      left,
      arrowLeft,
      place: chosenPlace,
    })
  }, [width, placement])

  const handleMouseEnter = (e: MouseEvent) => {
    // Call existing child handler if present
    const childProps = (children as ReactElement<{ onMouseEnter?: (e: MouseEvent) => void }>).props
    childProps?.onMouseEnter?.(e)
    updatePosition()
    setIsOpen(true)
  }

  const handleMouseLeave = (e: MouseEvent) => {
    const childProps = (children as ReactElement<{ onMouseLeave?: (e: MouseEvent) => void }>).props
    childProps?.onMouseLeave?.(e)
    setIsOpen(false)
  }

  // Keep position updated on scroll or window resize while open
  useEffect(() => {
    if (!isOpen) return
    updatePosition()

    const onScrollOrResize = () => {
      updatePosition()
    }

    window.addEventListener('scroll', onScrollOrResize, true)
    window.addEventListener('resize', onScrollOrResize)
    return () => {
      window.removeEventListener('scroll', onScrollOrResize, true)
      window.removeEventListener('resize', onScrollOrResize)
    }
  }, [isOpen, updatePosition])

  // Recalculate once DOM is rendered to use actual measured height
  useEffect(() => {
    if (isOpen && tooltipRef.current) {
      updatePosition()
    }
  }, [isOpen, updatePosition])

  if (!isValidElement(children)) {
    return null
  }

  const child = children as ReactElement<{
    ref?: (node: HTMLElement | null) => void
    title?: string
    onMouseEnter?: (e: MouseEvent) => void
    onMouseLeave?: (e: MouseEvent) => void
  }>

  // Merge child ref with internal targetRef
  const clonedChild = cloneElement(child, {
    ref: (node: HTMLElement | null) => {
      targetRef.current = node
      const originalRef = (child as any).ref
      if (typeof originalRef === 'function') {
        originalRef(node)
      } else if (originalRef && typeof originalRef === 'object' && 'current' in originalRef) {
        originalRef.current = node
      }
    },
    onMouseEnter: handleMouseEnter,
    onMouseLeave: handleMouseLeave,
    title: child.props.title || (typeof content === 'string' ? content : undefined),
  })

  return (
    <>
      {clonedChild}
      {isOpen &&
        createPortal(
          <div
            ref={tooltipRef}
            className="pf-hover-tooltip-portal"
            style={
              {
                position: 'fixed',
                top: `${pos.top}px`,
                left: `${pos.left}px`,
                width: `${width}px`,
                zIndex: 99999,
                pointerEvents: 'none',
              } as CSSProperties
            }
            role="tooltip"
          >
            <div className={`pf-hover-tooltip-bubble ${pos.place}`}>
              <span
                className="pf-hover-tooltip-arrow"
                style={{ left: `${pos.arrowLeft}px` }}
              />
              {title && (
                <div className="pf-hover-tooltip-title">
                  <IconInfo size={14} />
                  <span>{title}</span>
                </div>
              )}
              <div className="pf-hover-tooltip-content">{content}</div>
            </div>
          </div>,
          document.body,
        )}
    </>
  )
}
