import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contribute Expert Knowledge | Gaushala Network',
  description: 'Share your expert knowledge about cow care, Ayurveda, and Jyotish with the Gaushala Network community.',
};

export default function ContributePage() {
  return (
    <div className="min-h-screen bg-amber-50">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-green-900 mb-4">Share Your Expert Knowledge</h1>
          <p className="text-lg text-amber-800 max-w-2xl mx-auto">
            Your expertise can help thousands of gaushalas across India. Contribute verified knowledge
            that may be preserved permanently on the blockchain.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <Link href="/contribute/medical" className="group block">
            <div className="bg-white rounded-2xl p-8 shadow-md border-2 border-transparent hover:border-green-600 transition-all duration-200 h-full">
              <div className="text-5xl mb-4">🏥</div>
              <h2 className="text-2xl font-bold text-green-900 mb-3">Medical Expert</h2>
              <p className="text-amber-700 mb-4">
                For veterinarians, Ayurvedic doctors, and animal health experts. Share treatment protocols,
                disease management guides, and panchagavya therapeutic uses.
              </p>
              <ul className="text-sm text-amber-600 space-y-1 mb-6">
                <li>✓ Treatment protocols & case studies</li>
                <li>✓ Panchagavya therapeutic applications</li>
                <li>✓ Disease prevention & management</li>
                <li>✓ Attach images, PDFs & YouTube links</li>
              </ul>
              <span className="inline-block bg-green-700 text-white px-6 py-2 rounded-lg group-hover:bg-green-800 transition-colors">
                Submit Medical Contribution →
              </span>
            </div>
          </Link>

          <Link href="/contribute/jyotish" className="group block">
            <div className="bg-white rounded-2xl p-8 shadow-md border-2 border-transparent hover:border-amber-600 transition-all duration-200 h-full">
              <div className="text-5xl mb-4">🪐</div>
              <h2 className="text-2xl font-bold text-amber-900 mb-3">Jyotish Acharya</h2>
              <p className="text-amber-700 mb-4">
                For Jyotish Acharyas and Vedic scholars. Share graha remedies, auspicious muhurtas,
                go-daan guidance, and scripture-based insights.
              </p>
              <ul className="text-sm text-amber-600 space-y-1 mb-6">
                <li>✓ Graha remedies involving gomata</li>
                <li>✓ Muhurta guidance for go-daan</li>
                <li>✓ Scripture references & translations</li>
                <li>✓ Attach images, PDFs & YouTube links</li>
              </ul>
              <span className="inline-block bg-amber-700 text-white px-6 py-2 rounded-lg group-hover:bg-amber-800 transition-colors">
                Submit Jyotish Contribution →
              </span>
            </div>
          </Link>
        </div>

        <div className="mt-10 bg-white rounded-2xl p-6 shadow-sm border border-amber-200">
          <div className="flex items-start gap-4">
            <div className="text-3xl">⛓️</div>
            <div>
              <h3 className="font-bold text-green-900 mb-1">Blockchain Verification</h3>
              <p className="text-amber-700 text-sm">
                Outstanding contributions selected by our admin team are permanently recorded on the
                Polygon blockchain — creating an immutable certificate of your expertise and knowledge contribution.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
