import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function CookiePolicy() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-8">
          <Badge className="mb-4 bg-green-100 text-green-700 border-0">
            Last Updated: January 15, 2025
          </Badge>
          <h1 className="text-4xl md:text-5xl font-black mb-6 text-gray-900">
            Cookie Policy
          </h1>
        </div>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-8 md:p-12">
            <div className="prose prose-lg max-w-none">
              <p className="text-gray-600 mb-6">
                We use cookies to enhance your experience on SellHubShop. By
                continuing to visit this site, you agree to our use of cookies.
              </p>

              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4 text-gray-900">
                  What are Cookies?
                </h2>
                <p className="text-gray-600 mb-4">
                  Cookies are small text files that are stored on your device
                  when you visit our website. They help us remember your
                  preferences and understand how you use our platform.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4 text-gray-900">
                  How We Use Cookies
                </h2>
                <p className="text-gray-600 mb-4">
                  We use cookies to remember your login session, understand how
                  you navigate our marketplace, and improve your overall
                  experience.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4 text-gray-900">
                  Managing Cookies
                </h2>
                <p className="text-gray-600 mb-4">
                  You can control cookies through your browser settings.
                  However, disabling cookies may affect your ability to use
                  certain features of our platform.
                </p>
              </section>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
