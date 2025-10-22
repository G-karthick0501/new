# ai_services4/resume-analyzer/core/jd_filter.py

import re
from typing import Dict, List, Tuple

# ============================================
# STAGE 1: RULE-BASED JUNK REMOVAL
# ============================================

# Keywords that indicate non-requirement sections (to REMOVE)
EXCLUDE_KEYWORDS = [
    "about us", "about our company", "our company", "company culture", "our culture",
    "why work with us", "why join us", "what we offer",
    "benefits", "perks", "we offer", "compensation package",
    "equal opportunity", "diversity", "discrimination", "eeo", "affirmative action",
    "apply now", "how to apply", "application process", "application instructions",
    "submit your", "send your resume",
    "disclaimer", "legal", "privacy policy", "terms and conditions",
    "location:", "office location", "work location",
    "about the role", "about this position",  # Sometimes generic intro
    "company overview", "company profile", "who we are"
]

# Keywords that indicate requirement sections (to KEEP)
INCLUDE_SECTIONS = [
    "requirements", "qualifications", "skills", "experience",
    "responsibilities", "duties", "what you'll do", "what you will do",
    "what you'll need", "what you will need",
    "must have", "required", "preferred", "nice to have",
    "technical skills", "soft skills", "competencies",
    "education", "degree", "certification",
    "job description", "role description",
    "key responsibilities", "main responsibilities"
]


def filter_junk(jd_text: str) -> str:
    """
    Stage 1: Remove obvious junk sections using keyword matching.
    
    Args:
        jd_text: Raw job description text
        
    Returns:
        Filtered text with junk sections removed
    """
    lines = jd_text.split('\n')
    filtered_lines = []
    
    for line in lines:
        line_lower = line.lower().strip()
        
        # Skip empty lines
        if len(line_lower) < 5:
            continue
            
        # Skip lines with exclude keywords
        should_exclude = False
        for keyword in EXCLUDE_KEYWORDS:
            if keyword in line_lower:
                should_exclude = True
                break
        
        if should_exclude:
            continue
            
        # Skip very short lines (likely formatting artifacts)
        if len(line.strip()) < 20:
            continue
            
        filtered_lines.append(line)
    
    return '\n'.join(filtered_lines)


# ============================================
# STAGE 2: SECTION EXTRACTION
# ============================================

def extract_requirement_sections(jd_text: str) -> str:
    """
    Stage 2: Extract only requirement-related sections using header detection.
    
    Args:
        jd_text: JD text after Stage 1 filtering
        
    Returns:
        Text containing only requirement sections
    """
    lines = jd_text.split('\n')
    sections = []
    current_section = []
    in_relevant_section = False
    
    for i, line in enumerate(lines):
        line_stripped = line.strip()
        line_lower = line_stripped.lower()
        
        # Check if this line is a section header we care about
        is_relevant_header = any(keyword in line_lower for keyword in INCLUDE_SECTIONS)
        
        # Check if this line is a new section header (but not relevant)
        is_new_section = (
            # All caps line
            (line_stripped.isupper() and len(line_stripped) > 3) or
            # Line ends with colon
            line_stripped.endswith(':') or
            # Numbered section (1., 2., etc)
            re.match(r'^\d+\.', line_stripped) or
            # Bold-like formatting markers
            line_stripped.startswith('**') or
            # Very short line that looks like header
            (len(line_stripped) < 50 and len(line_stripped.split()) <= 5)
        )
        
        if is_relevant_header:
            # Start capturing relevant section
            if current_section and in_relevant_section:
                sections.append('\n'.join(current_section))
            current_section = [line]
            in_relevant_section = True
            
        elif in_relevant_section:
            # Check if we hit a new unrelated section
            if is_new_section and not is_relevant_header:
                # Save current section and stop capturing
                if current_section:
                    sections.append('\n'.join(current_section))
                current_section = []
                in_relevant_section = False
            else:
                # Continue capturing current section
                current_section.append(line)
    
    # Add last section if still capturing
    if current_section and in_relevant_section:
        sections.append('\n'.join(current_section))
    
    return '\n\n'.join(sections)


# ============================================
# STAGE 3: QUALITY CHECK
# ============================================

