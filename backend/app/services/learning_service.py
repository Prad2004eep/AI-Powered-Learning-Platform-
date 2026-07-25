import json
import os
from typing import Dict, List, Any
from datetime import datetime

class LearningService:
    """
    Service to make the AI learn and adapt from uploaded PDFs.
    Stores knowledge patterns and improves question generation over time.
    """
    
    def __init__(self):
        self.learning_file = "learning_cache.json"
        self.knowledge_base = self._load_learning_cache()
    
    def _load_learning_cache(self) -> Dict[str, Any]:
        """Load existing learning cache."""
        try:
            if os.path.exists(self.learning_file):
                with open(self.learning_file, 'r', encoding='utf-8') as f:
                    return json.load(f)
        except Exception as e:
            print(f"Error loading learning cache: {e}")
        return {
            "subjects": {},
            "topics": {},
            "question_patterns": {},
            "concept_relationships": {},
            "difficulty_mappings": {},
            "last_updated": None
        }
    
    def _save_learning_cache(self):
        """Save learning cache to file."""
        try:
            self.knowledge_base["last_updated"] = datetime.now().isoformat()
            with open(self.learning_file, 'w', encoding='utf-8') as f:
                json.dump(self.knowledge_base, f, indent=2, ensure_ascii=False)
        except Exception as e:
            print(f"Error saving learning cache: {e}")
    
    def learn_from_pdf(self, content_info: Dict[str, Any], chunks: List[Any]):
        """
        Learn from newly uploaded PDF content.
        """
        subject = content_info.get("subject", "General")
        grade = content_info.get("grade_level", "Unknown")
        topics = content_info.get("topics", [])
        confidence = content_info.get("confidence", 0.0)
        
        # Update subject knowledge
        if subject not in self.knowledge_base["subjects"]:
            self.knowledge_base["subjects"][subject] = {
                "topics_covered": set(),
                "grade_levels": set(),
                "common_concepts": set(),
                "question_templates": [],
                "upload_count": 0,
                "avg_confidence": 0.0
            }
        
        subject_entry = self.knowledge_base["subjects"][subject]
        subject_entry["topics_covered"].update(topics)
        subject_entry["grade_levels"].add(grade)
        subject_entry["upload_count"] += 1
        
        # Update average confidence
        current_avg = subject_entry["avg_confidence"]
        new_avg = ((current_avg * (subject_entry["upload_count"] - 1)) + confidence) / subject_entry["upload_count"]
        subject_entry["avg_confidence"] = new_avg
        
        # Extract concepts from chunks
        all_text = " ".join([chunk.text if hasattr(chunk, 'text') else str(chunk) for chunk in chunks])
        concepts = self._extract_concepts_from_text(all_text)
        subject_entry["common_concepts"].update(concepts)
        
        # Update topic knowledge
        for topic in topics:
            if topic not in self.knowledge_base["topics"]:
                self.knowledge_base["topics"][topic] = {
                    "subject": subject,
                    "concepts": set(),
                    "difficulty_distribution": {"easy": 0, "medium": 0, "hard": 0, "expert": 0},
                    "question_count": 0
                }
            
            topic_entry = self.knowledge_base["topics"][topic]
            topic_entry["concepts"].update(concepts)
            topic_entry["question_count"] += 1
        
        # Generate question patterns based on content
        question_patterns = self._generate_question_patterns(all_text, subject)
        for pattern in question_patterns:
            if pattern not in self.knowledge_base["question_patterns"]:
                self.knowledge_base["question_patterns"][pattern] = {
                    "subject": subject,
                    "topics": topics,
                    "usage_count": 0,
                    "success_rate": 0.0
                }
        
        # Save updated knowledge
        self._save_learning_cache()
        
        return {
            "learned_subjects": list(self.knowledge_base["subjects"].keys()),
            "total_concepts": len(subject_entry["common_concepts"]),
            "knowledge_updated": True
        }
    
    def _extract_concepts_from_text(self, text: str) -> List[str]:
        """Extract key concepts from text."""
        import re
        
        # Common concept patterns
        concept_patterns = [
            r'\b([A-Z][a-z]+(?:tion|ment|ness|ity|ism|er|ist|ology|graphy))\b',  # Academic terms
            r'\b(\w+ing)\b',  # Action words
            r'\b(\w+ly)\b',   # Adverbs
            r'\b(\w+ness)\b',  # Abstract nouns
        ]
        
        concepts = set()
        for pattern in concept_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            concepts.update(matches)
        
        # Extract technical terms (capitalized words)
        tech_terms = re.findall(r'\b([A-Z][a-z]+(?:[A-Z][a-z]+)*\b)', text)
        concepts.update(tech_terms)
        
        return list(concepts)[:20]  # Limit to top 20 concepts
    
    def _generate_question_patterns(self, text: str, subject: str) -> List[str]:
        """Generate question patterns based on text analysis."""
        patterns = []
        
        # Find common sentence structures
        sentences = text.split('.')
        for sentence in sentences[:10]:  # Analyze first 10 sentences
            sentence = sentence.strip()
            if len(sentence) > 20:
                if " is " in sentence:
                    patterns.append("What is [concept]?")
                elif " are " in sentence:
                    patterns.append("What are [concept]?")
                elif " how " in sentence:
                    patterns.append("How does [concept] work?")
                elif " why " in sentence:
                    patterns.append("Why is [concept] important?")
        
        return list(set(patterns))
    
    def get_enhanced_generation_params(self, subject: str, topics: List[str]) -> Dict[str, Any]:
        """
        Get enhanced parameters for question generation based on learned knowledge.
        """
        if subject not in self.knowledge_base["subjects"]:
            return {}
        
        subject_entry = self.knowledge_base["subjects"][subject]
        
        # Get most successful question patterns
        successful_patterns = [
            pattern for pattern, data in self.knowledge_base["question_patterns"].items()
            if data["subject"] == subject and data["success_rate"] > 0.7
        ]
        
        # Get common concepts for topics
        topic_concepts = {}
        for topic in topics:
            if topic in self.knowledge_base["topics"]:
                topic_concepts[topic] = list(self.knowledge_base["topics"][topic]["concepts"])
        
        return {
            "subject_expertise": subject_entry["upload_count"],
            "avg_confidence": subject_entry["avg_confidence"],
            "common_concepts": list(subject_entry["common_concepts"]),
            "successful_patterns": successful_patterns,
            "topic_concepts": topic_concepts,
            "difficulty_recommendations": self._get_difficulty_recommendations(subject)
        }
    
    def _get_difficulty_recommendations(self, subject: str) -> Dict[str, float]:
        """Get difficulty recommendations based on learned data."""
        if subject not in self.knowledge_base["subjects"]:
            return {"easy": 0.4, "medium": 0.3, "hard": 0.2, "expert": 0.1}
        
        subject_entry = self.knowledge_base["subjects"][subject]
        
        # Adjust difficulty based on grade levels covered
        if "Grade 1" in subject_entry["grade_levels"]:
            return {"easy": 0.6, "medium": 0.3, "hard": 0.1, "expert": 0.0}
        elif "Grade 3" in subject_entry["grade_levels"]:
            return {"easy": 0.3, "medium": 0.4, "hard": 0.2, "expert": 0.1}
        elif "Grade 4" in subject_entry["grade_levels"]:
            return {"easy": 0.2, "medium": 0.3, "hard": 0.4, "expert": 0.1}
        else:
            return {"easy": 0.25, "medium": 0.35, "hard": 0.3, "expert": 0.1}
    
    def update_question_performance(self, question_id: str, is_correct: bool, response_time: float):
        """
        Update learning based on question performance.
        """
        # This would be called when students answer questions
        # to improve future question generation
        pass
    
    def get_knowledge_summary(self) -> Dict[str, Any]:
        """Get summary of learned knowledge."""
        return {
            "subjects_learned": len(self.knowledge_base["subjects"]),
            "topics_covered": len(self.knowledge_base["topics"]),
            "question_patterns": len(self.knowledge_base["question_patterns"]),
            "last_updated": self.knowledge_base.get("last_updated"),
            "subject_breakdown": {
                subject: {
                    "topics": len(data["topics_covered"]),
                    "concepts": len(data["common_concepts"]),
                    "uploads": data["upload_count"],
                    "avg_confidence": data["avg_confidence"]
                }
                for subject, data in self.knowledge_base["subjects"].items()
            }
        }
