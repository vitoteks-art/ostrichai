import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
    title?: string;
    description?: string;
    image?: string;
    article?: boolean;
    canonical?: string;
}

const SEO: React.FC<SEOProps> = ({
    title,
    description,
    image,
    article,
    canonical
}) => {
    const defaultTitle = "OstrichAi - AI-Powered Marketing & Lead Generation";
    const defaultDescription = "Unlock high-quality leads and automate your marketing with OstrichAi. The ultimate AI toolkit for startups, creators, and agencies.";
    const siteUrl = "https://getostrichai.com"; // Update with actual domain
    const defaultImage = "/og-image.png"; // Default OG image
    const twitterHandle = "@ostrichai";

    const seo = {
        title: title ? `${title} | OstrichAi` : defaultTitle,
        description: description || defaultDescription,
        image: `${siteUrl}${image || defaultImage}`,
        url: `${siteUrl}${window.location.pathname}`,
    };

    return (
        <Helmet>
            {/* General tags */}
            <title>{seo.title}</title>
            <meta name="description" content={seo.description} />
            <meta name="image" content={seo.image} />
            {canonical && <link rel="canonical" href={canonical} />}

            {/* Open Graph tags */}
            {seo.url && <meta property="og:url" content={seo.url} />}
            {(article ? true : null) && <meta property="og:type" content="article" />}
            {seo.title && <meta property="og:title" content={seo.title} />}
            {seo.description && <meta property="og:description" content={seo.description} />}
            {seo.image && <meta property="og:image" content={seo.image} />}

            {/* Twitter Card tags */}
            <meta name="twitter:card" content="summary_large_image" />
            {twitterHandle && <meta name="twitter:creator" content={twitterHandle} />}
            {seo.title && <meta name="twitter:title" content={seo.title} />}
            {seo.description && <meta name="twitter:description" content={seo.description} />}
            {seo.image && <meta name="twitter:image" content={seo.image} />}
        </Helmet>
    );
};

export default SEO;
