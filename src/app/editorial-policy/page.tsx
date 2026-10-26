import type { Metadata } from "next";
import InfoPage from "@/components/InfoPage";

export const metadata: Metadata = {
  title: "Editorial Policy",
  description: "Readers deserve technology coverage that respects their time and makes a genuine effort to distinguish facts, analysis, and opinion."
};

export default function Page() {
  return (
    <InfoPage
      eyebrow="HOW WE WORK"
      title="Our editorial policy"
      intro="Readers deserve technology coverage that respects their time and makes a genuine effort to distinguish facts, analysis, and opinion."
      sections={[
  {
    "heading": "Accuracy and verification",
    "paragraphs": [
      "We aim to verify factual claims using reliable information and relevant primary sources where practical. Developing stories may change as new information becomes available."
    ]
  },
  {
    "heading": "Clarity and context",
    "paragraphs": [
      "We aim to explain technical concepts in accessible language without removing important context. Where uncertainty exists, responsible coverage should acknowledge it."
    ]
  },
  {
    "heading": "Opinions and analysis",
    "paragraphs": [
      "Commentary and analysis may express an interpretation or judgement. Such content should not be confused with independently established fact."
    ]
  },
  {
    "heading": "Corrections and updates",
    "paragraphs": [
      "When a material error is identified, we aim to review it and make an appropriate correction or clarification. Readers can report suspected errors through our Contact page."
    ]
  },
  {
    "heading": "Independence and conflicts",
    "paragraphs": [
      "Relevant commercial relationships or conflicts should be disclosed where applicable. Coverage should not knowingly mislead readers about a product, organisation, or event."
    ]
  },
  {
    "heading": "Community standards",
    "paragraphs": [
      "Reader participation should remain relevant and respectful. Spam, impersonation, abusive content, threats, and attempts to expose private information may be restricted or removed."
    ]
  }
]}
    />
  );
}
