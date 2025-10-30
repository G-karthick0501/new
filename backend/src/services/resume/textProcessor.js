class TextProcessor {
    extractJobKeywords(jobText) {
        const keywords = new Set();
        
        if (!jobText) return [];

        const lines = jobText.split('\n');
        for (const line of lines) {
            if (line.toLowerCase().includes('require') || 
                line.toLowerCase().includes('skill') || 
                line.toLowerCase().includes('responsib')) {
                const words = line.match(/\b\w+\b/g) || [];
                for (const word of words) {
                    if (this.isValidKeyword(word)) {
                        keywords.add(word.toLowerCase());
                    }
                }
            }
        }

        // If no keywords found in requirement sections, extract from full text
        if (keywords.size === 0) {
            const words = jobText.match(/\b\w+\b/g) || [];
            const wordFreq = {};
            
            for (const word of words) {
                const lword = word.toLowerCase();
                if (this.isValidKeyword(word)) {
                    wordFreq[lword] = (wordFreq[lword] || 0) + 1;
                }
            }

            const sortedWords = Object.entries(wordFreq)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 20)
                .map(([word]) => word);

            return sortedWords;
        }

        return Array.from(keywords);
    }

    isValidKeyword(word) {
        return word.length > 2 && /^[a-zA-Z]+$/.test(word);
    }
}

module.exports = new TextProcessor();
