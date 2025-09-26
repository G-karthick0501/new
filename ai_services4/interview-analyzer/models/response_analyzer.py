# models/response_analyzer.py
from core import text_processor as tp, semantic_analyzer as sa, llm_enhancer as llm
from typing import List, Dict, Optional

class ResponseAnalyzer:
    def __init__(self):
        self.tp = tp.TextProcessor()
        self.sa = sa.SemanticAnalyzer()
        self.llm = llm.LLMEnhancer()

    def _validate_input(self, item: Dict) -> Optional[Dict]:
        """Validate individual Q&A item before processing"""
        question = item.get("question_text", "").strip()
        response = item.get("response_text", "").strip()
        
        if not question:
            return {"error": "Question text is required"}
        
        if not response:
            return {"error": "Response text is required"}
            
        if len(response) < 10:
            return {"error": "Response too short (minimum 10 characters)"}
            
        if len(response) > 5000:
            return {"error": "Response too long (maximum 5000 characters)"}
            
        # Check for obviously problematic responses
        if response.lower().strip() in ["i don't know", "no comment", "pass", "skip"]:
            return {"error": "Non-substantive response detected"}
            
        return None

    def _validate_metrics(self, objective: Dict, semantic: Dict) -> bool:
        """Sanity check computed metrics"""
        # Check for impossible values
        if objective.get("lexical_diversity", 0) > 1.0:
            return False
        if objective.get("pos_diversity", 0) > 1.0:
            return False
        if semantic.get("relevance_score", 0) > 1.0:
            return False
        if semantic.get("topic_coherence", 0) > 1.0:
            return False
        return True

    def analyze_batch(self, items: List[Dict]) -> List[Dict]:
        """Enhanced batch analysis with validation and context awareness"""
        # Step 1: Validate all inputs first
        validated_items = []
        results = []
        
        for i, item in enumerate(items):
            validation_error = self._validate_input(item)
            if validation_error:
                results.append({
                    "question": item.get("question_text", ""),
                    "response": item.get("response_text", ""),
                    "objective": {},
                    "semantic": {},
                    "llm_feedback": validation_error
                })
                continue
            validated_items.append((i, item))

        # Step 2: Process valid items - compute metrics first
        processed_items = []
        for original_idx, item in validated_items:
            question = item["question_text"].strip()
            response = item["response_text"].strip()

            try:
                objective = {
                    "word_count": self.tp.word_count(response),
                    "sentence_count": self.tp.sentence_count(response),
                    "avg_sentence_length": self.tp.avg_sentence_length(response),
                    "lexical_diversity": self.tp.lexical_diversity(response),
                    "pos_diversity": self.tp.pos_diversity(response),
                    "syntactic_complexity": self.tp.syntactic_complexity(response),
                }

                semantic = {
                    "relevance_score": self.sa.relevance_score(question, response),
                    "topic_coherence": self.sa.topic_coherence(response),
                }

                # Validate computed metrics
                if not self._validate_metrics(objective, semantic):
                    results.insert(original_idx, {
                        "question": question,
                        "response": response,
                        "objective": {},
                        "semantic": {},
                        "llm_feedback": {"error": "Invalid metrics computed"}
                    })
                    continue

                processed_items.append({
                    "original_idx": original_idx,
                    "question_text": question,
                    "response_text": response,
                    "objective": objective,
                    "semantic": semantic
                })

            except Exception as e:
                results.insert(original_idx, {
                    "question": question,
                    "response": response,
                    "objective": {},
                    "semantic": {},
                    "llm_feedback": {"error": f"Processing failed: {str(e)}"}
                })

        # Step 3: Call LLM enhancer with context awareness
        if processed_items:
            llm_feedback_list = self._analyze_with_context(processed_items)
            
            # Step 4: Merge LLM feedback back into results
            for i, item in enumerate(processed_items):
                result = {
                    "question": item["question_text"],
                    "response": item["response_text"],
                    "objective": item["objective"],
                    "semantic": item["semantic"],
                    "llm_feedback": llm_feedback_list[i].get("llm_feedback", {"error": "Missing LLM feedback"}) if i < len(llm_feedback_list) else {"error": "Missing LLM feedback"}
                }
                results.insert(item["original_idx"], result)

        return results

    def _analyze_with_context(self, processed_items: List[Dict]) -> List[Dict]:
        """Enhanced LLM analysis with interview context awareness"""
        # For context-aware feedback, we'll enhance the prompt to include previous Q&A context
        context_enhanced_items = []
        
        for i, item in enumerate(processed_items):
            # Add context from previous questions in the same interview session
            context_data = {
                "question_text": item["question_text"],
                "response_text": item["response_text"],
                "objective": item["objective"],
                "semantic": item["semantic"],
                "question_number": i + 1,
                "total_questions": len(processed_items)
            }
            
            # Add previous Q&A for context (if exists)
            if i > 0:
                context_data["previous_qa"] = [
                    {
                        "question": prev["question_text"],
                        "response": prev["response_text"]
                    }
                    for prev in processed_items[:i]
                ]
            
            context_enhanced_items.append(context_data)

        return self.llm.analyze_batch_with_context(context_enhanced_items)