import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const PrivacyPolicy = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <div className="prose prose-sm dark:prose-invert max-w-none">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Privacy Policy
          </h1>
          <p className="text-muted-foreground mb-8">
            Last updated: January 31, 2026
          </p>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">
              1. Introduction
            </h2>
            <p className="text-muted-foreground mb-4">
              Welcome to Jie Jie 姐姐 心連站 ("we," "our," or "us"). We are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application and web service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">
              2. Information We Collect
            </h2>
            <h3 className="text-lg font-medium text-foreground mb-2">
              2.1 Personal Information
            </h3>
            <p className="text-muted-foreground mb-4">
              When you create an account and use our service, we may collect:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground mb-4">
              <li>Name and contact information (email, phone number)</li>
              <li>Employment details (position, department, employee ID)</li>
              <li>Identity documents (ID number, passport, visa information)</li>
              <li>Emergency contact information</li>
              <li>Profile photo</li>
              <li>Date of birth and marital status</li>
              <li>Home address</li>
            </ul>

            <h3 className="text-lg font-medium text-foreground mb-2">
              2.2 Employment Data
            </h3>
            <ul className="list-disc pl-6 text-muted-foreground mb-4">
              <li>Leave requests and balances</li>
              <li>Payroll information and salary details</li>
              <li>Work schedules</li>
              <li>Task assignments and completion status</li>
              <li>Cash transactions and expense claims</li>
            </ul>

            <h3 className="text-lg font-medium text-foreground mb-2">
              2.3 Documents
            </h3>
            <ul className="list-disc pl-6 text-muted-foreground mb-4">
              <li>Uploaded documents (contracts, receipts, certificates)</li>
              <li>Document metadata (upload date, file size, type)</li>
            </ul>

            <h3 className="text-lg font-medium text-foreground mb-2">
              2.4 Communication Data
            </h3>
            <ul className="list-disc pl-6 text-muted-foreground mb-4">
              <li>Chat messages between employers and employees</li>
              <li>Document comments and discussions</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">
              3. How We Use Your Information
            </h2>
            <p className="text-muted-foreground mb-4">
              We use the collected information to:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground mb-4">
              <li>Provide and maintain our service</li>
              <li>Process leave requests and manage leave balances</li>
              <li>Generate and manage payroll records</li>
              <li>Facilitate communication between employers and employees</li>
              <li>Store and manage employment documents</li>
              <li>Track tasks and work assignments</li>
              <li>Send notifications about important updates</li>
              <li>Improve our service and user experience</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">
              4. Data Sharing and Disclosure
            </h2>
            <p className="text-muted-foreground mb-4">
              We do not sell your personal information. We may share your data only:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground mb-4">
              <li><strong>Within your organization:</strong> Employers can view employee information; employees can view their own information</li>
              <li><strong>With service providers:</strong> We use Supabase for secure data storage and authentication</li>
              <li><strong>For legal compliance:</strong> When required by law or to protect our rights</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">
              5. Data Security
            </h2>
            <p className="text-muted-foreground mb-4">
              We implement industry-standard security measures including:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground mb-4">
              <li>Encryption of data in transit (HTTPS/TLS)</li>
              <li>Encryption of data at rest</li>
              <li>Role-based access controls</li>
              <li>Regular security audits</li>
              <li>Secure authentication with password hashing</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">
              6. Data Retention
            </h2>
            <p className="text-muted-foreground mb-4">
              We retain your personal information for as long as your account is active or as needed to provide services. Employment records may be retained for legal compliance purposes. You may request deletion of your data by contacting us.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">
              7. Your Rights
            </h2>
            <p className="text-muted-foreground mb-4">
              You have the right to:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground mb-4">
              <li>Access your personal information</li>
              <li>Correct inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Export your data</li>
              <li>Withdraw consent for data processing</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">
              8. Children's Privacy
            </h2>
            <p className="text-muted-foreground mb-4">
              Our service is not intended for individuals under 18 years of age. We do not knowingly collect personal information from children.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">
              9. Changes to This Policy
            </h2>
            <p className="text-muted-foreground mb-4">
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the "Last updated" date.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">
              10. Contact Us
            </h2>
            <p className="text-muted-foreground mb-4">
              If you have questions about this Privacy Policy or our data practices, please contact us at:
            </p>
            <p className="text-muted-foreground">
              <strong>Email:</strong>{" "}
              <a 
                href="mailto:orefratello@yahoo.com" 
                className="text-primary hover:underline"
              >
                orefratello@yahoo.com
              </a>
            </p>
          </section>

          <div className="border-t pt-8 mt-8">
            <p className="text-sm text-muted-foreground text-center">
              © 2026 Jie Jie 姐姐 心連站. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
