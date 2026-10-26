import type { Metadata } from "next";
import InfoPage from "@/components/InfoPage";

export const metadata: Metadata = {
  title: "Contact",
  description: "Have a story idea, a correction, a question, or a proposal for collaboration? We welcome messages from readers, creators, and technology communities."
};

export default function Page() {
  return (
    <InfoPage
      eyebrow="GET IN TOUCH"
      title="Contact the team"
      intro="Have a story idea, a correction, a question, or a proposal for collaboration? We welcome messages from readers, creators, and technology communities."
      sections={[
  {
    "heading": "General enquiries",
    "paragraphs": [
      "For general questions, feedback, and publication enquiries, email hello@amebontech.com.",
      "Please include a clear subject so your message can be understood and directed appropriately."
    ]
  },
  {
    "heading": "Story ideas and corrections",
    "paragraphs": [
      "If you have a relevant story tip, a suggestion for coverage, or evidence that something we published needs correcting, contact us with the details and supporting sources where possible."
    ]
  },
  {
    "heading": "Partnerships and collaboration",
    "paragraphs": [
      "We welcome relevant proposals for interviews, educational initiatives, and editorial collaborations. Please describe the proposal and any relevant deadlines."
    ]
  },
  {
    "heading": "Before you send",
    "paragraphs": [
      "Please do not send passwords, payment details, private authentication codes, or other sensitive personal information by email.",
      "Contacting us does not guarantee publication, a response by a particular date, or acceptance of a proposal."
    ]
  }
]}
    />
  );
}
