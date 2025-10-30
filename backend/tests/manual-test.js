const fs = require('fs');
const axios = require('axios');
const FormData = require('form-data');

// Test data
const testResume = 'C:/Users/91995/Downloads/Dev_Resume.pdf'; // Update this path
const jobDescription = `
 Technical Support Delivery Intern 
About the Role
As an Associate Technical Support Delivery Analyst, you will provide technical support to customers and consultants on complex products and applications. You will diagnose and troubleshoot highly technical and sophisticated application issues, report technical and functional issues/product defects to Engineering teams, and collaborate with multiple stakeholders through resolution. The Technical Support Delivery Analyst will also ensure outstanding customer experience through strong and timely communication on the status of issues as well as escalations, until an acceptable solution is delivered.
#LI-DNI
•	About You
Responsibilities:
•	Troubleshoot and resolve complex technical/functional issues related to our products & services.
•	Understanding of Cloud-based (SaaS) web application products
•	Maintain a high level of customer satisfaction by providing timely and accurate solutions.
•	Document customer interactions, issues, and resolutions in the CRM solutions like Salesforce , JIRA, etc.
•	Participate in training sessions to enhance technical knowledge and customer experience skills.
•	Maintain your knowledge of new functionality and compliance changes
•	Contribute to our Knowledge-Centered Service (KCS) by creating Knowledge articles
•	Ability to collaborate with multiple partners across a diverse organization
Qualifications:
•	Pursuing a Bachelor's degree in Computer Science, Information Technology, or related field, or equivalent experience.
•	Strong interest in technology and willingness to learn new applications.
•	Excellent problem-solving skills and the ability to think critically.
•	Strong communication and interpersonal skills, with the ability to explain technical concepts to non-technical users.
•	Basic understanding of computer systems, mobile devices, and other tech products.
•	Ability to work in a fast-paced environment and manage multiple tasks simultaneously.
•	Flexibility to work in shifts or On-call per business requirements
•	Team player with a positive attitude and strong work ethic.

`;

async function testResumeOptimization() {
    try {
        // Create form data
        const formData = new FormData();
        formData.append('resume', fs.createReadStream(testResume));
        formData.append('jobDescription', jobDescription);

        // Make API call
        const response = await axios.post('http://localhost:3000/api/resume/optimize', 
            formData, 
            {
                headers: {
                    ...formData.getHeaders()
                }
            }
        );

        console.log('\n=== Test Results ===\n');
        
        // Log optimized content
        console.log('Optimized Resume Content:');
        console.log('-----------------------');
        console.log(response.data.content.text);
        
        // Log individual sections
        console.log('\nOptimized Sections:');
        console.log('-----------------');
        Object.entries(response.data.content.sections).forEach(([section, content]) => {
            console.log(`\n${section}:`);
            console.log('-'.repeat(section.length + 1));
            console.log(content);
        });

        // Log metrics
        console.log('\nMetrics:');
        console.log('--------');
        console.log(`Job Alignment Score: ${response.data.metrics.jobAlignment}`);
        console.log(`Content Preservation Score: ${response.data.metrics.contentPreservation}`);

    } catch (error) {
        console.error('Test failed:', error.response?.data || error.message);
    }
}

// Run the test
testResumeOptimization();
