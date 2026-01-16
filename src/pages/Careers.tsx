import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function Careers() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-black mb-6 text-gray-900">
            Careers
          </h1>
          <p className="text-xl text-gray-600">
            Join our team and help build Kenya's premier marketplace
          </p>
        </div>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-8 md:p-12">
            <div className="prose prose-lg max-w-none text-center">
              <p className="text-gray-600 mb-6">
                We're always looking for talented individuals to join our
                growing team. Check back soon for open positions or send us your
                resume at careers@sellhub.co.ke
              </p>

              <div className="space-y-4 mt-8">
                <p className="text-gray-600">
                  Currently, we're focused on building the best platform for
                  Kenyan buyers and sellers to connect directly.
                </p>
                <p className="text-gray-600">
                  If you're passionate about local commerce and technology, we'd
                  love to hear from you!
                </p>
              </div>

              <Button className="bg-green-600 hover:bg-green-700 mt-6">
                Contact HR
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
