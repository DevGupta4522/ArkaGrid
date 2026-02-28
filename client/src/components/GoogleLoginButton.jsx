import React, { useEffect, useRef } from 'react'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID

export default function GoogleLoginButton({ onSuccess, onError, text = 'signin_with' }) {
    const buttonRef = useRef(null)
    const initialized = useRef(false)

    useEffect(() => {
        if (!GOOGLE_CLIENT_ID) {
            console.warn('VITE_GOOGLE_CLIENT_ID not set — Google Sign-In disabled')
            return
        }

        const initGoogle = () => {
            if (initialized.current || !window.google?.accounts?.id) return
            initialized.current = true

            window.google.accounts.id.initialize({
                client_id: GOOGLE_CLIENT_ID,
                callback: handleCredentialResponse,
                auto_select: false,
            })

            if (buttonRef.current) {
                window.google.accounts.id.renderButton(buttonRef.current, {
                    type: 'standard',
                    theme: 'outline',
                    size: 'large',
                    width: buttonRef.current.offsetWidth,
                    text: text,
                    shape: 'pill',
                    logo_alignment: 'left',
                })
            }
        }

        // Google script might already be loaded
        if (window.google?.accounts?.id) {
            initGoogle()
        } else {
            // Wait for script to load
            const interval = setInterval(() => {
                if (window.google?.accounts?.id) {
                    clearInterval(interval)
                    initGoogle()
                }
            }, 100)
            // Cleanup after 10s
            const timeout = setTimeout(() => clearInterval(interval), 10000)
            return () => {
                clearInterval(interval)
                clearTimeout(timeout)
            }
        }
    }, [])

    const handleCredentialResponse = (response) => {
        if (response.credential) {
            onSuccess(response.credential)
        } else {
            onError?.('Google sign-in failed')
        }
    }

    if (!GOOGLE_CLIENT_ID) {
        return null
    }

    return (
        <div className="w-full">
            <div className="relative flex items-center my-5">
                <div className="flex-1 border-t border-gray-200" />
                <span className="px-4 text-sm text-gray-400 font-medium">or</span>
                <div className="flex-1 border-t border-gray-200" />
            </div>
            <div ref={buttonRef} className="w-full flex justify-center [&>div]:!w-full" />
        </div>
    )
}
