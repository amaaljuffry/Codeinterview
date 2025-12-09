// RetroToast - Toast notifications with RetroUI styling
import { Toaster as SonnerToaster, toast } from 'sonner'

// Custom styled Toaster component
export const RetroToaster = () => {
  return (
    <SonnerToaster
      position="bottom-right"
      toastOptions={{
        unstyled: true,
        classNames: {
          toast: 'bg-white border-2 border-black rounded-xl p-4 shadow-[0_4px_0_0_#000] flex items-center gap-3 font-medium',
          title: 'text-black font-bold',
          description: 'text-gray-600 text-sm',
          success: 'bg-emerald-50 border-emerald-600 text-emerald-800',
          error: 'bg-red-50 border-red-600 text-red-800',
          warning: 'bg-amber-50 border-amber-600 text-amber-800',
          info: 'bg-blue-50 border-blue-600 text-blue-800',
          actionButton: 'bg-black text-white px-3 py-1 rounded-lg font-bold text-sm',
          cancelButton: 'bg-gray-100 text-gray-700 px-3 py-1 rounded-lg font-bold text-sm',
        },
      }}
    />
  )
}

// Toast helper functions with RetroUI icons
export const retroToast = {
  success: (message, options = {}) => {
    return toast.success(message, {
      icon: <span className="text-emerald-600 text-xl">✓</span>,
      ...options,
    })
  },
  
  error: (message, options = {}) => {
    return toast.error(message, {
      icon: <span className="text-red-600 text-xl">✕</span>,
      ...options,
    })
  },
  
  warning: (message, options = {}) => {
    return toast.warning(message, {
      icon: <span className="text-amber-600 text-xl">⚠</span>,
      ...options,
    })
  },
  
  info: (message, options = {}) => {
    return toast.info(message, {
      icon: <span className="text-blue-600 text-xl">ℹ</span>,
      ...options,
    })
  },
  
  loading: (message, options = {}) => {
    return toast.loading(message, {
      icon: <span className="animate-spin text-xl">⏳</span>,
      ...options,
    })
  },
  
  promise: (promise, messages, options = {}) => {
    return toast.promise(promise, messages, options)
  },
  
  dismiss: (toastId) => toast.dismiss(toastId),
  
  custom: (message, options = {}) => toast(message, options),
}

export { toast }
