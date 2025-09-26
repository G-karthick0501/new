# core/llm_enhancer.py
import json
import re
from utils.prompt_templates import generate_interview_feedback_prompt_batch, generate_context_aware_prompt
from typing import List, Dict
from core.gemini_client import call_gemini_ai

class LLMEnhancer:
    def __init__(self):
        self.max_retries = 2
        self.context_enabled = True

    def _clean_gemini_output(self, raw_output: str) -> str:
        """Clean and prepare Gemini output for JSON parsing"""
        # Remove code fences and extra whitespace
        cleaned = raw_output.strip()
        cleaned = re.sub(r'^```json\s*', '', cleaned, flags=re.MULTILINE)
        cleaned = re.sub(r'^```\s*$', '', cleaned, flags=re.MULTILINE)
        cleaned = cleaned.strip()
        
        # Handle common JSON formatting issues
        cleaned = re.sub(r',\s*}', '}', cleaned)  # Remove trailing commas
        cleaned = re.sub(r',\s*]', ']', cleaned)  # Remove trailing commas in arrays
        
        return cleaned

    def _safe_json_parse(self, raw_output: str, num_items: int) -> List[Dict]:
        """Safely parse JSON with multiple fallback strategies"""
        try:
            cleaned = self._clean_gemini_output(raw_output)
            parsed = json.loads(cleaned)
            
            # Ensure it's a list
            if not isinstance(parsed, list):
                parsed = [parsed]
            
            # Validate structure
            for item in parsed:
                if not isinstance(item, dict):
                    raise ValueError("Invalid item structure")
                # Ensure required keys exist
                for key in ['strengths', 'weaknesses', 'improvement_tips']:
                    if key not in item:
                        item[key] = []
                    elif not isinstance(item[key], list):
                        item[key] = [str(item[key])]
            
            # Pad or truncate to match expected length
            while len(parsed) < num_items:
                parsed.append({
                    "strengths": [],
                    "weaknesses": ["Could not generate complete feedback."],
                    "improvement_tips": ["Please review manually."]
                })
            
            return parsed[:num_items]
            
        except Exception as e:
            print(f"JSON parse error: {e}")
            # Return fallback structure
            return [
                {
                    "strengths": [],
                    "weaknesses": ["Could not generate LLM feedback."],
                    "improvement_tips": ["Fallback: review your answer manually."]
                }
                for _ in range(num_items)
            ]

    def analyze_batch(self, items: List[Dict]) -> List[Dict]:
        """Standard batch analysis without context awareness (backward compatibility)"""
        # Use the original prompt template
        from utils.prompt_templates import generate_interview_feedback_prompt_batch as get_llm_prompt
        
        prompt = get_llm_prompt(items)
        raw_output = call_gemini_ai(prompt)
        parsed = self._safe_json_parse(raw_output, len(items))

        # Map feedback to items
        feedback_list = []
        for idx, item in enumerate(items):
            feedback_list.append({
                "question": item.get("question_text", ""),
                "response": item.get("response_text", ""),
                "llm_feedback": parsed[idx] if idx < len(parsed) else {
                    "strengths": [], "weaknesses": ["Missing"], "improvement_tips": []
                }
            })

        return feedback_list

    def analyze_batch_with_context(self, items: List[Dict]) -> List[Dict]:
        """Enhanced batch analysis with interview context awareness"""
        if not self.context_enabled or len(items) <= 1:
            # Fall back to standard analysis if context not needed
            return self.analyze_batch(items)

        # Use context-aware prompt template
        prompt = generate_context_aware_prompt(items)
        
        # Retry mechanism for better reliability
        parsed = None
        for attempt in range(self.max_retries):
            try:
                raw_output = call_gemini_ai(prompt)
                if raw_output:
                    parsed = self._safe_json_parse(raw_output, len(items))
                    break
            except Exception as e:
                print(f"Attempt {attempt + 1} failed: {e}")
                if attempt == self.max_retries - 1:
                    parsed = self._safe_json_parse("", len(items))

        if not parsed:
            parsed = self._safe_json_parse("", len(items))

        # Map feedback to items with enhanced context info
        feedback_list = []
        for idx, item in enumerate(items):
            feedback_dict = parsed[idx] if idx < len(parsed) else {
                "strengths": [], 
                "weaknesses": ["Context analysis failed"], 
                "improvement_tips": []
            }
            
            # Add context metadata
            if "question_number" in item:
                feedback_dict["question_number"] = item["question_number"]
                feedback_dict["total_questions"] = item["total_questions"]
            
            feedback_list.append({
                "question": item.get("question_text", ""),
                "response": item.get("response_text", ""),
                "llm_feedback": feedback_dict
            })

        return feedback_list

    def set_context_enabled(self, enabled: bool):
        """Enable or disable context awareness"""
        self.context_enabled = enabled

    def get_feedback_quality_score(self, feedback: Dict) -> float:
        """Rate the quality of generated feedback (0.0 to 1.0)"""
        score = 0.0
        
        if isinstance(feedback.get("strengths"), list) and feedback["strengths"]:
            score += 0.3
            
        if isinstance(feedback.get("weaknesses"), list) and feedback["weaknesses"]:
            score += 0.3
            
        if isinstance(feedback.get("improvement_tips"), list) and feedback["improvement_tips"]:
            score += 0.4
            
        # Check for non-generic content
        all_text = " ".join(
            feedback.get("strengths", []) + 
            feedback.get("weaknesses", []) + 
            feedback.get("improvement_tips", [])
        ).lower()
        
        if "could not generate" in all_text or "fallback" in all_text:
            score *= 0.5
            
        return score