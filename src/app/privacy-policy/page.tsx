import type { Metadata } from "next";
import InfoPage from "@/components/InfoPage";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "This policy explains, in general terms, how Amebo 'n Tech may handle information when you visit the publication or contact the team."
};

export default function Page() {
  return (
    <InfoPage
      eyebrow="YOUR PRIVACY"
      title="Privacy policy"
      intro="This policy explains, in general terms, how Amebo 'n Tech may handle information when you visit the publication or contact the team."
      sections={[
  {
    "heading": "Information you provide",
    "paragraphs": [
      "If you email us or submit information through a feature on the site, we may process the information you choose to provide so we can respond or operate that feature."
    ]
  },
  {
    "heading": "Technical information",
    "paragraphs": [
      "Our hosting provider and service providers may process technical information needed to deliver, secure, and maintain the website. The exact information depends on the services and configuration in use."
    ]
  },
  {
    "heading": "Cookies and similar technologies",
    "paragraphs": [
      "The site uses an essential, HTTP-only visitor cookie to support comment likes and help apply abuse-prevention limits. The cookie is designed to contain a random visitor identifier, not your name or comment text. It is configured to expire after one year and is marked Secure in production. You can manage or block cookies in your browser, although some features may not work correctly if you do."
    ]
  },
  {
    "heading": "Comments and public information",
    "paragraphs": [
      "When you post a comment or reply, the name and message you submit are displayed publicly alongside the relevant story. The site also stores comment replies and like records so these features can work. A random visitor identifier is used to associate your likes with your browser and help limit abuse. Do not post passwords, financial information, sensitive personal details, or anything you do not want the public to see. Public comments may be viewed, copied, or shared by other visitors."
    ]
  },
  {
    "heading": "Service providers and retention",
    "paragraphs": [
      "Information may be processed by the hosting, database, and security providers used to operate the publication. Comments and related records may remain stored while published or needed to operate the service, unless removed or retention requirements dictate otherwise. Technical and security records may be retained for operational and abuse-prevention purposes."
    ]
  },
  {
    "heading": "Your choices and questions",
    "paragraphs": [
      "You can contact us to ask about personal information you have submitted. Requests may be subject to identity verification, legal requirements, and technical limitations."
    ]
  },
  {
    "heading": "Policy updates",
    "paragraphs": [
      "This policy may be updated as the website changes. Updates will be published on this page with a revised date where appropriate."
    ]
  }
]}
    />
  );
}
