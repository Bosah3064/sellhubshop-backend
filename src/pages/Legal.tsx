// PrivacyPolicy.tsx, TermsOfService.tsx, CookiePolicy.tsx
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface LegalPageProps {
  title: string;
  lastUpdated: string;
  children: React.ReactNode;
}

export default function LegalPage({
  title,
  lastUpdated,
  children,
}: LegalPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-8">
          <Badge className="mb-4 bg-green-100 text-green-700 border-0">
            Last Updated: {lastUpdated}
          </Badge>
          <h1 className="text-4xl md:text-5xl font-black mb-6 text-gray-900">
            {title}
          </h1>
        </div>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-8 md:p-12">
            <div className="prose prose-lg max-w-none">{children}</div>
          </CardContent>
        </Card>

        <div className="text-center mt-8 text-gray-600">
          <p>
            Need help understanding our policies?{" "}
            <a href="/contact" className="text-green-600 hover:underline">
              Contact us
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

// Usage for Privacy Policy:
export function PrivacyPolicy() {
  return (
    <LegalPage title="Privacy Policy" lastUpdated="January 15, 2025">
      <div className="space-y-6">
        <section>
          <h2 className="text-2xl font-bold mb-4 text-gray-900">
            1. Information We Collect
          </h2>
          <p className="text-gray-600 mb-4">
            We collect information that you provide directly to us when using
            SellHubShop...
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4 text-gray-900">
            2. How We Use Your Information
          </h2>
          <p className="text-gray-600 mb-4">
            We use the information we collect to provide, maintain, and improve
            our services...
          </p>
        </section>

        {/* Add more sections as needed */}
      </div>
    </LegalPage>
  );
}
