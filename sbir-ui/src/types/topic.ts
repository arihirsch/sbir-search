export type Topic = {
  topic_number: string;
  topic_title: string;
  branch: string;
  topic_description: string;
  topic_open_date: string;
  topic_closed_date: string | null;
};

export function parseTopic(data: any): Topic {
  return {
    topic_number: data.topic_number,
    topic_title: data.topic_title,
    branch: data.branch,
    topic_description: data.topic_description,
    topic_open_date: data.topic_open_date,
    topic_closed_date: data.topic_closed_date,
  };
}