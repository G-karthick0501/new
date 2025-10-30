const axios = require('axios');

class Judge0Service {
  constructor() {
    this.apiKey = process.env.JUDGE0_API_KEY;
    this.baseURL = 'https://judge0-ce.p.rapidapi.com';
    console.log('Judge0 API Key loaded:', this.apiKey ? 'YES' : 'NO');
  }

  encodeBase64(str) {
    return Buffer.from(str).toString('base64');
  }

  decodeBase64(str) {
    return Buffer.from(str, 'base64').toString('utf-8');
  }

  async submitCode(sourceCode, languageId, stdin = '') {
    try {
      console.log('Submitting code to Judge0...');
      console.log('Source code:', sourceCode);
      console.log('Language ID:', languageId);
      
      const encodedSourceCode = this.encodeBase64(sourceCode);
      const encodedStdin = stdin ? this.encodeBase64(stdin) : '';

      // Use the EXACT format from RapidAPI
      const options = {
        method: 'POST',
        url: 'https://judge0-ce.p.rapidapi.com/submissions',
        params: {
          base64_encoded: 'true',
          wait: 'false',
          fields: '*'
        },
        headers: {
          'x-rapidapi-key': this.apiKey,
          'x-rapidapi-host': 'judge0-ce.p.rapidapi.com',
          'Content-Type': 'application/json'
        },
        data: {
          language_id: languageId,
          source_code: encodedSourceCode,
          stdin: encodedStdin
        }
      };

      const response = await axios.request(options);
      console.log('Judge0 response:', response.data);
      return response.data;
      
    } catch (error) {
      console.error('Judge0 error details:', error.response?.data || error.message);
      throw new Error('Judge0 submission failed: ' + (error.response?.data?.message || error.message));
    }
  }

  async getSubmission(token) {
    try {
      const options = {
        method: 'GET',
        url: `https://judge0-ce.p.rapidapi.com/submissions/${token}`,
        params: {
          base64_encoded: 'true',
          fields: '*'
        },
        headers: {
          'x-rapidapi-key': this.apiKey,
          'x-rapidapi-host': 'judge0-ce.p.rapidapi.com'
        }
      };

      const response = await axios.request(options);
      
      const result = response.data;
      if (result.stdout) result.stdout = this.decodeBase64(result.stdout);
      if (result.stderr) result.stderr = this.decodeBase64(result.stderr);
      if (result.compile_output) result.compile_output = this.decodeBase64(result.compile_output);

      return result;
    } catch (error) {
      console.error('Judge0 get error:', error.response?.data || error.message);
      throw new Error('Judge0 fetch failed: ' + (error.response?.data?.message || error.message));
    }
  }
}

module.exports = new Judge0Service();