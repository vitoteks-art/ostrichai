import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const url = new URL(req.url).searchParams.get('url')
        if (!url) {
            return new Response(
                JSON.stringify({ error: 'Missing url parameter' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
            )
        }

        const decodedUrl = decodeURIComponent(url)
        console.log(`Proxying request for: ${decodedUrl}`)

        const response = await fetch(decodedUrl)
        if (!response.ok) {
            throw new Error(`Failed to fetch original resource: ${response.statusText}`)
        }

        const blob = await response.blob()
        const contentType = response.headers.get('Content-Type') || 'application/octet-stream'

        return new Response(blob, {
            headers: {
                ...corsHeaders,
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=3600',
            },
        })
    } catch (error: any) {
        console.error(`Proxy error: ${error.message}`)
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        )
    }
})
