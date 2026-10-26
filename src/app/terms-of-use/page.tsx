import type { Metadata } from "next";
import InfoPage from "@/components/InfoPage";

export const metadata: Metadata = {
  title: "Terms of Use",
  description: "By accessing Amebo 'n Tech, you agree to use the publication responsibly and respect the rights of other readers and content creators."
};

export default function Page() {
  return (
    <InfoPage
      eyebrow="USING THIS SITE"
      title="Terms of use"
      intro="By accessing Amebo 'n Tech, you agree to use the publication responsibly and respect the rights of other readers and content creators."
      sections={[
  {
    "heading": "Using the publication",
    "paragraphs": [
      "You may browse the site for lawful personal and informational purposes. You must not attempt to disrupt the service, bypass security controls, or misuse any site feature."
    ]
  },
  {
    "heading": "Content and intellectual property",
    "paragraphs": [
      "Unless otherwise stated, publication content and branding are presented as the property of their respective rights holders. Do not reproduce substantial material or use branding in a way that violates applicable rights."
    ]
  },
  {
    "heading": "Reader submissions",
    "paragraphs": [
      "You are responsible for material you submit. Do not submit unlawful, threatening, harassing, deceptive, defamatory, or infringing material, or information that exposes another person's private details."
    ]
  },
  {
    "heading": "Information and availability",
    "paragraphs": [
      "Articles are provided for general information and may contain errors or become outdated. Technology information should be independently verified before being relied on for important decisions.",
      "We do not guarantee uninterrupted availability or that every article will remain unchanged."
    ]
  },
  {
    "heading": "External services and links",
    "paragraphs": [
      "The publication may reference external websites or services. Those services operate under their own terms and privacy practices, which we do not control."
    ]
  },
  {
    "heading": "Changes and contact",
    "paragraphs": [
      "These terms may be updated as the publication develops. Continued use after updated terms are published constitutes use under the revised terms to the extent permitted by applicable law.",
      "For questions about these terms, contact hello@amebontech.com."
    ]
  }
]}
    />
  );
}
