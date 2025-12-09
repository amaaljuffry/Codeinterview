// RetroUI components - White theme with rounded-lg buttons and bottom shadow
import { forwardRef } from 'react'

// ============ BUTTON ============
export const RetroButton = forwardRef(({ 
  children, 
  variant = 'primary', 
  size = 'md',
  className = '',
  ...props 
}, ref) => {
  const baseClasses = 'font-bold rounded-lg border-2 border-black transition-all duration-200 cursor-pointer inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed'
  
  const variants = {
    primary: 'bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-black shadow-[0_4px_0_0_#000] hover:shadow-[0_2px_0_0_#000] hover:translate-y-[2px] active:shadow-none active:translate-y-[4px]',
    secondary: 'bg-black hover:bg-gray-800 text-white shadow-[0_4px_0_0_#333] hover:shadow-[0_2px_0_0_#333] hover:translate-y-[2px] active:shadow-none active:translate-y-[4px]',
    accent: 'bg-[var(--accent)] hover:brightness-105 text-black shadow-[0_4px_0_0_#000] hover:shadow-[0_2px_0_0_#000] hover:translate-y-[2px] active:shadow-none active:translate-y-[4px]',
    danger: 'bg-[var(--destructive)] hover:brightness-110 text-white shadow-[0_4px_0_0_#000] hover:shadow-[0_2px_0_0_#000] hover:translate-y-[2px] active:shadow-none active:translate-y-[4px]',
    ghost: 'bg-transparent hover:bg-gray-100 text-black border-transparent shadow-none',
    outline: 'bg-white hover:bg-gray-50 text-black border-black shadow-[0_4px_0_0_#000] hover:shadow-[0_2px_0_0_#000] hover:translate-y-[2px] active:shadow-none active:translate-y-[4px]',
    muted: 'bg-gray-100 hover:bg-gray-200 text-gray-700 shadow-[0_4px_0_0_#ccc] hover:shadow-[0_2px_0_0_#ccc] hover:translate-y-[2px]',
  }
  
  const sizes = {
    sm: 'px-4 py-1.5 text-sm',
    md: 'px-6 py-2.5 text-base',
    lg: 'px-8 py-3.5 text-lg',
  }
  
  return (
    <button 
      ref={ref}
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
})

// ============ CARD ============
export const RetroCard = ({ children, className = '', variant = 'default', hover = true, ...props }) => {
  const variants = {
    default: 'bg-white text-black',
    primary: 'bg-[var(--primary)] text-black',
    secondary: 'bg-black text-white',
    accent: 'bg-[var(--accent)] text-black',
    muted: 'bg-gray-100 text-gray-700',
  }
  const hoverEffect = hover ? 'hover:-translate-y-1 hover:shadow-2xl transition-all duration-200' : ''
  return <div className={`${variants[variant]} rounded-2xl border-2 border-black shadow-xl ${hoverEffect} ${className}`} {...props}>{children}</div>
}

// ============ BADGE ============
export const RetroBadge = ({ children, variant = 'default', className = '' }) => {
  const variants = {
    default: 'bg-gray-100 text-gray-700',
    primary: 'bg-[var(--primary)] text-black',
    secondary: 'bg-black text-white',
    accent: 'bg-[var(--accent)] text-black',
    destructive: 'bg-[var(--destructive)] text-white',
    success: 'bg-emerald-500 text-white',
    warning: 'bg-amber-400 text-black',
    yellow: 'bg-[var(--primary)] text-black',
    green: 'bg-emerald-500 text-white',
    red: 'bg-[var(--destructive)] text-white',
    gray: 'bg-gray-200 text-gray-700',
  }
  return <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-bold rounded-full border border-black ${variants[variant]} ${className}`}>{children}</span>
}

// ============ INPUT ============
export const RetroInput = forwardRef(({ label, className = '', error, ...props }, ref) => {
  return (
    <div className="w-full">
      {label && <label className="block text-sm font-bold mb-2 text-black">{label}</label>}
      <input ref={ref} className={`w-full px-4 py-3 rounded-lg border-2 border-black bg-white text-black font-medium placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition-all ${error ? 'border-[var(--destructive)]' : ''} ${className}`} {...props} />
      {error && <p className="mt-1 text-sm text-[var(--destructive)] font-bold">{error}</p>}
    </div>
  )
})

// ============ CONTAINER ============
export const RetroContainer = ({ children, className = '', size = 'lg' }) => {
  const sizes = { sm: 'max-w-2xl', md: 'max-w-4xl', lg: 'max-w-6xl', xl: 'max-w-7xl', full: 'max-w-full' }
  return <div className={`mx-auto px-4 sm:px-6 lg:px-8 ${sizes[size]} ${className}`}>{children}</div>
}

// ============ SECTION ============
export const RetroSection = ({ children, className = '', variant = 'default' }) => {
  const variants = { default: 'bg-white', card: 'bg-gray-50', muted: 'bg-gray-100', primary: 'bg-[var(--primary)] text-black', secondary: 'bg-black text-white', gradient: 'bg-gradient-to-br from-white via-gray-50 to-[var(--accent)]' }
  return <section className={`py-16 lg:py-24 ${variants[variant]} ${className}`}>{children}</section>
}

// ============ NAVBAR ============
export const RetroNavbar = ({ children, className = '' }) => {
  return <nav className={`bg-white border-b-2 border-black sticky top-0 z-50 ${className}`}><RetroContainer><div className="flex items-center justify-between h-16">{children}</div></RetroContainer></nav>
}

// ============ HEADING ============
export const RetroHeading = ({ children, level = 1, className = '' }) => {
  const styles = { 1: 'text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight', 2: 'text-3xl sm:text-4xl lg:text-5xl font-bold', 3: 'text-2xl sm:text-3xl font-bold', 4: 'text-xl sm:text-2xl font-bold', 5: 'text-lg font-bold' }
  const Tag = `h${level}`
  return <Tag className={`text-black ${styles[level]} ${className}`}>{children}</Tag>
}

// ============ FEATURE CARD ============
export const RetroFeatureCard = ({ icon: Icon, title, description, variant = 'primary' }) => {
  const iconVariants = { primary: 'bg-[var(--primary)]', secondary: 'bg-black', accent: 'bg-[var(--accent)]', muted: 'bg-gray-100' }
  return (
    <RetroCard className="p-6 h-full">
      <div className={`w-14 h-14 ${iconVariants[variant]} rounded-xl border-2 border-black flex items-center justify-center mb-4`}>
        {Icon && <Icon className={`w-7 h-7 ${variant === 'secondary' ? 'text-white' : 'text-black'}`} />}
      </div>
      <h3 className="text-xl font-bold mb-2 text-black">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </RetroCard>
  )
}

// ============ EMPTY STATE ============
export const RetroEmptyState = ({ icon: Icon, title, description, action }) => {
  return (
    <RetroCard className="p-12 text-center" hover={false}>
      {Icon && <div className="w-20 h-20 bg-gray-100 rounded-2xl border-2 border-black mx-auto mb-6 flex items-center justify-center"><Icon className="w-10 h-10 text-gray-500" /></div>}
      <h3 className="text-xl font-bold mb-2 text-black">{title}</h3>
      <p className="text-gray-600 mb-6">{description}</p>
      {action}
    </RetroCard>
  )
}

// ============ TOGGLE ============
export const RetroToggle = ({ checked, onChange, className = '' }) => {
  return (
    <button type="button" onClick={() => onChange?.(!checked)} className={`w-14 h-8 rounded-full border-2 border-black relative transition-colors ${checked ? 'bg-[var(--primary)]' : 'bg-gray-200'} ${className}`}>
      <div className={`w-6 h-6 bg-white rounded-full border border-black absolute top-0.5 transition-transform shadow-sm ${checked ? 'translate-x-6' : 'translate-x-0.5'}`} />
    </button>
  )
}

export default { RetroButton, RetroCard, RetroBadge, RetroInput, RetroContainer, RetroSection, RetroNavbar, RetroHeading, RetroFeatureCard, RetroEmptyState, RetroToggle }
