import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";
import { parseSolicitation, Solicitation } from "@/types";
import { ChevronDown, ChevronUp } from "lucide-react";

export default function Home() {
  const [solicitations, setSolicitations] = useState<Solicitation[]>([]);
  const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set());

  async function searchGrants(formData: FormData) {
    const searchTerm = formData.get("searchTerm");
    const response = await fetch(
      `${
        import.meta.env.VITE_API_BASE_URL
      }/solicitations/search?q=${searchTerm}`
    );
    const data = await response.json();
    setSolicitations(data.data.map(parseSolicitation));
  }

  const toggleDescription = (id: number) => {
    setExpandedCards((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  return (
    <main className="flex min-h-screen min-w-screen flex-col items-center justify-between p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold text-center mb-8">SBIR Search</h1>

        <form
          action={searchGrants}
          className="flex w-full max-w-xl mx-auto mb-8"
        >
          <Input
            type="search"
            name="searchTerm"
            placeholder="Search for grants..."
            className="flex-grow mr-2"
          />
          <Button type="submit">Search</Button>
        </form>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
          {solicitations.length > 0 ? (
            solicitations.map((solicitation) => (
              <Card key={solicitation.solicitation_id}>
                <CardHeader>
                  <CardTitle>{solicitation.solicitation_title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>
                    <strong>Agency:</strong> {solicitation.agency}
                  </p>
                  <p>
                    <strong>Branch:</strong> {solicitation.branch}
                  </p>
                  <p>
                    <strong>Status:</strong> {solicitation.current_status}
                  </p>
                  <p>
                    <strong>Close Date:</strong> {solicitation.close_date}
                  </p>

                  <div className="mt-4">
                    <button
                      onClick={() =>
                        toggleDescription(solicitation.solicitation_id)
                      }
                      className="flex items-center text-sm text-gray-500 hover:text-gray-700"
                    >
                      {expandedCards.has(solicitation.solicitation_id) ? (
                        <>
                          Hide Description{" "}
                          <ChevronUp className="ml-1 h-4 w-4" />
                        </>
                      ) : (
                        <>
                          Show Description{" "}
                          <ChevronDown className="ml-1 h-4 w-4" />
                        </>
                      )}
                    </button>

                    {expandedCards.has(solicitation.solicitation_id) && (
                      <div className="mt-2 text-sm text-gray-600">
                        {solicitation.topic_description ||
                          "No description available"}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <>
              {/* <Card>
                <CardHeader>
                  <CardTitle>Featured Grant</CardTitle>
                  <CardDescription>
                    Blueprint Neurotherapeutics Network
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p>
                    <strong>Agency:</strong> HHS
                  </p>
                  <p>
                    <strong>Branch:</strong> NIH
                  </p>
                  <p>
                    <strong>Status:</strong> Closed
                  </p>
                  <p>
                    <strong>Close Date:</strong> 2024/04/06
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Featured Grant</CardTitle>
                  <CardDescription>
                    Blueprint Medtech: Small Business Translator
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p>
                    <strong>Agency:</strong> HHS
                  </p>
                  <p>
                    <strong>Branch:</strong> NIH
                  </p>
                  <p>
                    <strong>Status:</strong> Closed
                  </p>
                  <p>
                    <strong>Close Date:</strong> 2024/06/21
                  </p>
                </CardContent>
              </Card> */}
            </>
          )}
        </div>
      </div>
    </main>
  );
}
