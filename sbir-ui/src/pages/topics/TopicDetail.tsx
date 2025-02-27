import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Topic, parseTopic } from "@/types/topic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TopicDetail() {
  const { id } = useParams();
  const [topic, setTopic] = useState<Topic | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTopic() {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/topics/${id}`);
        const data = await response.json();
        setTopic(parseTopic(data));
      } catch (error) {
        console.error('Failed to fetch topic:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchTopic();
  }, [id]);

  if (loading) {
    return <div className="text-center mt-8">Loading...</div>;
  }

  if (!topic) {
    return <div className="text-center mt-8">Topic not found</div>;
  }

  return (
    <main className="ml-48 pt-24 p-8">
      <div className="max-w-3xl mx-auto">
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
          </CardContent>
        </Card>
      </div>
    </main>
  );
} 