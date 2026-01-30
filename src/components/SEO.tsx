import { Helmet } from "react-helmet-async";

interface SEOProps {
  title: string;
  description: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: string;
  structuredData?: object;
  canonicalUrl?: string;
  noindex?: boolean;
  nofollow?: boolean;
}

export default function SEO({
  title,
  description,
  keywords = "marketplace, buy, sell, Kenya, online shopping, M-Pesa, Safaricom, electronics, fashion, vehicles, sellhubshop.co.ke",
  image = "/og-image.png",
  url = window.location.href,
  type = "website",
  structuredData,
  canonicalUrl,
  noindex = false,
  nofollow = false,
}: SEOProps) {
  const siteName = "SellHubShop - Kenya's Premium Marketplace";
  const fullTitle = `${title} | ${siteName}`;
  const siteUrl = "https://sellhubshop.co.ke";

  // Default structured data for e-commerce
  const defaultStructuredData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteName,
    description: description,
    url: siteUrl,
    potentialAction: {
      "@type": "SearchAction",
      target: `${siteUrl}/search?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  const finalStructuredData = structuredData || defaultStructuredData;

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />

      {/* Robots */}
      {noindex && <meta name="robots" content="noindex" />}
      {nofollow && <meta name="robots" content="nofollow" />}
      {!noindex && !nofollow && <meta name="robots" content="index, follow" />}

      {/* Open Graph */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:site_name" content={siteName} />
      <meta property="og:locale" content="en_KE" />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={url} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {/* Additional Meta Tags */}
      <meta name="theme-color" content="#00A650" />
      <meta name="apple-mobile-web-app-title" content={siteName} />
      <meta name="application-name" content={siteName} />

      {/* Canonical URL */}
      <link rel="canonical" href={canonicalUrl || url} />

      {/* Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify(finalStructuredData)}
      </script>

      {/* Additional E-commerce Schema */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          name: siteName,
          url: siteUrl,
          logo: `${siteUrl}/logo.png`,
          description:
            "Kenya's leading online marketplace for buying and selling products",
          contactPoint: {
            "@type": "ContactPoint",
            telephone: "+254-700-123-456",
            contactType: "customer service",
            areaServed: "KE",
            availableLanguage: ["en", "sw"],
          },
          sameAs: [
            "https://facebook.com/sellhubshop",
            "https://twitter.com/sellhubshop",
            "https://instagram.com/sellhubshop",
          ],
        })}
      </script>
    </Helmet>
  );
}
