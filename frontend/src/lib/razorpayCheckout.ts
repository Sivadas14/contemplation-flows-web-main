/**
 * Razorpay Checkout JS integration.
 *
 * Uses the embedded checkout modal (not the hosted short_url page) so that:
 *   - Success → our handler fires in-page (we stay on the app, refresh state)
 *   - Failure / dismiss → we show an error toast in-page
 *
 * Script is loaded on demand and cached on window.
 */

declare global {
    interface Window {
        Razorpay?: new (options: RazorpayOptions) => RazorpayInstance;
    }
}

interface RazorpayPrefill {
    email?: string;
    name?: string;
    contact?: string;
}

interface RazorpayTheme {
    color?: string;
}

interface RazorpayModalConfig {
    ondismiss?: () => void;
}

export interface RazorpaySuccessResponse {
    razorpay_payment_id: string;
    razorpay_subscription_id?: string;
    razorpay_order_id?: string;
    razorpay_signature: string;
}

export interface RazorpayFailureResponse {
    error: {
        code: string;
        description: string;
        source: string;
        step: string;
        reason: string;
        metadata?: Record<string, unknown>;
    };
}

interface RazorpayOptions {
    key: string;
    subscription_id?: string;
    order_id?: string;
    name: string;
    description?: string;
    image?: string;
    prefill?: RazorpayPrefill;
    theme?: RazorpayTheme;
    notes?: Record<string, string>;
    modal?: RazorpayModalConfig;
    handler?: (response: RazorpaySuccessResponse) => void;
}

interface RazorpayInstance {
    open: () => void;
    on: (event: string, callback: (response: RazorpayFailureResponse) => void) => void;
    close?: () => void;
}

const RAZORPAY_SCRIPT_URL = 'https://checkout.razorpay.com/v1/checkout.js';

let scriptLoadPromise: Promise<void> | null = null;

/**
 * Load the Razorpay Checkout JS script (idempotent, cached).
 * Rejects if the script fails to load (e.g. network error or CSP block).
 */
function loadRazorpayScript(): Promise<void> {
    if (typeof window !== 'undefined' && window.Razorpay) {
        return Promise.resolve();
    }
    if (scriptLoadPromise) {
        return scriptLoadPromise;
    }

    scriptLoadPromise = new Promise<void>((resolve, reject) => {
        const existing = document.querySelector(
            `script[src="${RAZORPAY_SCRIPT_URL}"]`,
        ) as HTMLScriptElement | null;

        if (existing) {
            if (window.Razorpay) {
                resolve();
            } else {
                existing.addEventListener('load', () => resolve(), { once: true });
                existing.addEventListener(
                    'error',
                    () => reject(new Error('Razorpay script failed to load')),
                    { once: true },
                );
            }
            return;
        }

        const script = document.createElement('script');
        script.src = RAZORPAY_SCRIPT_URL;
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => {
            scriptLoadPromise = null; // allow retry on next attempt
            reject(new Error('Razorpay script failed to load'));
        };
        document.body.appendChild(script);
    });

    return scriptLoadPromise;
}

export interface OpenRazorpayCheckoutArgs {
    keyId: string;
    subscriptionId: string;
    planName: string;
    userEmail: string;
    userName?: string;
    onSuccess: (response: RazorpaySuccessResponse) => void;
    onFailure: (reason: string) => void;
    onDismiss: () => void;
}

/**
 * Open the Razorpay Checkout modal for a subscription.
 * Resolves once the modal has opened; terminal state is delivered via callbacks.
 */
export async function openRazorpayCheckout(
    args: OpenRazorpayCheckoutArgs,
): Promise<void> {
    await loadRazorpayScript();

    if (!window.Razorpay) {
        args.onFailure('Razorpay could not be initialised. Please try again.');
        return;
    }

    const rzp = new window.Razorpay({
        key: args.keyId,
        subscription_id: args.subscriptionId,
        name: 'Arunachala Samudra',
        description: args.planName,
        prefill: {
            email: args.userEmail,
            name: args.userName || args.userEmail,
        },
        theme: { color: '#d05e2d' },
        notes: { plan_name: args.planName },
        modal: {
            ondismiss: () => {
                args.onDismiss();
            },
        },
        handler: (response: RazorpaySuccessResponse) => {
            args.onSuccess(response);
        },
    });

    rzp.on('payment.failed', (response: RazorpayFailureResponse) => {
        const msg =
            response?.error?.description ||
            response?.error?.reason ||
            'Payment failed. Please try again.';
        args.onFailure(msg);
    });

    rzp.open();
}
