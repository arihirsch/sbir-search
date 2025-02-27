import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Award, parseAward } from "@/types/award";

export default function Awards() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [data, setData] = useState<Award[]>([]);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(searchParams.get("q") || '');

  useEffect(() => {
    fetchData();
  }, [searchParams]);

  async function fetchData() {
    setLoading(true);
    try {
      let url = `${import.meta.env.VITE_API_BASE_URL}/awards`;
      if (searchTerm) {
        url = `${import.meta.env.VITE_API_BASE_URL}/awards/search?q=${searchTerm}`;
      }
      const response = await fetch(url);
      const responseData = await response.json();
      setData(responseData.data.map(parseAward));
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSearch(formData: FormData) {
    const searchTermValue = formData.get("searchTerm") as string;
    setSearchTerm(searchTermValue);
    setSearchParams(params => {
      if (searchTermValue) {
        params.set("q", searchTermValue);
      } else {
        params.delete("q");
      }
      return params;
    });
  }

  const toggleDescription = (id: string) => {
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
    <main className="ml-48 p-24">
      <div className="max-w-5xl mx-auto">
        <form
          action={handleSearch}
          className="flex w-full max-w-xl mx-auto mb-8"
        >
          <Input
            type="search"
            name="searchTerm"
            placeholder="Search awards..."
            className="flex-grow mr-2"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Button type="submit">Search</Button>
        </form>

        <div className="text-center mb-8 text-gray-600">
          {loading ? "Loading awards..." : `Found ${data.length} awards`}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {loading ? (
            <div className="col-span-2 text-center">Loading...</div>
          ) : data.length > 0 ? (
            data.map((award) => (
              <Card key={award.award_link}>
                <CardHeader>
                  <CardTitle>{award.award_title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p><strong>Company:</strong> {award.firm}</p>
                  <p><strong>Amount:</strong> ${award.award_amount.toLocaleString()}</p>
                  <p><strong>Year:</strong> {award.award_year}</p>
                  <p><strong>Agency:</strong> {award.agency}</p>
                  <p><strong>Branch:</strong> {award.branch}</p>
                  <p><strong>Phase:</strong> {award.phase}</p>

                  <div className="mt-4">
                    <button
                      onClick={() => toggleDescription(award.award_link.toString())}
                      className="flex items-center text-sm text-gray-500 hover:text-gray-700"
                    >
                      {expandedCards.has(award.award_link.toString()) ? (
                        <>Hide Abstract <ChevronUp className="ml-1 h-4 w-4" /></>
                      ) : (
                        <>Show Abstract <ChevronDown className="ml-1 h-4 w-4" /></>
                      )}
                    </button>
                    
                    {expandedCards.has(award.award_link.toString()) && (
                      <div className="mt-2 text-sm text-gray-600">
                        {award.abstract || "No abstract available"}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-2 text-center">No awards found</div>
          )}
        </div>
      </div>
    </main>
  );
} 