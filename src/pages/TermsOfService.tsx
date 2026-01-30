import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-8">
          <Badge className="mb-4 bg-green-100 text-green-700 border-0">
            Last Updated: January 20, 2025
          </Badge>
          <h1 className="text-4xl md:text-5xl font-black mb-6 text-gray-900">
            Terms of Service
          </h1>
        </div>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-8 md:p-12">
            <div className="prose prose-lg max-w-none">
              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4 text-gray-900">
                  1. Acceptance of Terms
                </h2>
                <p className="text-gray-600 mb-4">
                  By accessing and using SellHubShop, you accept and agree to be
                  bound by these Terms of Service.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4 text-gray-900">
                  2. User Responsibilities
                </h2>
                <p className="text-gray-600 mb-4">
                  You are responsible for maintaining the confidentiality of
                  your account and for all activities that occur under your
                  account. You agree to provide accurate information and
                  communicate respectfully with other users.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4 text-gray-900">
                  3. Transactions
                </h2>
                <p className="text-gray-600 mb-4">
                  SellHubShop facilitates connections between buyers and
                  sellers. All transactions are conducted directly between
                  users. We recommend meeting in safe, public places and
                  verifying products before payment.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4 text-gray-900">
                  4. Payments
                </h2>
                <p className="text-gray-600 mb-4">
                  We accept the following payment methods for subscriptions and services:
                </p>
                <ul className="list-disc list-inside text-gray-600 mb-4 space-y-2">
                  <li><strong>M-Pesa:</strong> Mobile money payments processed via Safaricom's Lipa Na M-Pesa. Payments are in Kenyan Shillings (KES).</li>
                  <li><strong>SellHub Wallet:</strong> Payments can be made using funds pre-loaded into your SellHub account wallet.</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4 text-gray-900">
                  5. Refunds
                </h2>
                <p className="text-gray-600 mb-4">
                  Payments may be eligible for refunds within 7 days of purchase for unused subscription time or non-delivered items. Contact support for refund requests.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4 text-gray-900">
                  6. Prohibited Activities
                </h2>
                <p className="text-gray-600 mb-4">
                  You agree not to engage in illegal activities, fraud,
                  harassment, or any behavior that violates Kenyan laws while
                  using our platform.
                </p>
              </section>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
