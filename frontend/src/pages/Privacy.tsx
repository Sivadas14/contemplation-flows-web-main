const Privacy = () => {
    return (
        <div className="h-full overflow-y-auto p-4 pt-16" style={{ backgroundColor: 'rgb(236, 229, 223)' }}>
            <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg p-8 md:p-12">
                {/* Header */}
                <h1 className="text-4xl md:text-5xl font-heading text-brand-heading mb-4">
                    PRIVACY POLICY
                </h1>
                <p className="text-sm text-brand-body font-body mb-8">
                    <strong>Last updated April 18, 2026</strong>
                </p>

                {/* Introduction */}
                <div className="mb-8">
                    <p className="text-brand-body font-body mb-4 leading-relaxed">
                        This Privacy Policy for <strong>Arunachala Samudra</strong> ('<strong>we</strong>', '<strong>us</strong>', or '<strong>our</strong>') describes how and why we collect, store, use, and share ('<strong>process</strong>') your personal information when you use our services ('<strong>Services</strong>'), including when you:
                    </p>
                    <ul className="list-disc list-inside ml-4 mb-4 text-brand-body font-body space-y-2">
                        <li>Visit our website at <a href="https://arunachalasamudra.co.in" target="_blank" rel="noopener noreferrer" className="text-brand-button hover:underline">https://arunachalasamudra.co.in</a> or any website of ours that links to this Privacy Policy</li>
                        <li>Use our AI-powered spiritual wisdom platform, including our chat and contemplation features</li>
                        <li>Engage with us in other related ways, including marketing or events</li>
                    </ul>
                    <p className="text-brand-body font-body leading-relaxed">
                        <strong>Questions or concerns?</strong> Reading this Privacy Policy will help you understand your privacy rights and choices. If you do not agree with our policies and practices, please do not use our Services. For questions or concerns, please contact us at <a href="mailto:info@arunachalasamudra.in" className="text-brand-button hover:underline">info@arunachalasamudra.in</a>.
                    </p>
                </div>

                {/* Summary of Key Points */}
                <div className="mb-8">
                    <h2 className="text-2xl md:text-3xl font-heading text-brand-heading mb-4">
                        SUMMARY OF KEY POINTS
                    </h2>
                    <p className="text-brand-body font-body mb-4 leading-relaxed italic">
                        <strong>This summary provides key points from our Privacy Policy. You can find more details about any topic by clicking the link after each point or by using the table of contents below.</strong>
                    </p>

                    <div className="space-y-4 text-brand-body font-body">
                        <p className="leading-relaxed">
                            <strong>What personal information do we process?</strong> When you visit, use, or navigate our Services, we may process personal information depending on how you interact with us, the choices you make, and the products and features you use. Learn more in <a href="#section1" className="text-brand-button hover:underline">Section 1</a>.
                        </p>
                        <p className="leading-relaxed">
                            <strong>Do we process sensitive personal information?</strong> We do not process sensitive personal information such as racial or ethnic origins, sexual orientation, or religious beliefs.
                        </p>
                        <p className="leading-relaxed">
                            <strong>Do we collect information from third parties?</strong> We do not collect any information from third parties, except for profile data when you use a social login.
                        </p>
                        <p className="leading-relaxed">
                            <strong>How do we process your information?</strong> We process your information to provide, improve, and administer our Services, communicate with you, for security and fraud prevention, and to comply with law. Learn more in <a href="#section2" className="text-brand-button hover:underline">Section 2</a>.
                        </p>
                        <p className="leading-relaxed">
                            <strong>AI chat data:</strong> Conversations with our AI are processed by third-party AI providers (Anthropic Claude). Conversations are not used to train AI models and are retained for service delivery and safety monitoring only.
                        </p>
                        <p className="leading-relaxed">
                            <strong>How do we keep your information safe?</strong> We have organisational and technical processes in place to protect your personal information. No electronic transmission over the internet is 100% secure. Learn more in <a href="#section8" className="text-brand-button hover:underline">Section 8</a>.
                        </p>
                        <p className="leading-relaxed">
                            <strong>What are your rights?</strong> Under India's Digital Personal Data Protection Act 2023, you have rights regarding your personal data. Learn more in <a href="#section10" className="text-brand-button hover:underline">Section 10</a>.
                        </p>
                    </div>
                </div>

                {/* Table of Contents */}
                <div className="mb-8 bg-gray-50 p-6 rounded-lg">
                    <h2 className="text-2xl font-heading text-brand-heading mb-4">
                        TABLE OF CONTENTS
                    </h2>
                    <ol className="list-decimal list-inside space-y-2 text-brand-body font-body">
                        <li><a href="#section1" className="text-brand-button hover:underline">WHAT INFORMATION DO WE COLLECT?</a></li>
                        <li><a href="#section2" className="text-brand-button hover:underline">HOW DO WE PROCESS YOUR INFORMATION?</a></li>
                        <li><a href="#section3" className="text-brand-button hover:underline">WHAT LEGAL BASES DO WE RELY ON TO PROCESS YOUR PERSONAL INFORMATION?</a></li>
                        <li><a href="#section4" className="text-brand-button hover:underline">WHEN AND WITH WHOM DO WE SHARE YOUR PERSONAL INFORMATION?</a></li>
                        <li><a href="#section5" className="text-brand-button hover:underline">HOW DO WE USE ARTIFICIAL INTELLIGENCE?</a></li>
                        <li><a href="#section6" className="text-brand-button hover:underline">COOKIES AND TRACKING TECHNOLOGIES</a></li>
                        <li><a href="#section7" className="text-brand-button hover:underline">HOW DO WE HANDLE YOUR SOCIAL LOGINS?</a></li>
                        <li><a href="#section8" className="text-brand-button hover:underline">HOW LONG DO WE KEEP YOUR INFORMATION?</a></li>
                        <li><a href="#section9" className="text-brand-button hover:underline">HOW DO WE KEEP YOUR INFORMATION SAFE?</a></li>
                        <li><a href="#section10" className="text-brand-button hover:underline">DO WE COLLECT INFORMATION FROM MINORS?</a></li>
                        <li><a href="#section11" className="text-brand-button hover:underline">WHAT ARE YOUR PRIVACY RIGHTS?</a></li>
                        <li><a href="#section12" className="text-brand-button hover:underline">RIGHTS OF INDIAN RESIDENTS (DPDP ACT 2023)</a></li>
                        <li><a href="#section13" className="text-brand-button hover:underline">CONTROLS FOR DO-NOT-TRACK FEATURES</a></li>
                        <li><a href="#section14" className="text-brand-button hover:underline">DO WE MAKE UPDATES TO THIS POLICY?</a></li>
                        <li><a href="#section15" className="text-brand-button hover:underline">HOW CAN YOU CONTACT US ABOUT THIS POLICY?</a></li>
                        <li><a href="#section16" className="text-brand-button hover:underline">HOW CAN YOU REVIEW, UPDATE, OR DELETE YOUR DATA?</a></li>
                    </ol>
                </div>

                {/* Section 1 */}
                <div id="section1" className="mb-8">
                    <h2 className="text-2xl md:text-3xl font-heading text-brand-heading mb-4">
                        1. WHAT INFORMATION DO WE COLLECT?
                    </h2>
                    <h3 className="text-xl font-heading text-brand-heading mb-3">
                        Personal information you provide to us
                    </h3>
                    <p className="text-brand-body font-body mb-4 leading-relaxed">
                        <strong><em>In Short:</em></strong> <em>We collect personal information that you voluntarily provide to us.</em>
                    </p>
                    <p className="text-brand-body font-body mb-4 leading-relaxed">
                        We collect personal information that you voluntarily provide when you register on the Services, subscribe to a plan, participate in activities on the Services, or otherwise contact us.
                    </p>
                    <p className="text-brand-body font-body mb-3 leading-relaxed">
                        <strong>Personal Information we may collect includes:</strong>
                    </p>
                    <ul className="list-disc list-inside ml-4 mb-4 text-brand-body font-body space-y-1">
                        <li>Full name</li>
                        <li>Email address</li>
                        <li>Phone number (if provided)</li>
                        <li>Billing address</li>
                        <li>Username and password (stored encrypted)</li>
                        <li>Profile picture (if provided via social login)</li>
                    </ul>
                    <p className="text-brand-body font-body mb-4 leading-relaxed">
                        <strong>Sensitive Information.</strong> We do not process sensitive personal information (e.g., caste, religion, health data, biometric data, financial account details other than payment tokens).
                    </p>
                    <p className="text-brand-body font-body mb-4 leading-relaxed">
                        <strong>Payment Data.</strong> We collect data necessary to process your payment if you make a purchase, such as your payment instrument number and associated security code. All payment data is handled and stored by our payment processors:
                    </p>
                    <ul className="list-disc list-inside ml-4 mb-4 text-brand-body font-body space-y-2">
                        <li><strong>Polar</strong> (international payments) — Privacy notice: <a href="https://polar.sh/legal/privacy" target="_blank" rel="noopener noreferrer" className="text-brand-button hover:underline">https://polar.sh/legal/privacy</a></li>
                        <li><strong>Razorpay</strong> (India payments) — Privacy policy: <a href="https://razorpay.com/privacy/" target="_blank" rel="noopener noreferrer" className="text-brand-button hover:underline">https://razorpay.com/privacy/</a></li>
                    </ul>
                    <p className="text-brand-body font-body mb-4 leading-relaxed">
                        We do not store your full card number or CVV on our servers.
                    </p>
                    <p className="text-brand-body font-body mb-4 leading-relaxed">
                        <strong>AI Conversation Data.</strong> When you use our AI-powered chat features, your conversation inputs and the AI's responses are processed in real time. We may retain conversation logs for service delivery, safety monitoring, and quality improvement. We do not use your conversations to train AI models. Conversations are associated with your account if you are logged in; guest conversations are associated with a temporary session identifier.
                    </p>
                    <p className="text-brand-body font-body mb-4 leading-relaxed">
                        <strong>Social Media Login Data.</strong> If you register using a social media account (e.g., Google), we receive certain profile information such as your name and email address from that provider.
                    </p>
                    <h3 className="text-xl font-heading text-brand-heading mb-3 mt-6">
                        Information automatically collected
                    </h3>
                    <p className="text-brand-body font-body mb-4 leading-relaxed">
                        <strong><em>In Short:</em></strong> <em>Some information — such as your IP address and browser/device characteristics — is collected automatically when you visit our Services.</em>
                    </p>
                    <p className="text-brand-body font-body mb-3 leading-relaxed">
                        We automatically collect certain information when you visit, use, or navigate the Services. This information does not reveal your specific identity but may include:
                    </p>
                    <ul className="list-disc list-inside ml-4 mb-4 text-brand-body font-body space-y-1">
                        <li>Log and usage data (IP address, browser type, pages visited, time spent)</li>
                        <li>Device data (device type, operating system, unique device identifiers)</li>
                        <li>Location data (country or city, derived from IP address)</li>
                        <li>Cookies and similar tracking data (see Section 6)</li>
                    </ul>
                    <p className="text-brand-body font-body leading-relaxed">
                        All personal information you provide must be true, complete, and accurate. You must notify us of any changes.
                    </p>
                </div>

                {/* Section 2 */}
                <div id="section2" className="mb-8">
                    <h2 className="text-2xl md:text-3xl font-heading text-brand-heading mb-4">
                        2. HOW DO WE PROCESS YOUR INFORMATION?
                    </h2>
                    <p className="text-brand-body font-body mb-4 leading-relaxed">
                        <strong><em>In Short:</em></strong> <em>We process your information to provide, improve, and administer our Services, communicate with you, for security and fraud prevention, and to comply with law.</em>
                    </p>
                    <p className="text-brand-body font-body mb-3 leading-relaxed">
                        We process your personal information for the following reasons:
                    </p>
                    <ul className="list-disc list-inside ml-4 text-brand-body font-body space-y-2">
                        <li><strong>To create and manage your account.</strong> We process your information so you can register, log in, and maintain your account.</li>
                        <li><strong>To deliver the AI spiritual wisdom service.</strong> We process your conversation inputs to generate AI responses based on the teachings of Sri Ramana Maharshi and related spiritual literature.</li>
                        <li><strong>To process payments and fulfil subscriptions.</strong> We process billing information to manage your subscription, process transactions, and send receipts.</li>
                        <li><strong>To respond to inquiries and provide support.</strong> We process your information to respond to questions and resolve issues.</li>
                        <li><strong>To send transactional communications.</strong> We send account-related emails such as registration confirmations, OTP codes, and subscription updates.</li>
                        <li><strong>To send marketing communications.</strong> With your consent, we may send newsletters or promotional content about our Services. You may opt out at any time.</li>
                        <li><strong>To protect our Services.</strong> We process information to detect, prevent, and investigate fraud, abuse, and security incidents.</li>
                        <li><strong>To comply with legal obligations.</strong> We process information as required by applicable law, including tax and regulatory obligations.</li>
                        <li><strong>To identify usage trends and improve the platform.</strong> We analyse usage data to understand how our Services are used and to improve them.</li>
                    </ul>
                </div>

                {/* Section 3 */}
                <div id="section3" className="mb-8">
                    <h2 className="text-2xl md:text-3xl font-heading text-brand-heading mb-4">
                        3. WHAT LEGAL BASES DO WE RELY ON TO PROCESS YOUR PERSONAL INFORMATION?
                    </h2>
                    <p className="text-brand-body font-body mb-4 leading-relaxed">
                        <strong><em>In Short:</em></strong> <em>We only process your personal information when we have a valid legal reason to do so.</em>
                    </p>
                    <p className="text-brand-body font-body mb-4 leading-relaxed">
                        For users in India, we process personal data under India's <strong>Digital Personal Data Protection Act, 2023 (DPDP Act)</strong>. Our lawful bases include:
                    </p>
                    <ul className="list-disc list-inside ml-4 mb-4 text-brand-body font-body space-y-2">
                        <li><strong>Consent.</strong> We process your data where you have given us consent. You may withdraw consent at any time by contacting us, noting that withdrawal does not affect prior processing.</li>
                        <li><strong>Contractual necessity.</strong> Processing necessary to provide the Services you have subscribed to or agreed to receive.</li>
                        <li><strong>Legitimate uses.</strong> Processing necessary for purposes specified under the DPDP Act as legitimate, such as safety, fraud prevention, and complying with court orders.</li>
                        <li><strong>Legal obligation.</strong> Processing required by applicable Indian law, regulations, or government orders.</li>
                    </ul>
                    <p className="text-brand-body font-body mb-4 leading-relaxed">
                        For users in the European Economic Area (EEA) or United Kingdom, we additionally rely on the lawful bases under the General Data Protection Regulation (GDPR): consent, performance of a contract, legitimate interests, and legal obligations.
                    </p>
                </div>

                {/* Section 4 */}
                <div id="section4" className="mb-8">
                    <h2 className="text-2xl md:text-3xl font-heading text-brand-heading mb-4">
                        4. WHEN AND WITH WHOM DO WE SHARE YOUR PERSONAL INFORMATION?
                    </h2>
                    <p className="text-brand-body font-body mb-4 leading-relaxed">
                        <strong><em>In Short:</em></strong> <em>We share information only in specific, limited situations described below.</em>
                    </p>
                    <p className="text-brand-body font-body mb-3 leading-relaxed">
                        We may share your personal information in the following situations:
                    </p>
                    <ul className="list-disc list-inside ml-4 text-brand-body font-body space-y-2">
                        <li><strong>AI service providers.</strong> Your conversation inputs are sent to Anthropic (makers of Claude AI) to generate responses. Anthropic processes this data under their own privacy policy. We do not share your name or contact information with Anthropic.</li>
                        <li><strong>Payment processors.</strong> Billing information is shared with Polar and/or Razorpay to process your payments. These processors are contractually bound to protect your data.</li>
                        <li><strong>Infrastructure providers.</strong> We use cloud infrastructure providers (such as AWS, Supabase) to host and operate our Services. These providers store and process data on our behalf under data processing agreements.</li>
                        <li><strong>Legal requirements.</strong> We may disclose your information if required by law, court order, or government authority, including under the Information Technology Act 2000, DPDP Act 2023, or other applicable Indian legislation.</li>
                        <li><strong>Business transfers.</strong> In the event of a merger, acquisition, or sale of assets, your information may be transferred to the acquiring entity. You will be notified via email or a prominent notice on our Services.</li>
                        <li><strong>With your consent.</strong> We may share your information with third parties with your explicit consent.</li>
                    </ul>
                    <p className="text-brand-body font-body mt-4 leading-relaxed">
                        We do not sell, rent, or trade your personal information to third parties for their own marketing purposes.
                    </p>
                </div>

                {/* Section 5 */}
                <div id="section5" className="mb-8">
                    <h2 className="text-2xl md:text-3xl font-heading text-brand-heading mb-4">
                        5. HOW DO WE USE ARTIFICIAL INTELLIGENCE?
                    </h2>
                    <p className="text-brand-body font-body mb-4 leading-relaxed">
                        <strong><em>In Short:</em></strong> <em>Our platform is powered by AI to provide spiritual wisdom responses based on the teachings of Sri Ramana Maharshi and related non-dual traditions.</em>
                    </p>
                    <p className="text-brand-body font-body mb-4 leading-relaxed">
                        <strong>AI Technology Used:</strong> We use large language models provided by <strong>Anthropic (Claude)</strong> to power our conversational spiritual guidance feature. Your conversation inputs are transmitted to Anthropic's API, processed, and the AI-generated response is returned to you in real time.
                    </p>
                    <p className="text-brand-body font-body mb-4 leading-relaxed">
                        <strong>Data sent to AI providers:</strong> Only your conversation text (the message you type) is sent to the AI provider. We do not transmit your email address, billing information, or account details to AI service providers.
                    </p>
                    <p className="text-brand-body font-body mb-4 leading-relaxed">
                        <strong>AI training:</strong> Your conversations are not used by us to train or fine-tune any AI model. Anthropic's data usage practices are governed by their own privacy policy at <a href="https://www.anthropic.com/privacy" target="_blank" rel="noopener noreferrer" className="text-brand-button hover:underline">https://www.anthropic.com/privacy</a>.
                    </p>
                    <p className="text-brand-body font-body mb-4 leading-relaxed">
                        <strong>Conversation retention:</strong> AI conversation logs may be stored in our database linked to your account for up to 24 months, or for the duration of your account, whichever is shorter. You may request deletion of your conversation history at any time by contacting us.
                    </p>
                    <p className="text-brand-body font-body mb-4 leading-relaxed">
                        <strong>No professional advice:</strong> The AI does not provide medical, psychological, legal, or financial advice. Responses are drawn from spiritual teachings and are intended for contemplative and informational purposes only.
                    </p>
                    <p className="text-brand-body font-body leading-relaxed">
                        <strong>Automated decisions:</strong> We do not use AI to make automated decisions about you that have legal or similarly significant effects.
                    </p>
                </div>

                {/* Section 6 */}
                <div id="section6" className="mb-8">
                    <h2 className="text-2xl md:text-3xl font-heading text-brand-heading mb-4">
                        6. COOKIES AND TRACKING TECHNOLOGIES
                    </h2>
                    <p className="text-brand-body font-body mb-4 leading-relaxed">
                        <strong><em>In Short:</em></strong> <em>We use cookies and similar tracking technologies to enhance your experience and analyse how our Services are used.</em>
                    </p>
                    <p className="text-brand-body font-body mb-4 leading-relaxed">
                        We use the following types of cookies and similar technologies:
                    </p>
                    <ul className="list-disc list-inside ml-4 mb-4 text-brand-body font-body space-y-2">
                        <li><strong>Essential / Strictly Necessary Cookies.</strong> These are required for the Services to function (e.g., authentication tokens, session management). You cannot opt out of these.</li>
                        <li><strong>Functional Cookies.</strong> These remember your preferences (e.g., language, display settings) to personalise your experience.</li>
                        <li><strong>Analytics Cookies.</strong> These help us understand how visitors interact with our Services (e.g., pages visited, time on site). We may use tools such as privacy-respecting analytics services for this purpose.</li>
                        <li><strong>Performance Cookies.</strong> These allow us to monitor performance of the Services and detect errors.</li>
                    </ul>
                    <p className="text-brand-body font-body mb-4 leading-relaxed">
                        <strong>Cookie consent:</strong> Where required by law, we will ask for your consent before placing non-essential cookies.
                    </p>
                    <p className="text-brand-body font-body mb-4 leading-relaxed">
                        <strong>Managing cookies:</strong> Most browsers allow you to refuse or delete cookies through their settings. Disabling essential cookies may affect the functionality of the Services.
                    </p>
                    <p className="text-brand-body font-body leading-relaxed">
                        <strong>Do-Not-Track signals:</strong> No uniform standard for recognising DNT signals has been established. We do not currently respond to DNT browser signals. See Section 13 for more details.
                    </p>
                </div>

                {/* Section 7 */}
                <div id="section7" className="mb-8">
                    <h2 className="text-2xl md:text-3xl font-heading text-brand-heading mb-4">
                        7. HOW DO WE HANDLE YOUR SOCIAL LOGINS?
                    </h2>
                    <p className="text-brand-body font-body mb-4 leading-relaxed">
                        <strong><em>In Short:</em></strong> <em>If you register or log in using a social media account, we may have access to certain information about you from that provider.</em>
                    </p>
                    <p className="text-brand-body font-body mb-4 leading-relaxed">
                        Our Services offer the ability to register and log in using third-party social media accounts (e.g., Google). When you do this, we receive profile information such as your name, email address, and profile picture from your social media provider. We use this information only to create and manage your account.
                    </p>
                    <p className="text-brand-body font-body leading-relaxed">
                        We do not have access to your social media password. Your use of social login is governed by the privacy policy of your social media provider. We recommend reviewing their policies before using this feature.
                    </p>
                </div>

                {/* Section 8 */}
                <div id="section8" className="mb-8">
                    <h2 className="text-2xl md:text-3xl font-heading text-brand-heading mb-4">
                        8. HOW LONG DO WE KEEP YOUR INFORMATION?
                    </h2>
                    <p className="text-brand-body font-body mb-4 leading-relaxed">
                        <strong><em>In Short:</em></strong> <em>We keep your information for as long as necessary to fulfil the purposes outlined in this Privacy Policy, unless a longer period is required by law.</em>
                    </p>
                    <p className="text-brand-body font-body mb-4 leading-relaxed">
                        Specific retention periods:
                    </p>
                    <ul className="list-disc list-inside ml-4 mb-4 text-brand-body font-body space-y-2">
                        <li><strong>Account data</strong> (name, email, profile): Retained for the duration of your account and for 12 months after account deletion, unless a longer period is required by law.</li>
                        <li><strong>AI conversation logs:</strong> Retained for up to 24 months from the date of the conversation, or until account deletion, whichever is earlier. Guest conversation logs are retained for up to 30 days.</li>
                        <li><strong>Payment and billing records:</strong> Retained for 7 years as required under Indian accounting and GST regulations.</li>
                        <li><strong>Security and access logs:</strong> Retained for up to 12 months to detect and investigate security incidents.</li>
                        <li><strong>Marketing consent records:</strong> Retained for as long as you are on our mailing list plus 3 years, to demonstrate consent.</li>
                        <li><strong>Support correspondence:</strong> Retained for 3 years after the issue is resolved.</li>
                    </ul>
                    <p className="text-brand-body font-body leading-relaxed">
                        When your personal information is no longer needed, we securely delete or anonymise it. If deletion is not immediately possible (e.g., data in backup archives), we isolate the information and prevent further processing until deletion is feasible.
                    </p>
                </div>

                {/* Section 9 */}
                <div id="section9" className="mb-8">
                    <h2 className="text-2xl md:text-3xl font-heading text-brand-heading mb-4">
                        9. HOW DO WE KEEP YOUR INFORMATION SAFE?
                    </h2>
                    <p className="text-brand-body font-body mb-4 leading-relaxed">
                        <strong><em>In Short:</em></strong> <em>We implement reasonable technical and organisational measures to protect your personal information.</em>
                    </p>
                    <p className="text-brand-body font-body mb-4 leading-relaxed">
                        We have implemented appropriate technical and organisational security measures, including:
                    </p>
                    <ul className="list-disc list-inside ml-4 mb-4 text-brand-body font-body space-y-2">
                        <li>Encryption of data in transit (TLS/HTTPS) and at rest</li>
                        <li>Passwords stored as salted cryptographic hashes (never in plain text)</li>
                        <li>Access controls limiting who within our team can access personal data</li>
                        <li>Regular security monitoring and logging</li>
                        <li>OTP-based email authentication to prevent unauthorised account access</li>
                        <li>Hosting on reputable cloud infrastructure (AWS, Supabase) with their own security certifications</li>
                    </ul>
                    <p className="text-brand-body font-body mb-4 leading-relaxed">
                        Despite these measures, no electronic transmission over the Internet is guaranteed to be 100% secure. You provide personal information at your own risk.
                    </p>
                    <p className="text-brand-body font-body leading-relaxed">
                        <strong>Data breach notification:</strong> In the event of a personal data breach that is likely to result in a risk to your rights and freedoms, we will notify you and the relevant authority as required by applicable law, including the DPDP Act 2023.
                    </p>
                </div>

                {/* Section 10 */}
                <div id="section10" className="mb-8">
                    <h2 className="text-2xl md:text-3xl font-heading text-brand-heading mb-4">
                        10. DO WE COLLECT INFORMATION FROM MINORS?
                    </h2>
                    <p className="text-brand-body font-body mb-4 leading-relaxed">
                        <strong><em>In Short:</em></strong> <em>We do not knowingly collect data from children under 18 years of age.</em>
                    </p>
                    <p className="text-brand-body font-body leading-relaxed">
                        We do not knowingly collect, solicit, or market to children under 18 years of age. By using the Services, you represent that you are at least 18 years old. If you become aware that a minor has provided us with personal information without parental consent, please contact us at <a href="mailto:info@arunachalasamudra.in" className="text-brand-button hover:underline">info@arunachalasamudra.in</a> and we will promptly delete such data.
                    </p>
                </div>

                {/* Section 11 */}
                <div id="section11" className="mb-8">
                    <h2 className="text-2xl md:text-3xl font-heading text-brand-heading mb-4">
                        11. WHAT ARE YOUR PRIVACY RIGHTS?
                    </h2>
                    <p className="text-brand-body font-body mb-4 leading-relaxed">
                        <strong><em>In Short:</em></strong> <em>Depending on where you are located, you have rights that allow you access to and control over your personal information.</em>
                    </p>
                    <p className="text-brand-body font-body mb-4 leading-relaxed">
                        Depending on applicable data protection laws, you may have the following rights:
                    </p>
                    <ul className="list-disc list-inside ml-4 mb-4 text-brand-body font-body space-y-2">
                        <li><strong>Right to access:</strong> Request a copy of the personal information we hold about you.</li>
                        <li><strong>Right to correction:</strong> Request correction of inaccurate or incomplete personal information.</li>
                        <li><strong>Right to erasure:</strong> Request deletion of your personal information (subject to legal retention obligations).</li>
                        <li><strong>Right to data portability:</strong> Receive your data in a structured, machine-readable format.</li>
                        <li><strong>Right to withdraw consent:</strong> Withdraw consent for processing based on consent at any time.</li>
                        <li><strong>Right to raise a grievance:</strong> Lodge a complaint with us or with the relevant data protection authority.</li>
                    </ul>
                    <h3 className="text-xl font-heading text-brand-heading mb-3">
                        Account Information
                    </h3>
                    <p className="text-brand-body font-body mb-3 leading-relaxed">
                        To review, update, or delete information in your account:
                    </p>
                    <ul className="list-disc list-inside ml-4 mb-4 text-brand-body font-body space-y-1">
                        <li>Log in to your account settings and update your information.</li>
                        <li>Email us at <a href="mailto:info@arunachalasamudra.in" className="text-brand-button hover:underline">info@arunachalasamudra.in</a> with your request.</li>
                    </ul>
                    <p className="text-brand-body font-body leading-relaxed">
                        We will respond to all requests within 30 days. If we are unable to comply with your request, we will explain why. We may need to verify your identity before processing certain requests.
                    </p>
                </div>

                {/* Section 12 */}
                <div id="section12" className="mb-8">
                    <h2 className="text-2xl md:text-3xl font-heading text-brand-heading mb-4">
                        12. RIGHTS OF INDIAN RESIDENTS (DPDP ACT 2023)
                    </h2>
                    <p className="text-brand-body font-body mb-4 leading-relaxed">
                        <strong><em>In Short:</em></strong> <em>India's Digital Personal Data Protection Act 2023 provides specific rights to Indian residents whose personal data we process.</em>
                    </p>
                    <p className="text-brand-body font-body mb-4 leading-relaxed">
                        Under the <strong>Digital Personal Data Protection Act, 2023 (DPDP Act)</strong> of India, as a Data Principal (i.e., an individual whose personal data is processed), you have the following rights:
                    </p>
                    <ul className="list-disc list-inside ml-4 mb-4 text-brand-body font-body space-y-2">
                        <li><strong>Right to information about processing (Section 11):</strong> You may request a summary of your personal data we process and a description of the entities with whom your data has been shared.</li>
                        <li><strong>Right to correction and erasure (Section 12):</strong> You may request correction of inaccurate or misleading data, completion of incomplete data, or erasure of your personal data where it is no longer needed for the purpose for which it was collected.</li>
                        <li><strong>Right to grievance redressal (Section 13):</strong> You may raise a grievance with our Grievance Officer regarding any act or omission related to your personal data. We will acknowledge and resolve your grievance within the timelines prescribed by the DPDP Act.</li>
                        <li><strong>Right to nominate (Section 14):</strong> You may nominate another individual to exercise your rights on your behalf in the event of your death or incapacity.</li>
                    </ul>
                    <p className="text-brand-body font-body mb-4 leading-relaxed">
                        <strong>Grievance Officer:</strong> In accordance with the DPDP Act and the Information Technology Act 2000, the details of our Grievance Officer are:
                    </p>
                    <div className="bg-gray-50 p-4 rounded-lg mb-4 text-brand-body font-body">
                        <p><strong>Name:</strong> R.S. Das, Manager</p>
                        <p><strong>Organisation:</strong> Arunachala Samudra</p>
                        <p><strong>Address:</strong> K-303, 49 Kalakshetra Road, Tiruvanmiyur, Chennai – 600041, Tamil Nadu, India</p>
                        <p><strong>Email:</strong> <a href="mailto:info@arunachalasamudra.in" className="text-brand-button hover:underline">info@arunachalasamudra.in</a></p>
                        <p><strong>Response time:</strong> Within 30 days of receipt of your grievance</p>
                    </div>
                    <p className="text-brand-body font-body leading-relaxed">
                        If you are not satisfied with our response, you may escalate your grievance to the <strong>Data Protection Board of India</strong>, once constituted under the DPDP Act.
                    </p>
                </div>

                {/* Section 13 */}
                <div id="section13" className="mb-8">
                    <h2 className="text-2xl md:text-3xl font-heading text-brand-heading mb-4">
                        13. CONTROLS FOR DO-NOT-TRACK FEATURES
                    </h2>
                    <p className="text-brand-body font-body leading-relaxed">
                        Most web browsers include a Do-Not-Track ('DNT') feature or setting you can activate to signal your privacy preference. No uniform technology standard for recognising and implementing DNT signals has been finalised. As such, we do not currently respond to DNT browser signals or any other mechanism that automatically communicates your choice not to be tracked online. If a standard for online tracking is adopted that we must follow in the future, we will revise this Policy accordingly.
                    </p>
                </div>

                {/* Section 14 */}
                <div id="section14" className="mb-8">
                    <h2 className="text-2xl md:text-3xl font-heading text-brand-heading mb-4">
                        14. DO WE MAKE UPDATES TO THIS POLICY?
                    </h2>
                    <p className="text-brand-body font-body mb-4 leading-relaxed">
                        <strong><em>In Short:</em></strong> <em>Yes, we will update this Policy as necessary to stay compliant with relevant laws and to reflect changes to our Services.</em>
                    </p>
                    <p className="text-brand-body font-body mb-4 leading-relaxed">
                        We may update this Privacy Policy from time to time. The updated version will be indicated by an updated "Last updated" date at the top of this Policy.
                    </p>
                    <p className="text-brand-body font-body leading-relaxed">
                        If we make material changes to this Policy, we will notify you either by prominently posting a notice of such changes or by directly sending you an email notification. We encourage you to review this Privacy Policy regularly to stay informed about how we protect your information.
                    </p>
                </div>

                {/* Section 15 */}
                <div id="section15" className="mb-8">
                    <h2 className="text-2xl md:text-3xl font-heading text-brand-heading mb-4">
                        15. HOW CAN YOU CONTACT US ABOUT THIS POLICY?
                    </h2>
                    <p className="text-brand-body font-body mb-4 leading-relaxed">
                        If you have questions, comments, or requests regarding this Privacy Policy or our data practices, please contact us:
                    </p>
                    <div className="bg-gray-50 p-4 rounded-lg mb-4 text-brand-body font-body">
                        <p><strong>R.S. Das, Manager</strong></p>
                        <p>Arunachala Samudra</p>
                        <p>K-303, 49 Kalakshetra Road</p>
                        <p>Tiruvanmiyur, Chennai – 600041</p>
                        <p>Tamil Nadu, India</p>
                        <p className="mt-2">Email: <a href="mailto:info@arunachalasamudra.in" className="text-brand-button hover:underline">info@arunachalasamudra.in</a></p>
                    </div>
                </div>

                {/* Section 16 */}
                <div id="section16" className="mb-8">
                    <h2 className="text-2xl md:text-3xl font-heading text-brand-heading mb-4">
                        16. HOW CAN YOU REVIEW, UPDATE, OR DELETE YOUR DATA?
                    </h2>
                    <p className="text-brand-body font-body mb-4 leading-relaxed">
                        Based on the applicable laws of your country or state of residence, you may have the right to request access to the personal information we collect from you, details about how we have processed it, correction of inaccuracies, or deletion of your personal information.
                    </p>
                    <p className="text-brand-body font-body mb-4 leading-relaxed">
                        To exercise these rights, you may:
                    </p>
                    <ul className="list-disc list-inside ml-4 mb-4 text-brand-body font-body space-y-2">
                        <li>Log in to your account and update your profile information directly.</li>
                        <li>Email us at <a href="mailto:info@arunachalasamudra.in" className="text-brand-button hover:underline">info@arunachalasamudra.in</a> with the subject line "Data Request" and describe your request.</li>
                    </ul>
                    <p className="text-brand-body font-body leading-relaxed">
                        We will respond within 30 days. We may need to verify your identity before processing certain requests. Some information may be retained as required by law even after an account deletion request.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Privacy;
