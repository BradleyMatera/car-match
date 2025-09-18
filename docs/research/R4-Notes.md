# Week 4 Research: Security and Compliance

## SWOT Analysis

### Strengths
- **Modern Tech Stack:** Our stack (MERN) has a large community and many security resources.
- **Modular Architecture:** The separation of frontend and backend can help isolate security issues.

### Weaknesses
- **Limited Security Expertise:** The team is small and lacks a dedicated security expert.
- **No Automated Security Testing:** We currently don't have automated security scanning in our CI/CD pipeline.

### Opportunities
- **Implement DevSecOps:** We can integrate security practices into our development process.
- **Open Source Tools:** We can leverage open-source security tools to improve our security posture.

### Threats
- **Outdated Dependencies:** Vulnerabilities in dependencies are a major threat.
- **Common Web Vulnerabilities:** We are susceptible to common attacks like XSS and CSRF without proper defenses.

## OWASP Top 10 Web App Security Risks

1.  **Broken Access Control:** We need to ensure that our role-based access control is properly implemented.
2.  **Cryptographic Failures:** We must use strong encryption for data in transit and at rest.
3.  **Injection:** We need to validate and sanitize all user input to prevent injection attacks.
4.  **Insecure Design:** Security should be a consideration from the start of the development process.
5.  **Security Misconfiguration:** We need to ensure that our servers and frameworks are securely configured.
6.  **Vulnerable and Outdated Components:** We must keep our dependencies up to date.
7.  **Identification and Authentication Failures:** We need to implement secure authentication and session management.
8.  **Software and Data Integrity Failures:** We need to protect against unauthorized modification of our code and data.
9.  **Security Logging and Monitoring Failures:** We need to implement robust logging and monitoring to detect security incidents.
10. **Server-Side Request Forgery (SSRF):** We need to validate all URLs and APIs that our server interacts with.

## Code Scanning with CodeQL: Alternatives

- **Snyk:** A popular tool that provides code scanning, dependency scanning, and container scanning.
- **SonarQube:** An open-source platform for continuous inspection of code quality to perform automatic reviews with static analysis of code to detect bugs, code smells, and security vulnerabilities.
- **Veracode:** A comprehensive AppSec platform that provides a wide range of security testing tools.

## Creativity & Innovation (EFF)

I reviewed the articles on the EFF's "Creativity & Innovation" page. A key takeaway is the importance of fair use and the dangers of overly broad copyright laws in stifling innovation. This is relevant to our project as we plan to allow users to upload content. We need to be mindful of copyright issues and have a clear policy on user-generated content.