def needs_llm_filtering(filtered_jd: str) -> bool:
    """
    Determine if Stage 1+2 filtering was sufficient or if LLM is needed.
    
    Args:
        filtered_jd: Text after Stage 1 and 2
        
    Returns:
        True if LLM filtering is recommended, False otherwise
    """
    word_count = len(filtered_jd.split())
    
    # If result is too short, might have over-filtered
    if word_count < 50:
        return True
    
    # If result is still very long, might need better filtering
    if word_count > 1500:
        return True
    
    # Check if we have any requirement keywords
    has_requirements = any(
        keyword in filtered_jd.lower() 
        for keyword in INCLUDE_SECTIONS
    )
    
    if not has_requirements:
        return True
    
    # Otherwise, Stage 1+2 seems sufficient
    return False


# ============================================
# MAIN FILTERING PIPELINE
# ============================================

def smart_jd_filtering(jd_text: str) -> Dict:
    """
    Multi-stage JD filtering pipeline.
    
    Args:
        jd_text: Raw job description text
        
    Returns:
        Dict with:
            - filtered_text: Cleaned JD with only requirements
            - stage_used: Which stage succeeded ('stage1', 'stage2', or 'stage3')
            - needs_llm: Whether LLM filtering is recommended
            - stats: Word count statistics
    """
    original_word_count = len(jd_text.split())
    
    # Stage 1: Remove junk
    stage1_text = filter_junk(jd_text)
    stage1_word_count = len(stage1_text.split())
    
    # Stage 2: Extract sections
    stage2_text = extract_requirement_sections(stage1_text)
    stage2_word_count = len(stage2_text.split())
    
    # Stage 3: Check if LLM needed
    needs_llm = needs_llm_filtering(stage2_text)
    
    # Determine which stage to use
    if needs_llm:
        stage_used = 'stage3_needed'
        filtered_text = stage2_text  # Return best effort for now
    else:
        stage_used = 'stage2'
        filtered_text = stage2_text
    
    return {
        'filtered_text': filtered_text,
        'stage_used': stage_used,
        'needs_llm': needs_llm,
        'stats': {
            'original_words': original_word_count,
            'after_stage1': stage1_word_count,
            'after_stage2': stage2_word_count,
            'reduction_percentage': round(
                ((original_word_count - stage2_word_count) / original_word_count * 100), 2
            ) if original_word_count > 0 else 0
        }
    }


# ============================================
# UTILITY FUNCTIONS
# ============================================

def extract_top_keywords(jd_text: str, top_n: int = 20) -> List[str]:
    """
    Extract top keywords from filtered JD for quick matching.
    
    Args:
        jd_text: Filtered JD text
        top_n: Number of top keywords to extract
        
    Returns:
        List of top keywords
    """
    # Simple keyword extraction (can be enhanced with TF-IDF later)
    words = re.findall(r'\b[a-z]{3,}\b', jd_text.lower())
    
    # Remove common stop words
    stop_words = {'the', 'and', 'for', 'with', 'you', 'will', 'are', 'our', 'this', 'that'}
    words = [w for w in words if w not in stop_words]
    
    # Count frequency
    word_freq = {}
    for word in words:
        word_freq[word] = word_freq.get(word, 0) + 1
    
    # Sort by frequency
    sorted_words = sorted(word_freq.items(), key=lambda x: x[1], reverse=True)
    
    return [word for word, _ in sorted_words[:top_n]]


if __name__ == "__main__":
    # Test with sample JD
    sample_jd = """
    About Our Company
    We are a leading tech company with 10 years of experience.
    
    Job Description
    We are looking for a Software Engineer.
    
    Requirements:
    - 5+ years of Python experience
    - Strong knowledge of Django and Flask
    - Experience with AWS
    
    Qualifications:
    - Bachelor's degree in Computer Science
    - Strong communication skills
    
    Benefits:
    - Health insurance
    - 401k matching
    - Flexible work hours
    
    How to Apply:
    Send your resume to jobs@company.com
    """
    
    result = smart_jd_filtering(sample_jd)
    print("=== JD FILTERING TEST ===")
    print(f"\nStage used: {result['stage_used']}")
    print(f"Needs LLM: {result['needs_llm']}")
    print(f"\nStats: {result['stats']}")
    print(f"\n--- Filtered Text ---\n{result['filtered_text']}")
    print(f"\n--- Top Keywords ---")
    print(extract_top_keywords(result['filtered_text']))