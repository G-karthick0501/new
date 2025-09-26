# utils/prompt_templates.py
from typing import List, Dict

def generate_interview_feedback_prompt_batch(items: list) -> str:
    """
    Creates a structured prompt for multiple Q&A items at once.
    Each item is a dict with:
    - question_text: str
    - response_text: str
    - objective: dict
    - semantic: dict
    """
    prompt = "You are an interview coach. Evaluate the following candidate responses.\n\n"
    
    for idx, item in enumerate(items, start=1):
        prompt += f"Q{idx}: {item['question_text']}\n"
        prompt += f"Response: {item['response_text']}\n"
        prompt += f"Objective metrics: {item['objective']}\n"
        prompt += f"Semantic metrics: {item['semantic']}\n\n"
    
    prompt += (
        "Provide structured feedback in JSON format for each question with the following fields:\n"
        "- strengths: list\n"
        "- weaknesses: list\n"
        "- improvement_tips: list\n\n"
        "Output should be a JSON array with one object per Q&A in the same order."
    )
    
    return prompt

def generate_context_aware_prompt(items: List[Dict]) -> str:
    """
    Creates a context-aware prompt that considers the entire interview flow.
    Each item includes previous Q&A context for better analysis.
    """
    prompt = """You are an experienced interview coach analyzing a complete interview session. 
Consider the flow, consistency, and development of responses across questions.

Interview Session Analysis:
"""
    
    for idx, item in enumerate(items, start=1):
        prompt += f"\n--- Question {idx}/{item.get('total_questions', len(items))} ---\n"
        prompt += f"Question: {item['question_text']}\n"
        prompt += f"Response: {item['response_text']}\n"
        prompt += f"Objective metrics: {item['objective']}\n"
        prompt += f"Semantic metrics: {item['semantic']}\n"
        
        # Add context from previous questions if available
        if item.get('previous_qa'):
            prompt += "\nPrevious Q&A Context:\n"
            for prev_idx, prev_qa in enumerate(item['previous_qa'], start=1):
                prompt += f"  Q{prev_idx}: {prev_qa['question']}\n"
                prompt += f"  A{prev_idx}: {prev_qa['response']}\n"
        
        prompt += "\n"
    
    prompt += """
Analyze each response considering:
1. Individual response quality
2. Consistency with previous answers
3. Interview flow and narrative development
4. Areas where responses build upon or contradict each other

Provide structured feedback in JSON format for each question:
- strengths: list of specific strengths
- weaknesses: list of areas for improvement  
- improvement_tips: list of actionable advice
- consistency_notes: observations about consistency with other responses (if applicable)

Output should be a JSON array with one object per question in the same order.
"""
    
    return prompt

def generate_single_question_prompt(question: str, response: str, objective: Dict, semantic: Dict) -> str:
    """
    Generate a focused prompt for analyzing a single Q&A pair.
    Useful for real-time feedback or detailed individual analysis.
    """
    prompt = f"""You are an interview coach. Provide detailed feedback on this candidate response.

Question: {question}
Response: {response}

Analysis Data:
Objective metrics: {objective}
Semantic metrics: {semantic}

Provide comprehensive feedback in JSON format with:
- strengths: list of specific positive aspects
- weaknesses: list of areas needing improvement
- improvement_tips: list of actionable advice
- overall_assessment: brief overall evaluation
- suggested_improvements: specific ways to enhance the response

Return only valid JSON.
"""
    return prompt

def generate_comparison_prompt(questions_responses: List[Dict]) -> str:
    """
    Generate a prompt for comparing multiple candidate responses to the same question.
    Useful for ranking or comparative analysis.
    """
    if not questions_responses:
        return ""
    
    question = questions_responses[0].get('question_text', '')
    
    prompt = f"""You are evaluating multiple candidate responses to the same interview question.

Question: {question}

Candidate Responses:
"""
    
    for idx, item in enumerate(questions_responses, start=1):
        prompt += f"\nCandidate {idx}:\n"
        prompt += f"Response: {item['response_text']}\n"
        prompt += f"Objective metrics: {item['objective']}\n"
        prompt += f"Semantic metrics: {item['semantic']}\n"
    
    prompt += """
Analyze and compare the responses. Provide feedback in JSON format:
- individual_feedback: array of feedback objects for each candidate (strengths, weaknesses, improvement_tips)
- comparative_ranking: ranking from best to worst with justification
- key_differences: main differentiators between responses
- best_practices: examples of effective elements across all responses

Return only valid JSON.
"""
    return prompt

def generate_summary_prompt(all_responses: List[Dict]) -> str:
    """
    Generate a prompt for creating an overall interview summary.
    """
    prompt = """You are creating a comprehensive interview evaluation summary.

Complete Interview Session:
"""
    
    for idx, item in enumerate(all_responses, start=1):
        prompt += f"\nQ{idx}: {item.get('question_text', '')}\n"
        prompt += f"A{idx}: {item.get('response_text', '')}\n"
        prompt += f"Objective: {item.get('objective', {})}\n"
        prompt += f"Semantic: {item.get('semantic', {})}\n"
    
    prompt += """
Provide an overall interview assessment in JSON format:
- overall_performance: summary of candidate's performance
- key_strengths: main strengths demonstrated across the interview
- key_weaknesses: main areas for improvement
- consistency_analysis: how consistent were the responses
- recommendation: overall hiring recommendation with justification
- development_areas: specific areas for candidate growth

Return only valid JSON.
"""
    return prompt