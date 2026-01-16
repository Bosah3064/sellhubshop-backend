import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-8">
          <Badge className="mb-4 bg-green-100 text-green-700 border-0">
            Last Updated: January 15, 2025
          </Badge>
          <h1 className="text-4xl md:text-5xl font-black mb-6 text-gray-900">
            Privacy Policy
          </h1>
        </div>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-8 md:p-12">
            <div className="prose prose-lg max-w-none">
              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4 text-gray-900">
                  1. Information We Collect
                </h2>
                <p className="text-gray-600 mb-4">
                  We collect information that you provide directly to us when
                  using SellHubShop, including your name, email address, phone
                  number, and product listings.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4 text-gray-900">
                  2. How We Use Your Information
                </h2>
                <p className="text-gray-600 mb-4">
                  We use the information we collect to provide, maintain, and
                  improve our services, facilitate connections between buyers
                  and sellers, and communicate with you about your account.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4 text-gray-900">
                  3. Information Sharing
                </h2>
                <p className="text-gray-600 mb-4">
                  We do not sell your personal information to third parties.
                  Contact information is only shared between users when you
                  choose to connect with a seller or buyer.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4 text-gray-900">
                  4. Your Rights
                </h2>
                <p className="text-gray-600 mb-4">
                  You have the right to access, correct, or delete your personal
                  information at any time through your account settings.
                </p>
              </section>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
