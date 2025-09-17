# Research Notes – Week 4  
*Author: Bradley Matera*  
*Date: September 17, 2025*

## Topic: Security and Compliance Research

This week I focused on researching security and compliance topics that directly impact the Car Match project development. The research covers SWOT analysis for project security, OWASP Top 10 web application security risks, code scanning tools evaluation, and creativity/innovation considerations from the EFF perspective.

## Sub-Topic: SWOT Analysis for Car Match Project Security

### Strengths
- **React Frontend Architecture**: Modern component-based structure makes it easier to isolate and secure individual UI components
- **Node.js/Express Backend**: Well-established security patterns and middleware available for authentication, validation, and protection
- **AWS Infrastructure Planning**: Cloud-native approach with built-in security tools (WAF, CloudFront, Cognito)
- **Mock Data Development**: Allows security testing without exposing real user data during development phase
- **Git Version Control**: Full audit trail of code changes and ability to revert problematic updates
- **Modular Component Design**: Easier to implement security controls at component level and conduct focused security reviews

### Weaknesses
- **Early Development Stage**: Security controls not yet implemented in current MVP
- **Single Developer**: Limited security review and no peer code review process currently
- **No Authentication System**: Currently using mock login without real user authentication
- **Client-Side Only**: Current implementation lacks backend security validations
- **No HTTPS Configuration**: Development environment running on HTTP
- **Missing Security Headers**: No implementation of security-focused HTTP headers

### Opportunities
- **Implement Security from Ground Up**: Chance to build security into architecture rather than retrofitting
- **GitHub Advanced Security**: Free access to CodeQL scanning and dependency review for public repositories
- **AWS Security Services**: Integration with Cognito for auth, WAF for protection, and CloudWatch for monitoring
- **Community Security Tools**: Access to open-source security linters and SAST tools
- **Security-First Development**: Opportunity to follow secure coding practices from the beginning
- **OWASP Guidelines**: Clear security standards to follow for web application development

### Threats
- **Dependency Vulnerabilities**: Third-party npm packages may contain known security flaws
- **Dating App Target**: Dating platforms are high-value targets for data breaches and social engineering
- **PII/Sensitive Data**: Will handle personal information, photos, location data, and private messages
- **Social Engineering**: Users may be targeted through the platform for malicious purposes
- **Regulatory Compliance**: May need to comply with GDPR, CCPA, and other data protection regulations
- **Scale Security Challenges**: Security complexity increases as user base grows

## Sub-Topic: OWASP Top 10 Web Application Security Risks (2021)

Based on my research of the current OWASP Top 10, here are the key risks and their relevance to Car Match:

### A01:2021 - Broken Access Control
**High Relevance**: Dating apps need strict profile access controls, message privacy, and user data isolation.
**Car Match Impact**: Must implement proper authorization for user profiles, private messages, and RSVP functionality.

### A02:2021 - Cryptographic Failures
**High Relevance**: User passwords, personal data, messages, and photos need encryption.
**Car Match Impact**: Password hashing, HTTPS everywhere, encrypted data storage for sensitive user information.

### A03:2021 - Injection
**Medium Relevance**: Search functionality and user input fields are potential injection points.
**Car Match Impact**: SQL injection prevention in user searches, XSS prevention in user profiles and messages.

### A04:2021 - Insecure Design
**High Relevance**: Security must be designed into the dating platform from the ground up.
**Car Match Impact**: Threat modeling for user interactions, secure message flows, privacy-by-design principles.

### A05:2021 - Security Misconfiguration
**Medium Relevance**: Cloud deployment requires proper configuration management.
**Car Match Impact**: Secure AWS configuration, proper CORS policies, secure headers implementation.

### A06:2021 - Vulnerable and Outdated Components
**High Relevance**: React/Node.js ecosystem has many dependencies that need monitoring.
**Car Match Impact**: Regular dependency updates, vulnerability scanning of npm packages.

### A07:2021 - Identification and Authentication Failures
**High Relevance**: Core to dating app security - user identity verification and session management.
**Car Match Impact**: Strong password policies, secure session handling, MFA consideration.

### A08:2021 - Software and Data Integrity Failures
**Medium Relevance**: CI/CD pipeline security and data validation.
**Car Match Impact**: Secure deployment processes, input validation for user data.

### A09:2021 - Security Logging and Monitoring Failures
**Medium Relevance**: Need to detect suspicious behavior and security incidents.
**Car Match Impact**: Login attempt monitoring, suspicious activity detection, audit logs.

