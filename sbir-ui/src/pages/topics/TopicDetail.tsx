import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Topic, parseTopic } from "@/types/topic";
import { Solicitation, parseSolicitation } from "@/types/solicitation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator.tsx";

export default function TopicDetail() {
  const { topicNumber, solicitationId } = useParams();
  const [topic, setTopic] = useState<Topic | null>(null);
  const [solicitation, setSolicitation] = useState<Solicitation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch topic using both parameters
        // Note: topicNumber is already URL-encoded in the URL
        const topicResponse = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/topics/${topicNumber}/${solicitationId}`
        );
        const topicData = await topicResponse.json();
        const parsedTopic = parseTopic(topicData);
        setTopic(parsedTopic);

        // Then fetch solicitation using solicitation_id from topic
        const solicitationResponse = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/solicitations/${parsedTopic.solicitation_id}`
        );
        const solicitationData = await solicitationResponse.json();
        setSolicitation(parseSolicitation(solicitationData));
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [topicNumber, solicitationId]);

  if (loading) {
    return <div className="text-center mt-8">Loading...</div>;
  }

  if (!topic) {
    return <div className="text-center mt-8">Topic not found</div>;
  }

  return (
    <main className="ml-48 pt-24 p-8">
      <div className="grid grid-cols-2 gap-8 max-w-7xl mx-auto">
        {/* Solicitation Card */}
        {solicitation && (
          <Card>
            <CardHeader>
              <CardTitle>Solicitation Details</CardTitle>
            </CardHeader>
            <CardContent>
              <p><strong>Agency:</strong> {solicitation.agency}</p>
              <p><strong>Phase:</strong> {solicitation.phase}</p>
              <p><strong>Program:</strong> {solicitation.program}</p>
              <p><strong>Year:</strong> {solicitation.solicitation_year}</p>
              <p><strong>Title:</strong> {solicitation.solicitation_title}</p>
              <p><strong>Release Date:</strong> {solicitation.release_date || 'Not specified'}</p>
              <p><strong>Open Date:</strong> {solicitation.open_date || 'Not specified'}</p>
              <p><strong>Close Date:</strong> {solicitation.close_date || 'Not specified'}</p>
              <p>
                <strong>Status:</strong>{' '}
                <span className={solicitation.current_status === 'open' ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                  {solicitation.current_status || 'Unknown'}
                </span>
              </p>

              {solicitation.application_due_dates && solicitation.application_due_dates.length > 0 && (
                <>
                  {/* Upcoming due dates */}
                  {solicitation.application_due_dates.some(date => new Date(date) >= new Date()) && (
                    <div className="mt-2">
                      <strong>Upcoming Due Dates:</strong>
                      <ul className="list-disc ml-6">
                        {solicitation.application_due_dates
                          .filter(date => new Date(date) >= new Date())
                          .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
                          .map((date, index) => (
                            <li key={index} className="text-green-600">
                              {new Date(date).toLocaleDateString()}
                            </li>
                          ))}
                      </ul>
                    </div>
                  )}
                  
                  {/* Prior due dates */}
                  {solicitation.application_due_dates.some(date => new Date(date) < new Date()) && (
                    <div className="mt-2">
                      <strong>Prior Due Dates:</strong>
                      <ul className="list-disc ml-6">
                        {solicitation.application_due_dates
                          .filter(date => new Date(date) < new Date())
                          .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
                          .map((date, index) => (
                            <li key={index} className="text-gray-500">
                              {new Date(date).toLocaleDateString()}
                            </li>
                          ))}
                      </ul>
                    </div>
                  )}
                </>
              )}

              <p>
                <strong>Agency Link:</strong>{' '}
                <a 
                  href={solicitation.solicitation_agency_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  View Solicitation
                </a>
              </p>
            </CardContent>
          </Card>
        )}

        {/* Topic Card */}
        <Card>
          <CardHeader>
            <CardTitle>{topic.topic_title}</CardTitle>
          </CardHeader>
          <CardContent>
            <p><strong>Topic Number:</strong> {topic.topic_number}</p>
            <p><strong>Branch:</strong> {topic.branch}</p>
            <p><strong>Open Date:</strong> {topic.topic_open_date}</p>
            <p><strong>Close Date:</strong> {topic.topic_closed_date || 'Not specified'}</p>
            <p>
              <strong>SBIR Topic Link:</strong>{' '}
              <a 
                href={topic.sbir_topic_link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 underline"
              >
                View Original Topic
              </a>
            </p>
            <div className="mt-4">
              <h3 className="font-semibold mb-2">Description</h3>
              <p className="whitespace-pre-wrap">{topic.topic_description}</p>
            </div>

            {topic.subtopics && topic.subtopics.length > 0 && (
              <div className="mt-6">
                <Separator className="my-4" />
                <h3 className="font-semibold mb-4">Subtopics</h3>
                {topic.subtopics.map((subtopic) => (
                  <div key={subtopic.subtopic_id} className="mb-6">
                    <h4 className="font-medium mb-2">
                      Subtopic {subtopic.subtopic_number}
                    </h4>
                    <p className="whitespace-pre-wrap mb-2">
                      Title: {subtopic.subtopic_title}
                    </p>
                    <p className="text-sm text-gray-600 whitespace-pre-wrap">
                      Description: {subtopic.subtopic_description}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
} 