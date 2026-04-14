/**
 * Download a remote file (image / audio / video) to the user's device.
 *
 * Uses a fetch-to-blob approach so cross-origin assets (e.g. Supabase presigned
 * URLs) save with the filename we want instead of just opening in a new tab.
 *
 * Returns true on success, false on failure. Errors are logged; callers should
 * surface a toast if the UI wants to react.
 */
export async function downloadFromUrl(url: string, filename: string): Promise<boolean> {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            console.error(`downloadFromUrl: bad response ${response.status} for ${url}`);
            return false;
        }
        const blob = await response.blob();
        const objectUrl = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.download = filename;
        link.href = objectUrl;
        // Some browsers need the link in the DOM before click works
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        // Give the browser a tick before revoking — prevents the download from
        // being cancelled in some Safari/Firefox builds.
        setTimeout(() => window.URL.revokeObjectURL(objectUrl), 1000);
        return true;
    } catch (error) {
        console.error("downloadFromUrl failed:", error);
        return false;
    }
}
