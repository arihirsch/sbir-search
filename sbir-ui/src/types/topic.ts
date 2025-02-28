export type Topic = {
  topic_number: string;
  solicitation_id: number;
  topic_title: string;
  branch: string;
  topic_description: string;
  sbir_topic_link: string;
  topic_open_date: string;
  topic_closed_date: string | null;
  subtopics?: Subtopic[];
};

export function parseTopic(data: any): Topic {
  return {
    topic_number: data.topic_number,
    solicitation_id: data.solicitation_id,
    topic_title: data.topic_title,
    branch: data.branch,
    topic_description: data.topic_description,
    sbir_topic_link: data.sbir_topic_link,
    topic_open_date: data.topic_open_date,
    topic_closed_date: data.topic_closed_date,
    subtopics: data.subtopics,
  };
}

export interface Subtopic {
  subtopic_id: number;
  subtopic_number: string;
  subtopic_title: string;
  subtopic_description: string;
}