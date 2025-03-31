export default function About() {
  return (
    <main className="max-w-3xl mx-auto px-4">
      <h3 className="text-3xl font-bold mb-8 text-center">About SBIRSpy</h3>
      <div className="prose prose-lg max-w-none">
        <section className="mb-8">
          <p className="text-lg">
            SBIRSpy is a tool designed to help entrepreneurs, capture professionals, investors, and others
            navigate the maze of Small Business Innovation Research (SBIR) and Small 
            Business Technology Transfer (STTR) opportunities across federal agencies.
          </p>
          
          <p className="text-lg mt-4">
            We believe that it is still too hard to find the right opportunities for your business.
            <br />
            So we built SBIRSpy to make it easier.
          </p>
        </section>
        
        <section className="mb-8">
          <h2 className="text-1xl font-semibold mb-4">Current Features</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>LLM enabled search that goes far beyond simple keyword search</li>
            <li>Current and past SBIR/STTR topics</li>
            <li>Prior award information</li>
            <li>Company profiles</li>
          </ul>
        </section>
        
        <section className="mb-8">
          <h2 className="text-1xl font-semibold mb-4">Coming Soon</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>User profiles, saved searches, and email alerts</li>
            <li>Contract opportunity dashboard, news, and upcoming RFPs</li>
            <li>DoD PEO director profiles and contact information</li>
            <li>Expanded contract opportunities beyond SBIR/STTR</li>
          </ul>
        </section>
        
        <section className="mt-10 pt-6 border-t border-gray-200">
          <p className="text-center">
            Contact us at <a href="mailto:millen@sbirspy.com" className="text-blue-600 hover:underline">hello@sbirspy.com</a> with feedback and suggestions.
          </p>
          <p className="text-center mt-4">
            Built by <a href="https://www.linkedin.com/in/millen-anand/" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">Millen Anand</a> and <a href="https://www.linkedin.com/in/ari-hirsch-77551418a/" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">Ari Hirsch</a>.
          </p>
        </section>
      </div>
    </main>
  );
} 