### A10:2021 - Server-Side Request Forgery (SSRF)
**Low Relevance**: Limited external API calls planned initially.
**Car Match Impact**: If implementing external integrations, validate and sanitize URLs.

## Sub-Topic: Code Scanning Tools Research - CodeQL and Alternatives

### GitHub CodeQL
**Strengths**:
- Free for public repositories
- Integrated with GitHub workflow
- Supports JavaScript/TypeScript and future backend languages
- Extensive query library maintained by security experts
- Real-time scanning on pull requests

**Limitations**:
- Limited to supported languages (no PHP if needed later)
- Requires GitHub Advanced Security for private repos on paid plans
- May have false positives requiring manual review

### Alternative Tools Research

#### SonarQube Community Edition
- Free static analysis tool
- Supports JavaScript/TypeScript, Python, Java
- Quality gates and technical debt tracking
- Can integrate with CI/CD pipelines
- Good for code quality and basic security issues

#### ESLint Security Plugins
- eslint-plugin-security: Identifies potential security issues in Node.js code
- eslint-plugin-react-security: React-specific security rules
- Lightweight and fast
- Integrates well with existing development workflow

#### Snyk
- Focuses on dependency vulnerability scanning
- Free tier available for open source projects
- Excellent npm package vulnerability detection
- Automated PR creation for dependency updates
- Strong community and vulnerability database

#### OWASP ZAP (Zed Attack Proxy)
- Free dynamic application security testing (DAST)
- Can test running applications for vulnerabilities
- Good for testing authentication flows and session management
- Useful for penetration testing the deployed application

### Recommendation for Car Match
Implement a layered approach:
1. **GitHub CodeQL** for static analysis and security scanning
2. **ESLint security plugins** for development-time checks
3. **Snyk** for dependency vulnerability monitoring
4. **OWASP ZAP** for dynamic testing of deployed application

## Sub-Topic: EFF Creativity & Innovation Impact

### Patent and Intellectual Property Considerations
The EFF's work on patent reform and protecting innovation from patent trolls highlights the importance of:
- Using open-source technologies where possible to avoid patent issues
- Being aware of potential IP conflicts when implementing matching algorithms
- Contributing back to open-source communities when possible

### Fair Use and Content Creation
EFF's advocacy for fair use and creative remixing applies to:
- User-generated content policies for profile pictures and descriptions
- Allowing users to build on community features while respecting privacy
- Balancing content moderation with free expression

### Platform Responsibility and User Rights
EFF's work on Section 230 and platform accountability informs:
- Content moderation policies for dating platform safety
- Transparency in algorithmic matching and content filtering
- User rights to data portability and account control
- Balance between safety features and user privacy

### Digital Rights and Privacy
EFF's privacy advocacy emphasizes:
- Minimal data collection principles
- User control over personal information
- Transparency in data usage and sharing
- Resistance to surveillance capitalism models

## Implementation Impact on Car Match Development

### Immediate Actions (Next Sprint)
1. **Enable GitHub CodeQL** scanning on the repository
2. **Add ESLint security plugins** to development workflow
3. **Implement basic security headers** in React build process
4. **Set up HTTPS** for development environment
5. **Add input validation** to existing forms

### Medium-term Security Roadmap
1. **Implement Authentication System** using AWS Cognito or Auth0
2. **Add API Rate Limiting** to prevent abuse
3. **Implement Content Security Policy** (CSP) headers
4. **Set up Security Logging** and monitoring
5. **Conduct Threat Modeling** for dating app specific risks

### Long-term Security Strategy
1. **Regular Security Audits** using OWASP ZAP and manual testing
2. **Dependency Management** with automated Snyk scanning
3. **Privacy by Design** implementation for GDPR/CCPA compliance
4. **Incident Response Plan** development
5. **User Security Education** features within the app

## Next Steps

- Implement GitHub CodeQL scanning in the next development cycle
- Research AWS Cognito integration for secure authentication
- Create security-focused GitHub issues for immediate implementation items
- Begin threat modeling for dating app specific security scenarios
- Set up automated dependency vulnerability scanning

## Repo

Main repo is live and public here:  
[https://github.com/BradleyMatera/car-match](https://github.com/BradleyMatera/car-match)

## References

- OWASP Top 10 2021: https://owasp.org/www-project-top-ten/
- GitHub CodeQL Documentation: https://docs.github.com/en/code-security/code-scanning
- Electronic Frontier Foundation Creativity & Innovation: https://www.eff.org/issues/creativity-and-innovation
