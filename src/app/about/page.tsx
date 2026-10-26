import type { Metadata } from "next";
import InfoPage from "@/components/InfoPage";

export const metadata: Metadata = {
  title: "About",
  description: "Technology moves fast. Understanding what matters should not feel complicated. Amebo 'n Tech exists to make the digital world easier to follow, question, and understand."
};

export default function Page() {
  return (
    <InfoPage
      eyebrow="OUR STORY"
      title="About Amebo 'n Tech"
      intro="Technology moves fast. Understanding what matters should not feel complicated. Amebo 'n Tech exists to make the digital world easier to follow, question, and understand."
      sections={[
  {
    "heading": "Our purpose",
    "paragraphs": [
      "Amebo 'n Tech is a technology publication focused on stories, explainers, digital culture, and ideas shaping how people live, work, learn, and build.",
      "Our goal is to make useful technology information accessible without unnecessary noise or needless complexity."
    ]
  },
  {
    "heading": "What we cover",
    "paragraphs": [
      "We explore technology developments, digital products, software, the internet, innovation, and the people and decisions behind them.",
      "Our coverage may include explainers, practical guides, news analysis, opinions, and perspectives on the changing digital landscape."
    ]
  },
  {
    "heading": "Our approach",
    "paragraphs": [
      "We aim to publish content that is clear, relevant, responsible, and useful to readers with different levels of technical experience.",
      "We value curiosity, context, accuracy, and the willingness to correct mistakes when they are identified."
    ]
  },
  {
    "heading": "Join the conversation",
    "paragraphs": [
      "Readers can explore our stories and share constructive feedback. We welcome questions, thoughtful disagreement, and suggestions for topics worth covering."
    ]
  }
]}
    />
  );
}
